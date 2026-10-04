import { Router } from "express";
import { getProfile, signIn, signUp, signUpWithGmail } from "./user.service.js";
import { authentication } from "../../common/middleware/authentecation.js";
import { authorization } from "../../common/middleware/authorization.js";
import { RoleEnum } from "../../common/enum/user.enum.js";
import { validation } from "../../common/middleware/validation.js";
import { signinSchema, signUpSchema } from "./user.validation.js";

const userRouter = Router();

userRouter.post('/signup',validation(signUpSchema),signUp)
userRouter.post('/signup/gmail',signUpWithGmail)
userRouter.post('/signin',validation(signinSchema),signIn)
userRouter.get('/profile',authentication,authorization(Object.values(RoleEnum)),getProfile)

export default userRouter;
