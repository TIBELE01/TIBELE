/**
 * Limitation du débit de requêtes (par adresse IP).
 *
 * Deux limiteurs (seuils dans constants/rate-limit.ts) :
 *   - `globalRateLimiter` : 300 requêtes / 15 minutes, sur toute l'API ;
 *   - `writeRateLimiter`  : 20 requêtes / minute, sur les routes d'écriture
 *     (seules les méthodes POST/PUT/PATCH/DELETE sont comptées, il peut donc
 *     être monté sur un routeur entier sans pénaliser les lectures).
 *
 * Au dépassement, une `TooManyRequestsError` (429) est transmise à
 * `errorHandler`, pour garder un format de réponse uniforme. Les en-têtes
 * standard `RateLimit-*` et `Retry-After` indiquent au client quand réessayer.
 *
 * Remarques :
 *   - Le compteur est en mémoire, propre à chaque instance (suffisant pour
 *     démarrer ; un store partagé type Redis sera nécessaire pour un scale
 *     horizontal strict).
 *   - Derrière un reverse proxy, `app.set('trust proxy', env.TRUST_PROXY)` doit
 *     être configuré, sinon toutes les requêtes semblent venir du proxy.
 *   - Désactivés en environnement de test (option `disabled`) pour ne pas fausser les tests.
 */
import type { RequestHandler } from 'express';
import { rateLimit, type Options } from 'express-rate-limit';
import { env } from '../config/env.js';
import { RATE_LIMIT } from '../constants/rate-limit.js';
import { TooManyRequestsError } from '../errors/index.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Options des fabriques : celles d'express-rate-limit + un interrupteur explicite. */
type LimiterOptions = Partial<Options> & {
  /** Désactive le limiteur (par défaut : actif sauf en environnement de test). */
  disabled?: boolean;
};

function build(defaults: Partial<Options>, skipSafeMethods: boolean, options: LimiterOptions) {
  const { disabled = env.isTest, ...overrides } = options;
  return rateLimit({
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(new TooManyRequestsError());
    },
    skip: (req) => disabled || (skipSafeMethods && SAFE_METHODS.has(req.method)),
    ...defaults,
    ...overrides,
  });
}

/** Fabrique du limiteur global (options surchargeables pour les tests). */
export function buildGlobalRateLimiter(options: LimiterOptions = {}): RequestHandler {
  return build(
    { windowMs: RATE_LIMIT.GLOBAL_WINDOW_MS, limit: RATE_LIMIT.GLOBAL_MAX },
    false,
    options,
  );
}

/** Fabrique du limiteur des routes d'écriture (options surchargeables pour les tests). */
export function buildWriteRateLimiter(options: LimiterOptions = {}): RequestHandler {
  return build(
    { windowMs: RATE_LIMIT.WRITE_WINDOW_MS, limit: RATE_LIMIT.WRITE_MAX },
    true,
    options,
  );
}

export const globalRateLimiter = buildGlobalRateLimiter();
export const writeRateLimiter = buildWriteRateLimiter();
