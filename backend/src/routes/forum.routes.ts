import { Router } from 'express';
import * as controller from '../controllers/forum.controller.js';
import { authenticate, writeRateLimiter } from '../middlewares/index.js';

export const forumRouter = Router();

// Lecture : publique (les visiteurs non connectés peuvent lire, cf. CONTEXTE §6).
// Pour réserver la lecture aux connectés, ajouter `forumRouter.use(authenticate)` ici.
forumRouter.get('/topics', controller.listTopics);
forumRouter.get('/topics/:id', controller.getTopic);

// Écriture : connexion requise. Le limiteur passe AVANT l'authentification pour
// que les appels anonymes répétés soient aussi bridés.
forumRouter.post('/topics', writeRateLimiter, authenticate, controller.createTopic);
