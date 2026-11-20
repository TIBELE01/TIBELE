import { Router } from 'express';
import { adminRouter } from './admin/index.js';
import { forumRouter } from './forum.routes.js';
import { pathologiesRouter } from './pathologies.routes.js';
import { quizRouter } from './quiz.routes.js';

/** Routeur principal, monté sous `/api`. */
export const apiRouter = Router();

apiRouter.use('/pathologies', pathologiesRouter);
apiRouter.use('/forum', forumRouter);
apiRouter.use('/quiz', quizRouter);
apiRouter.use('/admin', adminRouter);
