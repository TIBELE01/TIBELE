/**
 * Middleware d'authentification.
 *
 * Rôle : protéger une route en exigeant un jeton Supabase valide.
 *   1. Extrait le jeton du header `Authorization: Bearer <jeton>`.
 *   2. Le fait vérifier par Supabase (`auth.getUser`, clé service role) : cela
 *      garantit que le jeton est authentique, non expiré et que le compte existe
 *      toujours. Le backend ne voit jamais le mot de passe.
 *   3. Injecte `req.user` (id, email, rôle) pour la suite de la chaîne.
 *
 * Le rôle vient de `app_metadata`, modifiable uniquement côté serveur : un
 * utilisateur ne peut pas s'octroyer le rôle administrateur.
 *
 * Réponses : 401 si jeton absent/invalide/expiré ; 503 si Supabase est
 * injoignable (pour ne pas faire croire à un jeton invalide).
 */
import type { AuthError } from '@supabase/supabase-js';
import type { RequestHandler } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { ROLES } from '../constants/roles.js';
import { AppError, ServiceUnavailableError, UnauthorizedError } from '../errors/index.js';

const BEARER_PATTERN = /^Bearer\s+(\S+)$/i;

/** Extrait le jeton d'un header `Authorization`, ou `null` s'il est absent/mal formé. */
export function extractBearerToken(header: string | undefined): string | null {
  const match = header ? BEARER_PATTERN.exec(header) : null;
  return match?.[1] ?? null;
}

/** Vrai si l'échec vient de Supabase lui-même (réseau, 5xx) et non du jeton. */
function isUpstreamFailure(error: AuthError): boolean {
  return (
    error.name === 'AuthRetryableFetchError' ||
    (typeof error.status === 'number' && error.status >= 500)
  );
}

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const token = extractBearerToken(req.header('authorization'));
    if (!token) {
      throw new UnauthorizedError('Jeton d’authentification manquant ou mal formé');
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error) {
      if (isUpstreamFailure(error)) {
        throw new ServiceUnavailableError('Service d’authentification indisponible', {
          cause: error,
        });
      }
      throw new UnauthorizedError('Jeton invalide ou expiré');
    }
    if (!data.user) {
      throw new UnauthorizedError('Jeton invalide ou expiré');
    }

    req.user = {
      id: data.user.id,
      email: data.user.email ?? null,
      role: data.user.app_metadata?.['role'] === ROLES.ADMIN ? ROLES.ADMIN : ROLES.USER,
    };
    next();
  } catch (err) {
    // Une panne réseau levée en exception est aussi un problème côté Supabase.
    next(err instanceof AppError ? err : new ServiceUnavailableError(undefined, { cause: err }));
  }
};
