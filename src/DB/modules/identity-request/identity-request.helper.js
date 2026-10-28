import conversationModel from '../../models/conversation.model.js';
import userModel from '../../models/user.model.js';
import * as dbService from '../../service/db.service.js';
import { safeProfile } from '../conversation/conversation.helper.js';

export async function requestResponse(request, message, session = null) {
    let conversationId = null;
    if (request.status === 'accepted') {
        const conversation = message.conversationId
            ? await dbService.findById({ model: conversationModel, id: message.conversationId, session }) : null;
        if (!conversation || conversation.participants.length !== 2 ||
            !message.senderId || message.senderId.equals(message.recevierId) ||
            !conversation.participants.some(id => id.equals(message.senderId)) ||
            !conversation.participants.some(id => id.equals(message.recevierId))) {
            throw new Error('conversation is unavailable', { cause: 409 });
        }
        conversationId = conversation._id.toString();
    }
    const requester = await dbService.findById({
        model: userModel, id: message.recevierId, select: '_id fName lName avatar', session,
    });
    return {
        request: {
            _id: request._id.toString(), messageId: request.messageId.toString(),
            status: request.status, requester: safeProfile(requester),
            createdAt: request.createdAt, updatedAt: request.updatedAt,
        },
        conversationId,
    };
}
