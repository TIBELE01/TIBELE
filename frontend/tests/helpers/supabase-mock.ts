/**
 * Faux client Supabase pour les tests : aucune requête réseau, comportement
 * piloté par `fake.state`. Les méthodes renvoient des valeurs (comme le vrai SDK,
 * qui renvoie `{ error }` au lieu de lever une exception).
 */
import type { Session, User } from '@supabase/supabase-js';
import { vi } from 'vitest';

type AuthListener = (event: string, session: Session | null) => void;
type AnyResult = { data: unknown; error: unknown };

export function fakeUser(
  overrides: {
    id?: string;
    email?: string;
    role?: string;
    userRole?: string;
    fullName?: string;
    identities?: unknown[];
  } = {},
): User {
  return {
    id: overrides.id ?? 'user-1',
    email: overrides.email ?? 'awa@exemple.ci',
    created_at: '2026-01-01T00:00:00Z',
    app_metadata: overrides.role ? { role: overrides.role } : {},
    user_metadata: {
      ...(overrides.fullName ? { full_name: overrides.fullName } : {}),
      ...(overrides.userRole ? { role: overrides.userRole } : {}),
    },
    identities: overrides.identities,
    aud: 'authenticated',
  } as unknown as User;
}

export function fakeSession(user: User, accessToken = 'jeton-1'): Session {
  return {
    access_token: accessToken,
    refresh_token: 'r',
    expires_in: 3600,
    token_type: 'bearer',
    user,
  } as Session;
}

function createFake() {
  let listener: AuthListener | null = null;

  const state: {
    session: Session | null;
    getUserResult: AnyResult | null;
    signInResult: AnyResult | null;
    signUpResult: AnyResult | null;
    refreshResult: AnyResult;
  } = {
    session: null,
    getUserResult: null,
    signInResult: null,
    signUpResult: null,
    refreshResult: { data: { session: null }, error: { status: 401 } },
  };

  const auth = {
    onAuthStateChange: vi.fn((callback: AuthListener) => {
      listener = callback;
      // Comme le vrai SDK : la session initiale est émise juste après l'abonnement.
      queueMicrotask(() => callback('INITIAL_SESSION', state.session));
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    }),
    getSession: vi.fn(() => Promise.resolve({ data: { session: state.session }, error: null })),
    getUser: vi.fn(() =>
      Promise.resolve(
        state.getUserResult ?? { data: { user: state.session?.user ?? null }, error: null },
      ),
    ),
    signInWithPassword: vi.fn(() =>
      Promise.resolve(state.signInResult ?? { data: { user: null, session: null }, error: null }),
    ),
    signUp: vi.fn(() =>
      Promise.resolve(state.signUpResult ?? { data: { user: null, session: null }, error: null }),
    ),
    refreshSession: vi.fn(() => Promise.resolve(state.refreshResult)),
    signOut: vi.fn(() => {
      state.session = null;
      listener?.('SIGNED_OUT', null);
      return Promise.resolve({ error: null });
    }),
  };

  return {
    supabase: { auth },
    state,
    /** Émet un événement d'authentification (ex. connexion depuis un autre onglet). */
    emit(event: string, session: Session | null) {
      state.session = session;
      listener?.(event, session);
    },
    reset() {
      listener = null;
      state.session = null;
      state.getUserResult = null;
      state.signInResult = null;
      state.signUpResult = null;
      state.refreshResult = { data: { session: null }, error: { status: 401 } };
      Object.values(auth).forEach((fn) => fn.mockClear());
    },
  };
}

export const fake = createFake();
