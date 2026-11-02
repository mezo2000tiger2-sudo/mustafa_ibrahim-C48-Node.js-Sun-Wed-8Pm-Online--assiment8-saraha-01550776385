import { Router } from 'express';
import { multerCloud } from '../../common/middleware/multer.js';
import { Multer_Enum } from '../../common/enum/multer.enum.js';
import cloudinary from '../../common/utils/cloudinary.js';
import { authentication } from '../../common/middleware/authentecation.js';
import { validation } from '../../common/middleware/validation.js';
import { getConversationsSchema, getConversationMessagesSchema, sendConversationMessageSchema } from './conversation.validation.js';
import { getConversations, getConversationMessages, sendConversationMessage } from './conversation.service.js';

const conversationRouter = Router();
conversationRouter.use(authentication);
conversationRouter.get('/', validation(getConversationsSchema), getConversations);
conversationRouter.get('/:conversationId/messages', validation(getConversationMessagesSchema), getConversationMessages);
conversationRouter.post('/:conversationId/messages',
    multerCloud({ customStorage: 'messageAttachments', customTypes: Multer_Enum.image }).array('attachments', 3),
    validation(sendConversationMessageSchema),
    sendConversationMessage,
    async (err, req, res, next) => {
        await Promise.all((req.files ?? []).map(file =>
            cloudinary.uploader.destroy(file.filename, { resource_type: file.resource_type || 'image' })
                .catch(error => console.error('Failed to delete conversation attachment:', error.message))
        ));
        req.files = [];
        next(err);
    }
);
export default conversationRouter;
