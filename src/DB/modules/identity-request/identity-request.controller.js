import { Router } from 'express';
import { authentication } from '../../common/middleware/authentecation.js';
import { validation } from '../../common/middleware/validation.js';
import { createIdentityRequestSchema, getIdentityRequestsSchema, decideIdentityRequestSchema } from './identity-request.validation.js';
import { createIdentityRequest, getIdentityRequests, decideIdentityRequest } from './identity-request.service.js';

const identityRequestRouter = Router();
identityRequestRouter.use(authentication);
identityRequestRouter.post('/', validation(createIdentityRequestSchema), createIdentityRequest);
identityRequestRouter.get('/', validation(getIdentityRequestsSchema), getIdentityRequests);
identityRequestRouter.patch('/:requestId', validation(decideIdentityRequestSchema), decideIdentityRequest);
export default identityRequestRouter;
