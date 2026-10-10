import joi from "joi"
import { GenderEnum } from "../../common/enum/user.enum.js"
import { generalRules } from "../../common/utils/generalRules.js"

export const signUpSchema= {
    body:joi.object({
        fName:joi.string().min(2).max(50).alphanum().required().messages({
            'any.required':'fName is required',
            'string.min':'fName is at least two characters',
        }), 
        lName:joi.string().min(2).max(50).required(), 
        email:generalRules.email.required(), 
        password:generalRules.password.required(), 
        age:joi.number().min(18).max(120).required(),  
        gender: joi.string().valid(GenderEnum.male, GenderEnum.female),
        phone: joi.string(),
        //  cPassword:joi.string().valid(joi.ref('password')).required(), 
        // test: joi.array().items(joi.string()),
}).required(),
file:generalRules.file 
}

export const signinSchema= {
    body:joi.object({
        email:generalRules.email.required(), 
        password:generalRules.password.required(), 
}).required()
}