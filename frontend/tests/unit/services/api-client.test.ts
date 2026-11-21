import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fake, fakeSession, fakeUser } from '../../helpers/supabase-mock';

vi.mock('@/lib/supabase', async () => {
  const { fake } = await import('../../helpers/supabase-mock');
  return { supabase: fake.supabase };
});

const { api, apiRequest, ApiError } = await import('@/services/api/client');

// `fetch` simulé par une fonction simple (et non un spy) : Vitest 5 fait échouer un
// test dès qu'un spy rejette, même quand le code testé gère correctement l'erreur.
interface Call {
  url: string;
  headers: Record<string, string>;
  method: string;
  body: unknown;
}
let calls: Call[] = [];
let respond: (call: Call, signal: AbortSignal | null | undefined) => Promise<Response>;

const json = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

beforeEach(() => {
  fake.reset();
  calls = [];
  respond = () => json(200, { data: 'ok' });
  vi.stubGlobal('fetch', (url: string | URL, init: RequestInit = {}) => {
    const call: Call = {
      url: String(url),
      headers: (init.headers ?? {}) as Record<string, string>,
      method: init.method ?? 'GET',
      body: init.body,
    };
    calls.push(call);
    return respond(call, init.signal);
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const signIn = (token = 'jeton-1') => {
  fake.state.session = fakeSession(fakeUser(), token);
};

describe('apiRequest — jeton', () => {
  it('attache automatiquement le jeton quand une session existe', async () => {
    signIn();
    await api.get('/quiz/attempts');
    expect(calls[0]?.headers['Authorization']).toBe('Bearer jeton-1');
    expect(calls[0]?.url).toBe('http://localhost:4000/api/quiz/attempts');
  });

  it('pas de jeton sans session (mode auto)', async () => {
    await api.get('/pathologies');
    expect(calls[0]?.headers['Authorization']).toBeUndefined();
  });

  it("n'envoie JAMAIS le jeton en mode « none » (endpoints publics)", async () => {
    signIn();
    await api.get('/pathologies', { auth: 'none' });
    expect(calls[0]?.headers['Authorization']).toBeUndefined();
    expect(fake.supabase.auth.getSession).not.toHaveBeenCalled();
  });

  it('mode « required » sans session : 401 immédiat, sans appel réseau', async () => {
    const error = await apiRequest('/quiz/attempts', { auth: 'required' }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401, code: 'UNAUTHORIZED' });
    expect(calls).toHaveLength(0);
  });
});

describe('apiRequest — requêtes et réponses', () => {
  it('sérialise la query string en ignorant les valeurs vides', async () => {
    await api.get('/pathologies', {
      query: { page: 2, q: 'palu', empty: '', none: undefined, nul: null },
    });
    expect(calls[0]?.url).toBe('http://localhost:4000/api/pathologies?page=2&q=palu');
  });

  it('GET sans Content-Type (évite une pré-vérification CORS inutile) ; POST en JSON', async () => {
    await api.get('/x');
    expect(calls[0]?.headers['Content-Type']).toBeUndefined();

    await api.post('/forum/topics', { title: 'Sujet', content: 'Contenu' });
    expect(calls[1]).toMatchObject({
      method: 'POST',
      body: '{"title":"Sujet","content":"Contenu"}',
    });
    expect(calls[1]?.headers['Content-Type']).toBe('application/json');
  });

  it('renvoie le corps JSON, et undefined pour un 204', async () => {
    respond = () => json(200, { data: [1, 2], meta: { page: 1 } });
    expect(await api.get('/x')).toEqual({ data: [1, 2], meta: { page: 1 } });

    respond = () => Promise.resolve(new Response(null, { status: 204 }));
    expect(await api.delete('/admin/questions/1')).toBeUndefined();
  });
});

describe('apiRequest — erreurs', () => {
  it("convertit l'erreur de l'API en ApiError (code, message, détails)", async () => {
    respond = () =>
      json(400, {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalide',
          details: [{ path: 'title', message: 'x' }],
        },
      });
    const error = await api.post('/forum/topics', {}).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalide',
      details: [{ path: 'title', message: 'x' }],
    });
  });

  it('message générique en français si la réponse n’est pas du JSON', async () => {
    respond = () => Promise.resolve(new Response('<html>Bad gateway</html>', { status: 502 }));
    const error = await api.get('/x').catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 502, code: 'HTTP_ERROR' });
    expect((error as Error).message).not.toMatch(/html/i);
  });

  it('panne réseau => NETWORK_ERROR', async () => {
    respond = () => {
      throw new TypeError('Failed to fetch');
    };
    const error = await api.get('/x').catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });

  it('délai dépassé => TIMEOUT', async () => {
    vi.useFakeTimers();
    respond = (_call, signal) =>
      new Promise((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(new DOMException('abort', 'AbortError')));
      });
    const pending = api.get('/x', { timeoutMs: 1000 }).catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(1000);
    expect(await pending).toMatchObject({ code: 'TIMEOUT' });
  });

  it("l'annulation par l'appelant est propagée telle quelle (pas une ApiError)", async () => {
    respond = (_call, signal) =>
      new Promise((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(new DOMException('abort', 'AbortError')));
      });
    const controller = new AbortController();
    const pending = api.get('/x', { signal: controller.signal }).catch((e: unknown) => e);
    await vi.waitFor(() => expect(calls).toHaveLength(1));
    controller.abort();
    const error = await pending;
    expect(error).not.toBeInstanceOf(ApiError);
    expect((error as Error).name).toBe('AbortError');
  });
});

describe('apiRequest — jeton refusé (401)', () => {
  it('rafraîchit la session puis rejoue UNE fois avec le nouveau jeton', async () => {
    signIn('ancien');
    fake.state.refreshResult = {
      data: { session: fakeSession(fakeUser(), 'nouveau') },
      error: null,
    };
    let attempt = 0;
    respond = () =>
      ++attempt === 1
        ? json(401, { error: { code: 'UNAUTHORIZED', message: 'x' } })
        : json(200, { data: 'ok' });

    expect(await api.get('/quiz/attempts')).toEqual({ data: 'ok' });
    expect(calls).toHaveLength(2);
    expect(calls[0]?.headers['Authorization']).toBe('Bearer ancien');
    expect(calls[1]?.headers['Authorization']).toBe('Bearer nouveau');
    expect(fake.supabase.auth.signOut).not.toHaveBeenCalled();
  });

  it('si le 401 persiste : session locale fermée, ApiError 401, pas de boucle', async () => {
    signIn('ancien');
    respond = () => json(401, { error: { code: 'UNAUTHORIZED', message: 'Jeton invalide' } });

    const error = await api.get('/quiz/attempts').catch((e: unknown) => e);

    expect(error).toMatchObject({ status: 401, code: 'UNAUTHORIZED' });
    expect(fake.supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(calls.length).toBeLessThanOrEqual(2);
  });

  it('un 401 sans jeton envoyé ne ferme pas de session', async () => {
    respond = () => json(401, { error: { code: 'UNAUTHORIZED', message: 'x' } });
    await api.get('/x').catch(() => undefined);
    expect(fake.supabase.auth.signOut).not.toHaveBeenCalled();
    expect(fake.supabase.auth.refreshSession).not.toHaveBeenCalled();
  });
});
