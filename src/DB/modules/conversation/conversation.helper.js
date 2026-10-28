import conversationModel from '../../models/conversation.model.js';
import * as dbService from '../../service/db.service.js';

export async function findConversation(conversationId, userId, populate) {
    const conversation = await dbService.findOne({
        model: conversationModel,
        filter: { _id: conversationId, participants: userId },
        populate,
    });
    if (!conversation) throw new Error('conversation not found', { cause: 404 });
    return conversation;
}

export function safeProfile(user) {
    if (!user) throw new Error('conversation participants are invalid', { cause: 409 });
    return {
        _id: user._id.toString(), fName: user.fName, lName: user.lName,
        // Existing local avatar paths have no protected serving route.
        avatar: /^https?:\/\//i.test(user.avatar ?? '') ? user.avatar : null,
    };
}

