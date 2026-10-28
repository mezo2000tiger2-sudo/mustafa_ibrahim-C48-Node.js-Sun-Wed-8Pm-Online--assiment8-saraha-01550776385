import joi from 'joi';
import { generalRules } from '../../common/utils/generalRules.js';

export const createIdentityRequestSchema = {
    body: joi.object({ messageId: generalRules.id.required() }).required(),
    query: joi.object({}),
};

export const getIdentityRequestsSchema = {
    query: joi.object({
        direction: joi.string().valid('received', 'sent').default('received'),
        page: joi.number().integer().min(1).max(Number.MAX_SAFE_INTEGER).default(1),
        size: joi.number().integer().min(1).max(50).default(5),
    }).custom((value, helpers) => Number.isSafeInteger((value.page - 1) * value.size)
        ? value : helpers.message('pagination exceeds the safe range')),
    body: joi.forbidden(),
};

export const decideIdentityRequestSchema = {
    params: joi.object({ requestId: generalRules.id.required() }).required(),
    body: joi.object({ status: joi.string().valid('accepted', 'rejected').required() }).required(),
    query: joi.object({}),
};
