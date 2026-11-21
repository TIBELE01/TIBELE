/**
 * Client HTTP de l'API backend.
 *
 * - Attache automatiquement le jeton Supabase (`Authorization: Bearer …`) quand
 *   une session existe. Le SDK rafraîchit le jeton avant expiration.
 * - Les erreurs de l'API (`{ error: { code, message, details } }`) deviennent des `ApiError`.
 * - Délai maximal par requête (connexions mobiles instables) ; annulation possible.
 * - Sur 401 avec jeton : un rafraîchissement de session puis UNE nouvelle tentative ;
 *   si le 401 persiste, la session locale est fermée (l'interface renvoie à la connexion).
 *
 * Modes d'authentification (`auth`) :
 *   'auto'     (défaut) jeton joint s'il existe ;
 *   'required' échoue immédiatement (401) sans appeler le réseau si l'utilisateur n'est pas connecté ;
 *   'none'     jamais de jeton — à utiliser pour les endpoints publics (pathologies) :
 *              évite la requête de pré-vérification CORS et garde les réponses
 *              mises en cache par le service worker indépendantes de l'utilisateur.
 */
import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import type { ApiErrorBody } from '@/types/api';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    /** Code stable (ex. `NOT_FOUND`) ; `NETWORK_ERROR` et `TIMEOUT` sont produits côté client. */
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type AuthMode = 'auto' | 'required' | 'none';
type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, QueryValue>;
  auth?: AuthMode;
  signal?: AbortSignal | undefined;
  /** Délai maximal en ms (défaut : 20 s). */
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 20_000;

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Requête invalide.',
  401: 'Veuillez vous connecter pour continuer.',
  403: 'Vous n’avez pas les droits nécessaires.',
  404: 'Ressource introuvable.',
  409: 'Cette opération est en conflit avec l’état actuel.',
  413: 'Les données envoyées sont trop volumineuses.',
  429: 'Trop de requêtes. Réessayez dans un instant.',
};

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${env.apiUrl}/api${path.startsWith('/') ? path : `/${path}`}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/** Une tentative HTTP : gère délai, annulation et conversion des erreurs réseau. */
async function send(url: string, options: RequestOptions, token: string | null): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const onCallerAbort = () => controller.abort();
  options.signal?.addEventListener('abort', onCallerAbort, { once: true });

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    return await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
      signal: controller.signal,
    });
  } catch (err) {
    if (timedOut) {
      throw new ApiError(0, 'TIMEOUT', 'Le serveur met trop de temps à répondre. Réessayez.');
    }
    // Annulation demandée par l'appelant (ex. TanStack Query) : on la propage telle quelle.
    if (options.signal?.aborted) throw err;
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Impossible de joindre le serveur. Vérifiez votre connexion internet.',
    );
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', onCallerAbort);
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  let body: Partial<ApiErrorBody> | null = null;
  try {
    body = (await response.json()) as Partial<ApiErrorBody>;
  } catch {
    // Corps absent ou non JSON : on retombe sur un message générique.
  }
  const fallback = STATUS_MESSAGES[response.status] ?? 'Une erreur est survenue. Réessayez.';
  return new ApiError(
    response.status,
    body?.error?.code ?? 'HTTP_ERROR',
    body?.error?.message ?? fallback,
    body?.error?.details,
  );
}

/** Appelle l'API et renvoie le corps JSON (`undefined` pour une réponse 204). */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const authMode = options.auth ?? 'auto';
  const url = buildUrl(path, options.query);

  let token = authMode === 'none' ? null : await getAccessToken();
  if (authMode === 'required' && !token) {
    throw new ApiError(401, 'UNAUTHORIZED', STATUS_MESSAGES[401] as string);
  }

  let response = await send(url, options, token);

  if (response.status === 401 && token) {
    // Jeton refusé : une tentative de rafraîchissement, puis on abandonne la session.
    const { data, error } = await supabase.auth.refreshSession();
    const fresh = !error ? (data.session?.access_token ?? null) : null;
    if (fresh && fresh !== token) {
      token = fresh;
      response = await send(url, options, token);
    }
    if (response.status === 401) {
      await supabase.auth.signOut({ scope: 'local' });
    }
  }

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

type BodyOptions = Omit<RequestOptions, 'method' | 'body'>;

export const api = {
  get: <T>(path: string, options?: BodyOptions) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: BodyOptions) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: BodyOptions) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: BodyOptions) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T = void>(path: string, options?: BodyOptions) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};
