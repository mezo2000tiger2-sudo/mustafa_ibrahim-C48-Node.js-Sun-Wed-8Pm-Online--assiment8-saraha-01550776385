import joi from "joi"
import { Types } from "mongoose"

export const generalRules = {
    email:joi.string().min(2).email({tlds: { allow: false }}).max(50).messages({
        'any.required':'email is required',
        'string.min':'email is at least two characters',
    }),
    password:joi.string().messages({
        'any.required':'password is required',
    }),

    file:joi.object({
        fieldname:joi.string().valid('avatar').required(),
        originalname:joi.string().required(),
        encoding:joi.string().required(),
        mimetype:joi.string().valid('image/png', 'image/jpg', 'image/jpeg').required().messages({
            'any.only':'avatar must be an image file (png, jpg, jpeg)',
        }),
        destination:joi.string().required(),
        filename:joi.string().required(),
        path: joi.string().required(),
        size:joi.number().required(),
    }).messages({
        'any.required':'avatar is required',
    }),
    token:joi.object({
      authorization: joi.string()
        .pattern(/^Bearer\s+\S+$/)
        .required()
        .messages({
          'any.required': 'authorization is required',
          'string.empty': 'authorization is required',
          'string.pattern.base': 'authorization must be in the format: Bearer <token>',
        }),
        "connection": joi.string(),
        "accept-encoding": joi.string(),
        "accept": joi.string(),
        "user-agent": joi.string(),
        "host": joi.string(),
        "content-length": joi.string(),
        "postman-token": joi.string(),
        "content-type": joi.string(),
    }).unknown(true),
    id:joi.string().custom((value, helpers) => {
        return Types.ObjectId.isValid(value) ? value : helpers.message('invalid id');
    })
}