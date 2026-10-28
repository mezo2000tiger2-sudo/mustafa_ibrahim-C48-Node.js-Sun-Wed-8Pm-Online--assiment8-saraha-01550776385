import * as dbService from '../../service/db.service.js';
import identityRequestModel from '../../models/identity-request.model.js';
import messageModel from '../../models/message.model.js';
import conversationModel from '../../models/conversation.model.js';
import userModel from '../../models/user.model.js';
import { success_response } from '../../common/utils/successResponse.js';
import { requestResponse } from './identity-request.helper.js';

export async function createIdentityRequest(req, res) {
    let message = await dbService.findOne({
        model: messageModel,
        filter: { _id: req.body.messageId, recevierId: req.user._id },
        select: '+senderId',
    });
    if (!message) throw new Error('message not found', { cause: 404 });
    if (!message.senderId) throw new Error('sender is not logged in', { cause: 409 });
    let request = await dbService.findOne({ model: identityRequestModel, filter: { messageId: message._id } });
    let statusCode = 200;
    if (!request) {
        if (message.conversationId) throw new Error('message already belongs to a conversation', { cause: 409 });
        if (!await dbService.findById({ model: userModel, id: message.senderId, select: '_id' })) {
            throw new Error('sender identity is unavailable', { cause: 409 });
        }
        if (message.senderId.equals(message.recevierId)) {
            throw new Error('conversation participants are invalid', { cause: 409 });
        }
        try {
            [request] = await dbService.create({ model: identityRequestModel, data: { messageId: message._id } });
            statusCode = 201;
        } catch (error) {
            if (error.code !== 11000) throw error;
            request = await dbService.findOne({ model: identityRequestModel, filter: { messageId: message._id } });
        }
    }
    if (request.status === 'accepted') {
        message = await dbService.findById({ model: messageModel, id: message._id, select: '+senderId' });
        if (!message) throw new Error('conversation is unavailable', { cause: 409 });
    }
    return success_response({ res, statusCode, data: await requestResponse(request, message) });
}

export async function getIdentityRequests(req, res) {
    const page = Number(req.query.page ?? 1);
    const size = Number(req.query.size ?? 5);
    const ownerField = (req.query.direction ?? 'received') === 'received' ? 'senderId' : 'recevierId';
    const [result] = await dbService.aggregate({ model: identityRequestModel, pipeline: [
        { $lookup: { from: messageModel.collection.name, localField: 'messageId', foreignField: '_id', as: 'source' } },
        { $unwind: '$source' },
        { $match: { [`source.${ownerField}`]: req.user._id } },
        { $facet: {
            total: [{ $count: 'count' }],
            items: [{ $sort: { createdAt: -1, _id: -1 } }, { $skip: (page - 1) * size }, { $limit: size }],
        } },
    ] });
    const requests = [];
    for (const item of result.items) {
        const response = await requestResponse(item, item.source);
        requests.push({ ...response.request, conversationId: response.conversationId });
    }
    return success_response({ res, data: {
        requests, page, pages: Math.ceil((result.total[0]?.count ?? 0) / size), size,
    } });
}

export async function decideIdentityRequest(req, res) {
    const result = await dbService.transaction(async session => {
        const request = await dbService.findById({ model: identityRequestModel, id: req.params.requestId, session });
        const message = request ? await dbService.findById({
            model: messageModel, id: request.messageId, select: '+senderId', session,
        }) : null;
        if (!message?.senderId?.equals(req.user._id)) throw new Error('request not found', { cause: 404 });
        const status = req.body.status;
        if (request.status !== 'pending') {
            if (request.status !== status) throw new Error('request already decided', { cause: 409 });
            return await requestResponse(request, message, session);
        }
        const updated = await dbService.findOneAndUpdate({
            model: identityRequestModel,
            filter: { _id: request._id, status: 'pending' }, update: { $set: { status } },
            options: { new: true, runValidators: true, session },
        });
        if (!updated) throw new Error('request already decided', { cause: 409 });
        if (status === 'accepted') {
            if (message.conversationId) throw new Error('message already belongs to a conversation', { cause: 409 });
            const receiver = await dbService.findById({ model: userModel, id: message.recevierId, select: '_id', session });
            const sender = await dbService.findById({ model: userModel, id: message.senderId, select: '_id', session });
            if (!receiver || !sender || message.senderId.equals(message.recevierId)) {
                throw new Error('conversation participants are invalid', { cause: 409 });
            }
            const [conversation] = await dbService.create({
                model: conversationModel,
                data: { participants: [message.senderId, message.recevierId] }, options: { session },
            });
            const assignment = await dbService.updateOne({
                model: messageModel, filter: { _id: message._id, conversationId: null },
                update: { $set: { conversationId: conversation._id } }, options: { session, runValidators: true },
            });
            if (assignment.matchedCount !== 1) throw new Error('message already belongs to a conversation', { cause: 409 });
            message.conversationId = conversation._id;
        }
        return await requestResponse(updated, message, session);
    });
    return success_response({ res, data: result });
}
