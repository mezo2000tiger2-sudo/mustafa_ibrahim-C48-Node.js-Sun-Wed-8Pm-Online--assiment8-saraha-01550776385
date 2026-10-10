import { Router } from "express";
import { getProfile, signIn, signUp, signUpWithGmail ,signUpWithGithub } from "./user.service.js";
import { authentication } from "../../common/middleware/authentecation.js";
import { authorization } from "../../common/middleware/authorization.js";
import { RoleEnum } from "../../common/enum/user.enum.js";
import { validation } from "../../common/middleware/validation.js";
import { signinSchema, signUpSchema } from "./user.validation.js";
import { multerLocal } from "../../common/middleware/multer.js";

const userRouter = Router();


userRouter.post('/signup',multerLocal({customStorage: 'users', customTypes: ['image/png', 'image/jpg', 'image/jpeg']}).single('avatar'),validation(signUpSchema),signUp)
userRouter.post('/signup/gmail',signUpWithGmail)
userRouter.post('/signup/github',signUpWithGithub)
userRouter.post('/signin',validation(signinSchema),signIn)
userRouter.get('/profile',authentication,authorization(Object.values(RoleEnum)),getProfile)

export default userRouter;
