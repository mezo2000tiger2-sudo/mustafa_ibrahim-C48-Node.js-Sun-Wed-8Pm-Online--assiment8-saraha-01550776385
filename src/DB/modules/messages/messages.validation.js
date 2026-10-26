import joi from "joi"
import { generalRules } from "../../common/utils/generalRules.js"

export const createMessageSchema ={
    body: joi.object({
        content: joi.string(),
        recevierId:generalRules.id.required(),
    }).required(),
    files: joi.array().max(3).items(
    generalRules.file.keys({
        fieldname: joi.string().valid('attachments').required()
    })
)
}
export const getMessagesSchema ={
    query: joi.object({
        page: joi.number().default(1),
        size: joi.number().default(5),
    })
}
