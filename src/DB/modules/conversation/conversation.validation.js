import joi from 'joi';
import { generalRules } from '../../common/utils/generalRules.js';

const params = joi.object({ conversationId: generalRules.id.required() }).required();
const noQuery = joi.object({});

export const getConversationsSchema = {
    query: joi.object({
        page: joi.number().integer().min(1).max(Number.MAX_SAFE_INTEGER).default(1),
        size: joi.number().integer().min(1).max(50).default(5),
    }).custom((value, helpers) => Number.isSafeInteger((value.page - 1) * value.size)
        ? value : helpers.message('pagination exceeds the safe range')),
    body: joi.forbidden(),
};

export const getConversationMessagesSchema = {
    ...getConversationsSchema,
    params,
};

export const sendConversationMessageSchema = {
    params,
    query: noQuery,
    body: joi.object({ content: joi.string().trim().max(5000).allow('') }).required(),
    files: joi.array().max(3).items(generalRules.cloudFile.keys({
        fieldname: joi.string().valid('attachments').required(),
    })),
};
