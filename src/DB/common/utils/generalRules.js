import joi from "joi";

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
        mimetype:joi.string().valid('image/png', 'image/jpg', 'image/jpeg').required(),
        destination:joi.string().required(),
        filename:joi.string().required(),
        size:joi.number().required(),
    }).message({
        'any.required':'avatar is required',
        'string.valid':'avatar must be an image file (png, jpg, jpeg)',
    })
}