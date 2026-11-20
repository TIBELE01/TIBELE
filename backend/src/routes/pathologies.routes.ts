import { Router } from 'express';
import * as controller from '../controllers/pathologies.controller.js';

/** Routes publiques : consultation des pathologies (aucune authentification). */
export const pathologiesRouter = Router();

pathologiesRouter.get('/', controller.listPathologies);
pathologiesRouter.get('/:slug', controller.getPathology);
