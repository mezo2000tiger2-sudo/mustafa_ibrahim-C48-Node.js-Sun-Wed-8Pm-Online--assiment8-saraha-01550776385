import { Router } from "express";
import { getProfile, signIn, signUp, signUpWithGmail } from "./user.service.js";
import { authentication } from "../../common/middleware/authentecation.js";

const userRouter = Router();

userRouter.post('/signup',signUp)
userRouter.post('/signup/gmail',signUpWithGmail)
userRouter.post('/signin',signIn)
userRouter.get('/profile',authentication,getProfile)

export default userRouter;
