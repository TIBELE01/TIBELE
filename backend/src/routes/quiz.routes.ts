import { Router } from 'express';
import * as controller from '../controllers/quiz.controller.js';
import { authenticate, noStore, writeRateLimiter } from '../middlewares/index.js';

/** Quiz : toutes les routes exigent une authentification et ne sont jamais mises en cache. */
export const quizRouter = Router();

quizRouter.use(noStore);

quizRouter.get('/pathologies/:slug/questions', authenticate, controller.getQuestions);
quizRouter.post(
  '/pathologies/:slug/attempts',
  writeRateLimiter,
  authenticate,
  controller.submitAttempt,
);
quizRouter.get('/attempts', authenticate, controller.listAttempts);
quizRouter.get('/attempts/:id', authenticate, controller.getAttempt);
