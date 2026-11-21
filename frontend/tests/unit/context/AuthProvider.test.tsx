import { act, render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fake, fakeSession, fakeUser } from '../../helpers/supabase-mock';

vi.mock('@/lib/supabase', async () => {
  const { fake } = await import('../../helpers/supabase-mock');
  return { supabase: fake.supabase };
});

const { AuthProvider } = await import('@/context/AuthProvider');
const { useAuth } = await import('@/hooks/useAuth');
const { queryClient } = await import('@/lib/queryClient');

// Dernière valeur du contexte, mise à jour dans un effet (jamais pendant le rendu)
const holder: { latest: ReturnType<typeof useAuth> | null } = { latest: null };

function Probe() {
  const auth = useAuth();
  useEffect(() => {
    holder.latest = auth;
  });
  return (
    <p data-testid="etat">
      {auth.isLoading
        ? 'chargement'
        : auth.user
          ? `${auth.user.email}|${auth.user.role}|admin=${auth.isAdmin}`
          : 'anonyme'}
    </p>
  );
}

const mount = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );

beforeEach(() => {
  fake.reset();
  holder.latest = null;
});

describe('AuthProvider — session', () => {
  it('chargement puis anonyme sans session', async () => {
    mount();
    expect(screen.getByTestId('etat')).toHaveTextContent('chargement');
    expect(await screen.findByText('anonyme')).toBeInTheDocument();
    expect(holder.latest?.isAuthenticated).toBe(false);
    expect(holder.latest?.isAdmin).toBe(false);
  });

  it('expose l’utilisateur et le rôle administrateur', async () => {
    fake.state.session = fakeSession(fakeUser({ role: 'admin' }));
    mount();
    expect(await screen.findByText('awa@exemple.ci|admin|admin=true')).toBeInTheDocument();
    expect(holder.latest?.isAuthenticated).toBe(true);
  });

  it('utilisateur standard : pas administrateur, même si user_metadata prétend le contraire', async () => {
    fake.state.session = fakeSession(fakeUser({ userRole: 'admin' }));
    mount();
    expect(await screen.findByText('awa@exemple.ci|user|admin=false')).toBeInTheDocument();
  });

  it('suit les changements de session (connexion depuis un autre onglet, déconnexion)', async () => {
    mount();
    await screen.findByText('anonyme');

    act(() => fake.emit('SIGNED_IN', fakeSession(fakeUser({ role: 'admin' }))));
    expect(await screen.findByText(/admin=true/)).toBeInTheDocument();

    const clear = vi.spyOn(queryClient, 'clear');
    act(() => fake.emit('SIGNED_OUT', null));
    expect(await screen.findByText('anonyme')).toBeInTheDocument();
    expect(clear).toHaveBeenCalled(); // plus aucune donnée personnelle en cache
  });

  it('relit le rôle côté serveur : une promotion est visible sans reconnexion', async () => {
    fake.state.session = fakeSession(fakeUser()); // jeton encore « user »
    fake.state.getUserResult = { data: { user: fakeUser({ role: 'admin' }) }, error: null };
    mount();
    expect(await screen.findByText(/\|admin\|admin=true/)).toBeInTheDocument();
  });

  it('ferme la session locale si le serveur ne reconnaît plus le compte (401)', async () => {
    fake.state.session = fakeSession(fakeUser());
    fake.state.getUserResult = { data: { user: null }, error: { status: 401 } };
    mount();
    await waitFor(() =>
      expect(fake.supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' }),
    );
    expect(await screen.findByText('anonyme')).toBeInTheDocument();
  });

  it('hors ligne : une erreur réseau de revalidation ne déconnecte pas', async () => {
    fake.state.session = fakeSession(fakeUser());
    fake.state.getUserResult = {
      data: { user: null },
      error: { status: 0, name: 'AuthRetryableFetchError' },
    };
    mount();
    await screen.findByText(/awa@exemple.ci/);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(fake.supabase.auth.signOut).not.toHaveBeenCalled();
    expect(screen.getByTestId('etat')).toHaveTextContent('awa@exemple.ci');
  });
});

describe('AuthProvider — actions', () => {
  it('signIn : succès met l’utilisateur à jour', async () => {
    mount();
    await screen.findByText('anonyme');
    const session = fakeSession(fakeUser({ role: 'user' }));
    fake.state.signInResult = { data: { user: session.user, session }, error: null };

    let result: unknown;
    await act(async () => {
      result = await holder.latest?.signIn('  awa@exemple.ci ', 'secret');
    });

    expect(result).toEqual({ ok: true });
    expect(fake.supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'awa@exemple.ci',
      password: 'secret',
    });
    expect(await screen.findByText(/awa@exemple.ci\|user/)).toBeInTheDocument();
  });

  it('signIn : identifiants invalides => message clair, utilisateur inchangé', async () => {
    mount();
    await screen.findByText('anonyme');
    fake.state.signInResult = {
      data: { user: null, session: null },
      error: { code: 'invalid_credentials', message: 'Invalid login credentials', status: 400 },
    };
    let result: unknown;
    await act(async () => {
      result = await holder.latest?.signIn('a@b.ci', 'mauvais');
    });
    expect(result).toEqual({ ok: false, message: 'Email ou mot de passe incorrect.' });
    expect(screen.getByTestId('etat')).toHaveTextContent('anonyme');
  });

  it('signUp : transmet le nom complet (lu par le trigger de création du profil)', async () => {
    mount();
    await screen.findByText('anonyme');
    fake.state.signUpResult = {
      data: { user: fakeUser({ identities: [{}] }), session: null },
      error: null,
    };

    let result: unknown;
    await act(async () => {
      result = await holder.latest?.signUp('awa@exemple.ci', 'motdepasse', '  Awa Koné ');
    });

    expect(result).toEqual({ ok: true, needsEmailConfirmation: true });
    expect(fake.supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'awa@exemple.ci',
      password: 'motdepasse',
      options: {
        data: { full_name: 'Awa Koné' },
        emailRedirectTo: `${window.location.origin}/connexion`,
      },
    });
  });

  it('signUp : email déjà inscrit (Supabase renvoie un utilisateur sans identité)', async () => {
    mount();
    await screen.findByText('anonyme');
    fake.state.signUpResult = {
      data: { user: fakeUser({ identities: [] }), session: null },
      error: null,
    };
    let result: unknown;
    await act(async () => {
      result = await holder.latest?.signUp('awa@exemple.ci', 'motdepasse');
    });
    expect(result).toMatchObject({ ok: false, message: expect.stringMatching(/existe déjà/) });
  });

  it('signOut : déconnexion locale', async () => {
    fake.state.session = fakeSession(fakeUser());
    mount();
    await screen.findByText(/awa@exemple.ci/);
    await act(async () => {
      await holder.latest?.signOut();
    });
    expect(fake.supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(await screen.findByText('anonyme')).toBeInTheDocument();
  });

  it('useAuth hors fournisseur : erreur explicite', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    function Orphan() {
      useAuth();
      return null;
    }
    expect(() => render(<Orphan />)).toThrow(/AuthProvider/);
    spy.mockRestore();
  });
});
