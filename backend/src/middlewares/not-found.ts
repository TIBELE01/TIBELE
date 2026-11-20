/**
 * Middleware « route introuvable ».
 *
 * À monter APRÈS toutes les routes : toute requête qui n'a été traitée par
 * personne reçoit une 404 au format d'erreur standard (et non la page HTML
 * par défaut d'Express).
 */
import type { RequestHandler } from 'express';
import { NotFoundError } from '../errors/index.js';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`Route introuvable : ${req.method} ${req.path}`));
};
