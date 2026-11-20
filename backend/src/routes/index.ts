import { Router } from 'express';
import { forumRouter } from './forum.routes.js';
import { pathologiesRouter } from './pathologies.routes.js';

/** Routeur principal, monté sous `/api`. */
export const apiRouter = Router();

apiRouter.use('/pathologies', pathologiesRouter);
apiRouter.use('/forum', forumRouter);
