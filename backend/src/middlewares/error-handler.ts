/**
 * Gestionnaire d'erreurs centralisé (à monter en TOUT DERNIER).
 *
 * Toute erreur passée à `next(err)` — ou levée dans un handler (Express 5
 * relaie aussi les rejets de promesses) — arrive ici et est convertie en une
 * réponse JSON uniforme :
 *
 *   { "error": { "code": "NOT_FOUND", "message": "…", "details"?: … } }
 *
 * Conversions :
 *   - `AppError`                       -> son statut et son code
 *   - `ZodError` (validation d'entrée) -> 400 avec le détail par champ
 *   - erreurs Prisma connues           -> P2002 : 409 ; P2003 : 409 ; P2025 : 404
 *   - erreurs de body-parser           -> JSON invalide : 400, corps trop gros : 413
 *   - toute autre erreur               -> 500 générique (aucune fuite de détail)
 *
 * Seules les erreurs 5xx sont journalisées (avec leur pile) : les 4xx sont des
 * erreurs du client, pas des anomalies du serveur.
 */
import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '../generated/prisma/client.js';
import { AppError } from '../errors/index.js';

interface ErrorPayload {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

const INTERNAL_ERROR: ErrorPayload = {
  status: 500,
  code: 'INTERNAL_SERVER_ERROR',
  message: 'Une erreur interne est survenue',
};

/** Erreur HTTP exposable d'un middleware tiers (ex. body-parser : `type`, `status`). */
function asClientHttpError(err: unknown): { status: number; type?: string } | null {
  if (typeof err !== 'object' || err === null) return null;
  const { status, expose, type } = err as { status?: unknown; expose?: unknown; type?: unknown };
  if (typeof status === 'number' && status >= 400 && status < 500 && expose === true) {
    return { status, type: typeof type === 'string' ? type : undefined };
  }
  return null;
}

/** Traduit n'importe quelle erreur en charge utile de réponse. */
export function toErrorPayload(err: unknown): ErrorPayload {
  if (err instanceof AppError) {
    return { status: err.statusCode, code: err.code, message: err.message, details: err.details };
  }

  if (err instanceof ZodError) {
    return {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Les données envoyées sont invalides',
      details: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    };
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': // contrainte d'unicité (ex. slug déjà utilisé)
        return { status: 409, code: 'CONFLICT', message: 'Cette ressource existe déjà' };
      case 'P2003': // violation de clé étrangère
        return { status: 409, code: 'CONFLICT', message: 'Référence invalide ou ressource liée' };
      case 'P2025': // enregistrement introuvable
        return { status: 404, code: 'NOT_FOUND', message: 'Ressource introuvable' };
    }
    return INTERNAL_ERROR;
  }

  const http = asClientHttpError(err);
  if (http) {
    if (http.type === 'entity.parse.failed') {
      return { status: 400, code: 'BAD_REQUEST', message: 'Corps de requête JSON invalide' };
    }
    if (http.type === 'entity.too.large') {
      return {
        status: 413,
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Corps de requête trop volumineux',
      };
    }
    return { status: http.status, code: 'BAD_REQUEST', message: 'Requête invalide' };
  }

  return INTERNAL_ERROR;
}

// Le 4e paramètre (`next`) est indispensable : c'est lui qui fait reconnaître
// à Express un gestionnaire d'erreurs.
export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  // Réponse déjà (partiellement) envoyée : on laisse Express fermer la connexion.
  if (res.headersSent) {
    return next(err);
  }

  const payload = toErrorPayload(err);

  if (payload.status >= 500) {
    console.error('[error]', err);
  }

  res.status(payload.status).json({
    error: {
      code: payload.code,
      message: payload.message,
      ...(payload.details !== undefined && { details: payload.details }),
    },
  });
};
