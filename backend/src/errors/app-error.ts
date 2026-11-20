/**
 * Erreurs applicatives.
 *
 * Toute erreur « attendue » (validation, accès refusé, ressource absente…) est
 * levée sous forme d'`AppError`. Le middleware `errorHandler` la convertit en
 * réponse JSON avec le bon statut HTTP. Les autres erreurs sont traitées comme
 * des bugs (500) et leur détail n'est jamais exposé au client.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    /** Code stable lisible par machine (ex. `UNAUTHORIZED`), utile au frontend. */
    public readonly code: string,
    message: string,
    /** Détails optionnels exposés au client (ex. erreurs de validation par champ). */
    public readonly details?: unknown,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Requête invalide', details?: unknown) {
    super(400, 'BAD_REQUEST', message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentification requise') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Accès refusé') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Ressource introuvable') {
    super(404, 'NOT_FOUND', message);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflit avec l’état actuel de la ressource') {
    super(409, 'CONFLICT', message);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Trop de requêtes, réessayez plus tard') {
    super(429, 'TOO_MANY_REQUESTS', message);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporairement indisponible', options?: { cause?: unknown }) {
    super(503, 'SERVICE_UNAVAILABLE', message, undefined, options);
  }
}
