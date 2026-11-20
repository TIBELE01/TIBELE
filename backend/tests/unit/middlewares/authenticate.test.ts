import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServiceUnavailableError } from '../../../src/errors/index.js';

const getUser = vi.fn();
// Exception simulée à part (hors du spy) : Vitest 5 fait échouer un test dès qu'un
// spy lève une erreur, même quand le code testé l'intercepte correctement.
let thrown: Error | null = null;
vi.mock('../../../src/config/supabase.js', () => ({
  supabaseAdmin: {
    auth: {
      getUser: (token: string) => {
        if (thrown) throw thrown;
        return getUser(token);
      },
    },
  },
}));

const { authenticate, extractBearerToken } =
  await import('../../../src/middlewares/authenticate.js');

async function run(authorization?: string) {
  const req = { header: () => authorization, user: undefined } as unknown as Request;
  const next = vi.fn();
  // Le handler est asynchrone ; le type RequestHandler d'Express ne le reflète pas.
  const result = authenticate(req, {} as Response, next as unknown as NextFunction);
  await (result as unknown as Promise<void>);
  return { req, next };
}

beforeEach(() => {
  getUser.mockReset();
  thrown = null;
});

describe('extractBearerToken', () => {
  it('extrait le jeton ou renvoie null', () => {
    expect(extractBearerToken('Bearer abc.def')).toBe('abc.def');
    expect(extractBearerToken('bearer abc')).toBe('abc');
    expect(extractBearerToken('Basic abc')).toBeNull();
    expect(extractBearerToken('Bearer')).toBeNull();
    expect(extractBearerToken(undefined)).toBeNull();
  });
});

describe('authenticate', () => {
  it('401 sans jeton, sans appeler Supabase', async () => {
    const { next } = await run(undefined);
    expect(next.mock.calls[0]?.[0]).toMatchObject({ statusCode: 401, code: 'UNAUTHORIZED' });
    expect(getUser).not.toHaveBeenCalled();
  });

  it('401 si le jeton est invalide ou expiré', async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: { name: 'AuthApiError', status: 401 },
    });
    const { next } = await run('Bearer mauvais');
    expect(next.mock.calls[0]?.[0]).toMatchObject({ statusCode: 401 });
  });

  it('503 si Supabase est en panne (et non 401)', async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: { name: 'AuthRetryableFetchError', status: 0 },
    });
    const { next } = await run('Bearer abc');
    expect(next.mock.calls[0]?.[0]).toMatchObject({ statusCode: 503 });
  });

  it('503 si l’appel à Supabase lève une exception', async () => {
    thrown = new Error('réseau');
    const { next } = await run('Bearer abc');
    const error = next.mock.calls[0]?.[0] as ServiceUnavailableError;
    expect(error).toBeInstanceOf(ServiceUnavailableError);
    expect(error.statusCode).toBe(503);
    expect((error.cause as Error).message).toBe('réseau');
  });

  it('injecte req.user avec le rôle admin depuis app_metadata', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@x.ci', app_metadata: { role: 'admin' } } },
      error: null,
    });
    const { req, next } = await run('Bearer ok');
    expect(getUser).toHaveBeenCalledWith('ok');
    expect(req.user).toEqual({ id: 'u1', email: 'a@x.ci', role: 'admin' });
    expect(next).toHaveBeenCalledWith();
  });

  it('rôle user par défaut, et ignore user_metadata (modifiable par l’utilisateur)', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: 'u2', email: null, app_metadata: {}, user_metadata: { role: 'admin' } } },
      error: null,
    });
    const { req } = await run('Bearer ok');
    expect(req.user).toEqual({ id: 'u2', email: null, role: 'user' });
  });
});
