/**
 * Middleware de contrôle du rôle administrateur.
 *
 * Rôle : réserver une route (ou un routeur entier, ex. `/api/admin`) aux
 * administrateurs. DOIT être chaîné APRÈS `authenticate` :
 *
 *   router.use(authenticate, requireAdmin);
 *
 * - 401 si aucun utilisateur n'est authentifié (oubli de `authenticate`) ;
 * - 403 si l'utilisateur est authentifié mais n'est pas administrateur.
 */
import type { RequestHandler } from 'express';
import { ROLES } from '../constants/roles.js';
import { ForbiddenError, UnauthorizedError } from '../errors/index.js';

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (!req.user) {
    return next(new UnauthorizedError());
  }
  if (req.user.role !== ROLES.ADMIN) {
    return next(new ForbiddenError('Droits administrateur requis'));
  }
  next();
};
