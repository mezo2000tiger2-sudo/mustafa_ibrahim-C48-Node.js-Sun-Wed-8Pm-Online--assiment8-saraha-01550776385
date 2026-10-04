import joi from "joi"
import { GenderEnum } from "../../common/enum/user.enum.js"

export const signUpSchema= {
    body:joi.object({
        fName:joi.string().min(2).max(50).alphanum().required().messages({
            'any.required':'fName is required',
            'string.min':'fName is at least two characters',
        }), 
        lName:joi.string().min(2).max(50).required(), 
        email:joi.string().min(2).email({tlds: { allow: false }}).max(50).required(), 
        password:joi.string().required(), 
        //  cPassword:joi.string().valid(joi.ref('password')).required(), 
        age:joi.number().min(18).max(120).required(),  
        gender: joi.string().valid(GenderEnum.male, GenderEnum.female),
        phone: joi.string(),
        // test: joi.array().items(joi.string()),
}).required()
}
export const signinSchema= {
    body:joi.object({
        email:joi.string().min(2).email({tlds: { allow: false }}).max(50).required(), 
        password:joi.string().required(), 
}).required()
}