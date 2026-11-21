import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fake, fakeSession, fakeUser } from '../../helpers/supabase-mock';

vi.mock('@/lib/supabase', async () => {
  const { fake } = await import('../../helpers/supabase-mock');
  return { supabase: fake.supabase };
});

const { AuthProvider } = await import('@/context/AuthProvider');
const { LoginPage } = await import('@/pages/auth/LoginPage');
const { RegisterPage } = await import('@/pages/auth/RegisterPage');

function renderAt(path: string, state?: unknown) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[{ pathname: path, state }]}>
        <Routes>
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/inscription" element={<RegisterPage />} />
          <Route path="/" element={<p>Page d’accueil</p>} />
          <Route path="/historique" element={<p>Page historique</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

const credentialsError = {
  data: { user: null, session: null },
  error: { code: 'invalid_credentials', message: 'Invalid login credentials', status: 400 },
};

beforeEach(() => fake.reset());

describe('LoginPage', () => {
  it('affiche le formulaire avec des champs correctement étiquetés', async () => {
    renderAt('/connexion');
    expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeInTheDocument();
    expect(screen.getByLabelText('Adresse email')).toHaveAttribute('autocomplete', 'email');
    expect(screen.getByLabelText('Mot de passe')).toHaveAttribute(
      'autocomplete',
      'current-password',
    );
    expect(screen.getByRole('link', { name: 'Créer un compte' })).toHaveAttribute(
      'href',
      '/inscription',
    );
  });

  it('champs vides : erreurs par champ, focus sur le premier, aucun appel au service', async () => {
    const user = userEvent.setup();
    renderAt('/connexion');
    await user.click(await screen.findByRole('button', { name: 'Se connecter' }));

    expect(screen.getByText('Saisissez votre adresse email.')).toBeInTheDocument();
    expect(screen.getByText('Saisissez votre mot de passe.')).toBeInTheDocument();
    const email = screen.getByLabelText('Adresse email');
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveFocus();
    expect(fake.supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it('email invalide : message dédié', async () => {
    const user = userEvent.setup();
    renderAt('/connexion');
    await user.type(await screen.findByLabelText('Adresse email'), 'pas-un-email');
    await user.type(screen.getByLabelText('Mot de passe'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(screen.getByText('Cette adresse email semble invalide.')).toBeInTheDocument();
  });

  it('identifiants incorrects : message clair, formulaire conservé', async () => {
    fake.state.signInResult = credentialsError;
    const user = userEvent.setup();
    renderAt('/connexion');
    await user.type(await screen.findByLabelText('Adresse email'), 'awa@exemple.ci');
    await user.type(screen.getByLabelText('Mot de passe'), 'mauvais');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email ou mot de passe incorrect.');
    expect(screen.getByLabelText('Adresse email')).toHaveValue('awa@exemple.ci');
    expect(screen.queryByText('Page d’accueil')).not.toBeInTheDocument();
  });

  it('succès : redirige vers la page initialement demandée', async () => {
    const session = fakeSession(fakeUser());
    fake.state.signInResult = { data: { user: session.user, session }, error: null };
    const user = userEvent.setup();
    renderAt('/connexion', { from: { pathname: '/historique', search: '' } });
    await user.type(await screen.findByLabelText('Adresse email'), 'awa@exemple.ci');
    await user.type(screen.getByLabelText('Mot de passe'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByText('Page historique')).toBeInTheDocument();
    expect(fake.supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'awa@exemple.ci',
      password: 'secret',
    });
  });

  it('succès sans page mémorisée : redirige vers l’accueil', async () => {
    const session = fakeSession(fakeUser());
    fake.state.signInResult = { data: { user: session.user, session }, error: null };
    const user = userEvent.setup();
    renderAt('/connexion');
    await user.type(await screen.findByLabelText('Adresse email'), 'awa@exemple.ci');
    await user.type(screen.getByLabelText('Mot de passe'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(await screen.findByText('Page d’accueil')).toBeInTheDocument();
  });

  it('un utilisateur déjà connecté ne voit pas le formulaire', async () => {
    fake.state.session = fakeSession(fakeUser());
    renderAt('/connexion');
    expect(await screen.findByText('Page d’accueil')).toBeInTheDocument();
  });

  it('bouton afficher / masquer le mot de passe', async () => {
    const user = userEvent.setup();
    renderAt('/connexion');
    const password = await screen.findByLabelText('Mot de passe');
    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Afficher' }));
    expect(password).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Masquer' }));
    expect(password).toHaveAttribute('type', 'password');
  });
});

describe('RegisterPage', () => {
  const fill = async (user: ReturnType<typeof userEvent.setup>, password = 'motdepasse1') => {
    await user.type(await screen.findByLabelText('Nom complet (facultatif)'), 'Awa Koné');
    await user.type(screen.getByLabelText('Adresse email'), 'awa@exemple.ci');
    await user.type(screen.getByLabelText('Mot de passe'), password);
  };

  it('validation : email, mot de passe de 8 caractères minimum', async () => {
    const user = userEvent.setup();
    renderAt('/inscription');
    await user.click(await screen.findByRole('button', { name: 'Créer mon compte' }));
    expect(screen.getByText('Saisissez votre adresse email.')).toBeInTheDocument();
    expect(screen.getByText('Choisissez un mot de passe.')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Adresse email'), 'awa@exemple.ci');
    await user.type(screen.getByLabelText('Mot de passe'), '1234567');
    await user.click(screen.getByRole('button', { name: 'Créer mon compte' }));
    expect(
      screen.getByText('Le mot de passe doit contenir au moins 8 caractères.'),
    ).toBeInTheDocument();
    expect(fake.supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it('le nom complet est facultatif', async () => {
    fake.state.signUpResult = {
      data: { user: fakeUser({ identities: [{}] }), session: null },
      error: null,
    };
    const user = userEvent.setup();
    renderAt('/inscription');
    await user.type(await screen.findByLabelText('Adresse email'), 'awa@exemple.ci');
    await user.type(screen.getByLabelText('Mot de passe'), 'motdepasse1');
    await user.click(screen.getByRole('button', { name: 'Créer mon compte' }));
    expect(fake.supabase.auth.signUp).toHaveBeenCalledOnce();
  });

  it('succès avec session ouverte : redirige', async () => {
    const session = fakeSession(fakeUser({ fullName: 'Awa Koné' }));
    fake.state.signUpResult = { data: { user: session.user, session }, error: null };
    const user = userEvent.setup();
    renderAt('/inscription');
    await fill(user);
    await user.click(screen.getByRole('button', { name: 'Créer mon compte' }));
    expect(await screen.findByText('Page d’accueil')).toBeInTheDocument();
  });

  it('confirmation d’email requise : message de succès avec l’adresse et lien vers la connexion', async () => {
    fake.state.signUpResult = {
      data: { user: fakeUser({ identities: [{}] }), session: null },
      error: null,
    };
    const user = userEvent.setup();
    renderAt('/inscription');
    await fill(user);
    await user.click(screen.getByRole('button', { name: 'Créer mon compte' }));

    expect(
      await screen.findByRole('heading', { name: 'Vérifiez votre email' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('awa@exemple.ci');
    expect(screen.getByRole('link', { name: 'Aller à la connexion' })).toHaveAttribute(
      'href',
      '/connexion',
    );
  });

  it('email déjà utilisé (identités vides) : erreur claire', async () => {
    fake.state.signUpResult = {
      data: { user: fakeUser({ identities: [] }), session: null },
      error: null,
    };
    const user = userEvent.setup();
    renderAt('/inscription');
    await fill(user);
    await user.click(screen.getByRole('button', { name: 'Créer mon compte' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Un compte existe déjà avec cette adresse email.',
    );
  });

  it('mot de passe jugé trop faible par le serveur : message clair', async () => {
    fake.state.signUpResult = {
      data: { user: null, session: null },
      error: { code: 'weak_password', message: 'Password should contain...', status: 422 },
    };
    const user = userEvent.setup();
    renderAt('/inscription');
    await fill(user, 'aaaaaaaa');
    await user.click(screen.getByRole('button', { name: 'Créer mon compte' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Mot de passe trop faible');
  });

  it('erreur réseau : message de connexion, sans détail technique', async () => {
    fake.state.signUpResult = {
      data: { user: null, session: null },
      error: { name: 'AuthRetryableFetchError', message: 'Failed to fetch', status: 0 },
    };
    const user = userEvent.setup();
    renderAt('/inscription');
    await fill(user);
    await user.click(screen.getByRole('button', { name: 'Créer mon compte' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('connexion internet');
  });

  it('lien vers la connexion', async () => {
    renderAt('/inscription');
    expect(await screen.findByRole('link', { name: 'Se connecter' })).toHaveAttribute(
      'href',
      '/connexion',
    );
  });
});
