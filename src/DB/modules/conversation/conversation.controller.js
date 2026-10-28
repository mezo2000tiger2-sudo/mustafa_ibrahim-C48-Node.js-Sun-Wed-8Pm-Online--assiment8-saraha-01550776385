import { Router } from 'express';
import { authentication } from '../../common/middleware/authentecation.js';
import { validation } from '../../common/middleware/validation.js';
import { getConversationsSchema, getConversationMessagesSchema, sendConversationMessageSchema } from './conversation.validation.js';
import { getConversations, getConversationMessages, sendConversationMessage } from './conversation.service.js';

const conversationRouter = Router();
conversationRouter.use(authentication);
conversationRouter.get('/', validation(getConversationsSchema), getConversations);
conversationRouter.get('/:conversationId/messages', validation(getConversationMessagesSchema), getConversationMessages);
conversationRouter.post('/:conversationId/messages', validation(sendConversationMessageSchema), sendConversationMessage);
export default conversationRouter;
