/**
 * Routes d'administration (`/api/admin/*`).
 *
 * TOUTES sont réservées au rôle administrateur : le garde est posé une seule
 * fois au niveau du routeur, donc impossible d'oublier de protéger une route
 * ajoutée plus tard. Ordre : limiteur d'écriture (bride aussi les appels
 * anonymes), authentification, contrôle du rôle.
 */
import { Router } from 'express';
import * as moderation from '../../controllers/admin/moderation.admin.controller.js';
import * as pathologies from '../../controllers/admin/pathologies.admin.controller.js';
import * as questions from '../../controllers/admin/questions.admin.controller.js';
import { authenticate, noStore, requireAdmin, writeRateLimiter } from '../../middlewares/index.js';

export const adminRouter = Router();

adminRouter.use(writeRateLimiter, authenticate, requireAdmin, noStore);

// Pathologies
adminRouter.post('/pathologies', pathologies.createPathology);
adminRouter.patch('/pathologies/:id', pathologies.updatePathology);
adminRouter.delete('/pathologies/:id', pathologies.deletePathology);

// Questions (rattachées à une pathologie)
adminRouter.get('/pathologies/:id/questions', questions.listQuestions);
adminRouter.post('/pathologies/:id/questions', questions.createQuestion);
adminRouter.put('/questions/:id', questions.updateQuestion);
adminRouter.delete('/questions/:id', questions.deleteQuestion);

// Modération du forum
adminRouter.delete('/forum/topics/:id', moderation.deleteTopic);
adminRouter.delete('/forum/posts/:id', moderation.deletePost);
