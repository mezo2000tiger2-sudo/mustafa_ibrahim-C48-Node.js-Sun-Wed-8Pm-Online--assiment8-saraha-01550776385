import conversationModel from '../../models/conversation.model.js';
import messageModel from '../../models/message.model.js';
import * as dbService from '../../service/db.service.js';
import { success_response } from '../../common/utils/successResponse.js';
import { findConversation, safeProfile } from './conversation.helper.js';

export async function getConversations(req, res) {
    const page = Number(req.query.page ?? 1);
    const size = Number(req.query.size ?? 5);
    const filter = { participants: req.user._id };
    const total = await dbService.countDocuments({ model: conversationModel, filter });
    const conversations = await dbService.find({
        model: conversationModel, filter,
        options: {
            sort: { createdAt: -1, _id: -1 }, skip: (page - 1) * size, limit: size,
            populate: { path: 'participants', select: '_id fName lName avatar' },
        },
    });
    return success_response({ res, data: {
        conversations: conversations.map(conversation => {
            if (conversation.participants.length !== 2) {
                throw new Error('conversation participants are invalid', { cause: 409 });
            }
            return {
                _id: conversation._id.toString(),
                participants: conversation.participants.map(safeProfile),
                createdAt: conversation.createdAt, updatedAt: conversation.updatedAt,
            };
        }),
        page, pages: Math.ceil(total / size), size,
    } });
}

export async function getConversationMessages(req, res) {
    const conversation = await findConversation(req.params.conversationId, req.user._id,
        { path: 'participants', select: '_id fName lName avatar' });
    const page = Number(req.query.page ?? 1);
    const size = Number(req.query.size ?? 5);
    const filter = { conversationId: conversation._id };
    const total = await dbService.countDocuments({ model: messageModel, filter });
    const messages = await dbService.find({
        model: messageModel, filter,
        options: { select: '+senderId', sort: { createdAt: -1, _id: -1 }, skip: (page - 1) * size, limit: size },
    });
    if (conversation.participants.length !== 2) {
        throw new Error('conversation participants are invalid', { cause: 409 });
    }
    return success_response({ res, data: {
        conversation: {
            _id: conversation._id.toString(),
            participants: conversation.participants.map(safeProfile),
            createdAt: conversation.createdAt, updatedAt: conversation.updatedAt,
        },
        messages: messages.map(message => ({
            _id: message._id.toString(),
            conversationId: message.conversationId?.toString() ?? null,
            senderId: message.senderId.toString(),
            recevierId: message.recevierId.toString(),
            content: message.content ?? null,
            attachments: [],
            createdAt: message.createdAt,
        })),
        page, pages: Math.ceil(total / size), size,
    } });
}

export async function sendConversationMessage(req, res) {
    const conversation = await findConversation(req.params.conversationId, req.user._id);
    const recevierId = conversation.participants.find(id => !id.equals(req.user._id));
    const [message] = await dbService.create({
        model: messageModel,
        data: {
            content: req.body.content.trim(), attachments: [],
            senderId: req.user._id, recevierId, conversationId: conversation._id,
        },
    });
    return success_response({ res, statusCode: 201, data: {
        chatMessage: {
            _id: message._id.toString(),
            conversationId: message.conversationId?.toString() ?? null,
            senderId: message.senderId.toString(),
            recevierId: message.recevierId.toString(),
            content: message.content ?? null,
            attachments: [],
            createdAt: message.createdAt,
        },
    } });
}
