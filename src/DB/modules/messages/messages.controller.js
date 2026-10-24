import { Router } from "express";
import { authentication } from "../../common/middleware/authentecation.js";
import { validation } from "../../common/middleware/validation.js";
import { createMessageSchema } from "./messages.validation.js";
import { multerLocal } from "../../common/middleware/multer.js";
import { Multer_Enum } from "../../common/enum/multer.enum.js";
import { createMessage, getMessageById, getMessages } from "./messages.service.js";

const messagesRouter = Router();

messagesRouter.post('/create-message',
    multerLocal({
        customStorage: 'messageAttachments',
        customTypes: Multer_Enum.image
    }).array('attachments',3)
    ,validation(createMessageSchema),createMessage)

messagesRouter.get('/get-messages',authentication,getMessages)
messagesRouter.get('/get-message-by-id/:id',authentication,getMessageById)

export default messagesRouter;
