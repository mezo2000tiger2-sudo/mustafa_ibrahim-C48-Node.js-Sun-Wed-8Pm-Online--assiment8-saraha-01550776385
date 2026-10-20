import { Router } from "express";
import { getProfile, signIn, signUp, signUpWithGmail ,signUpWithGithub, refreshToken, shareProfile, updateProfile, updatePassword, logout, confrimEmail, resendOtp } from "./user.service.js";
import { authentication } from "../../common/middleware/authentecation.js";
import { authorization } from "../../common/middleware/authorization.js";
import { RoleEnum } from "../../common/enum/user.enum.js";
import { validation } from "../../common/middleware/validation.js";
import { confrimEmailSchema, refreshTokenSchema, shareProfileSchema, signinSchema, signUpSchema, updatePasswordSchema, updateProfileSchema } from "./user.validation.js";
import { multerLocal } from "../../common/middleware/multer.js";

const userRouter = Router();

userRouter.post('/signup',multerLocal({customStorage: 'users', customTypes: ['image/png', 'image/jpg', 'image/jpeg']}).single('avatar'),validation(signUpSchema),signUp)
userRouter.post('/signup/gmail',signUpWithGmail)
userRouter.post('/signup/github',signUpWithGithub)
userRouter.post('/confrimEmail',validation(confrimEmailSchema),confrimEmail)
userRouter.post('/signin',validation(signinSchema),signIn)
userRouter.post('/refresh-token',validation(refreshTokenSchema),refreshToken)
userRouter.get('/profile',authentication,authorization(Object.values(RoleEnum)),getProfile)
userRouter.get('/share-profile/:id',validation(shareProfileSchema),shareProfile)
userRouter.patch('/update-profile',validation(updateProfileSchema),authentication,updateProfile)
userRouter.patch('/resend-otp',resendOtp)
userRouter.patch('/update-password',validation(updatePasswordSchema),authentication,updatePassword)
userRouter.patch('/logout',authentication,logout)

export default userRouter;
