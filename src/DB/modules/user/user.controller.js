import { Router } from "express";
import { getProfile, signIn, signUp, signUpWithGmail } from "./user.service.js";
import { authentication } from "../../common/middleware/authentecation.js";
import { authorization } from "../../common/middleware/authorization.js";

const userRouter = Router();

userRouter.post('/signup',signUp)
userRouter.post('/signup/gmail',signUpWithGmail)
userRouter.post('/signin',signIn)
userRouter.get('/profile',authentication,authorization(['user','admin']),getProfile)

export default userRouter;
