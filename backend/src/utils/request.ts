import type { Request } from 'express';
import type { AuthUser } from '../types/express.js';
import { UnauthorizedError } from '../errors/index.js';

/**
 * Renvoie l'utilisateur authentifié de la requête.
 * Lève une 401 si `authenticate` n'a pas été exécuté avant (erreur de câblage),
 * ce qui évite tout `req.user!` dans les contrôleurs.
 */
export function getAuthUser(req: Request): AuthUser {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}
