import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fake, fakeSession, fakeUser } from '../../helpers/supabase-mock';

vi.mock('@/lib/supabase', async () => {
  const { fake } = await import('../../helpers/supabase-mock');
  return { supabase: fake.supabase };
});

const { AuthProvider } = await import('@/context/AuthProvider');
const { Navbar } = await import('@/components/layout/Navbar');

const renderNavbar = () =>
  render(
    <AuthProvider>
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    </AuthProvider>,
  );

const desktop = () => within(screen.getByRole('navigation', { name: 'Navigation principale' }));
const linkNames = (nav: ReturnType<typeof desktop>) =>
  nav.getAllByRole('link').map((a) => a.textContent);

beforeEach(() => fake.reset());

describe('Navbar', () => {
  it('visiteur : accueil et forum, boutons Connexion / Inscription, pas d’historique ni de profil', async () => {
    renderNavbar();
    expect(await screen.findByRole('link', { name: 'Connexion' })).toHaveAttribute(
      'href',
      '/connexion',
    );
    expect(screen.getByRole('link', { name: 'Inscription' })).toHaveAttribute(
      'href',
      '/inscription',
    );
    expect(linkNames(desktop())).toEqual(['Accueil', 'Forum']);
    expect(screen.queryByRole('button', { name: 'Déconnexion' })).not.toBeInTheDocument();
  });

  it('utilisateur connecté : historique et profil, déconnexion ; pas de lien administration', async () => {
    fake.state.session = fakeSession(fakeUser());
    renderNavbar();
    expect(await screen.findByRole('button', { name: 'Déconnexion' })).toBeInTheDocument();
    expect(linkNames(desktop())).toEqual(['Accueil', 'Forum', 'Historique', 'Profil']);
    expect(screen.queryByRole('link', { name: 'Connexion' })).not.toBeInTheDocument();
  });

  it('administrateur : lien Administration visible', async () => {
    fake.state.session = fakeSession(fakeUser({ role: 'admin' }));
    renderNavbar();
    await screen.findByRole('button', { name: 'Déconnexion' });
    expect(linkNames(desktop())).toContain('Administration');
  });

  it('un faux admin (user_metadata) ne voit pas le lien Administration', async () => {
    fake.state.session = fakeSession(fakeUser({ userRole: 'admin' }));
    renderNavbar();
    await screen.findByRole('button', { name: 'Déconnexion' });
    expect(linkNames(desktop())).not.toContain('Administration');
  });

  it('menu hamburger : s’ouvre, se ferme à la sélection d’un lien et à Échap', async () => {
    const user = userEvent.setup();
    renderNavbar();
    const toggle = await screen.findByRole('button', { name: 'Ouvrir le menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('navigation', { name: 'Navigation mobile' })).not.toBeInTheDocument();

    await user.click(toggle);
    expect(screen.getByRole('button', { name: 'Fermer le menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    const mobile = within(screen.getByRole('navigation', { name: 'Navigation mobile' }));
    expect(mobile.getAllByRole('link').map((a) => a.textContent)).toEqual(['Accueil', 'Forum']);

    await user.click(mobile.getByRole('link', { name: 'Forum' }));
    expect(screen.queryByRole('navigation', { name: 'Navigation mobile' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }));
    await user.keyboard('{Escape}');
    // Échap est écouté sur l'en-tête : le focus est sur le bouton, dans l'en-tête
    expect(screen.queryByRole('navigation', { name: 'Navigation mobile' })).not.toBeInTheDocument();
  });

  it('déconnexion depuis la barre de navigation', async () => {
    fake.state.session = fakeSession(fakeUser());
    const user = userEvent.setup();
    renderNavbar();
    await user.click(await screen.findByRole('button', { name: 'Déconnexion' }));
    expect(fake.supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(await screen.findByRole('link', { name: 'Connexion' })).toBeInTheDocument();
  });
});
