import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fake, fakeSession, fakeUser } from '../../helpers/supabase-mock';

vi.mock('@/lib/supabase', async () => {
  const { fake } = await import('../../helpers/supabase-mock');
  return { supabase: fake.supabase };
});

const { AuthProvider } = await import('@/context/AuthProvider');
const { AdminRoute, ProtectedRoute } = await import('@/components/auth/ProtectedRoute');

function LoginProbe() {
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string; search: string } } | null)?.from;
  return <p>Connexion (retour : {from ? `${from.pathname}${from.search}` : 'aucun'})</p>;
}

function renderAt(path: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/connexion" element={<LoginProbe />} />
          <Route path="/" element={<p>Accueil public</p>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/historique" element={<p>Mon historique</p>} />
          </Route>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<p>Panneau admin</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

beforeEach(() => fake.reset());

describe('ProtectedRoute', () => {
  it('non connecté : redirige vers la connexion en mémorisant la page demandée', async () => {
    renderAt('/historique?page=2');
    expect(await screen.findByText('Connexion (retour : /historique?page=2)')).toBeInTheDocument();
    expect(screen.queryByText('Mon historique')).not.toBeInTheDocument();
  });

  it('connecté : affiche la page', async () => {
    fake.state.session = fakeSession(fakeUser());
    renderAt('/historique');
    expect(await screen.findByText('Mon historique')).toBeInTheDocument();
  });

  it('pendant la lecture de la session : indicateur de chargement, pas de redirection prématurée', () => {
    fake.state.session = fakeSession(fakeUser());
    renderAt('/historique');
    expect(screen.getByRole('status')).toHaveTextContent('Chargement');
    expect(screen.queryByText(/Connexion \(retour/)).not.toBeInTheDocument();
  });
});

describe('AdminRoute', () => {
  it('non connecté : redirige vers la connexion', async () => {
    renderAt('/admin');
    expect(await screen.findByText('Connexion (retour : /admin)')).toBeInTheDocument();
  });

  it('utilisateur standard : accès refusé (et pas de contenu admin)', async () => {
    fake.state.session = fakeSession(fakeUser());
    renderAt('/admin');
    expect(await screen.findByRole('heading', { name: 'Accès refusé' })).toBeInTheDocument();
    expect(screen.queryByText('Panneau admin')).not.toBeInTheDocument();
  });

  it('administrateur : affiche la page', async () => {
    fake.state.session = fakeSession(fakeUser({ role: 'admin' }));
    renderAt('/admin');
    expect(await screen.findByText('Panneau admin')).toBeInTheDocument();
  });

  it('un utilisateur qui prétend être admin via user_metadata est refusé', async () => {
    fake.state.session = fakeSession(fakeUser({ userRole: 'admin' }));
    renderAt('/admin');
    expect(await screen.findByRole('heading', { name: 'Accès refusé' })).toBeInTheDocument();
  });
});
