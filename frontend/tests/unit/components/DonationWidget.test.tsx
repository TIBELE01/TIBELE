import { act, fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const DONATION_URL = 'https://pay.djamo.com/tibele';
vi.mock('@/lib/env', () => ({
  env: {
    apiUrl: 'http://x',
    supabaseUrl: 'http://x',
    supabaseAnonKey: 'k',
    donationUrl: DONATION_URL,
  },
}));

const { DonationWidget } = await import('@/components/donation/DonationWidget');

function setup(initialPath = '/') {
  const router = createMemoryRouter(
    [
      {
        element: (
          <>
            <Outlet />
            <DonationWidget />
          </>
        ),
        children: ['/', '/a', '/b', '/c', '/connexion', '/quiz/paludisme'].map((path) => ({
          path,
          element: <p>Page {path}</p>,
        })),
      },
    ],
    { initialEntries: [initialPath] },
  );
  const view = render(<RouterProvider router={router} />);
  return { router, ...view };
}

const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const dialog = () => screen.queryByRole('dialog', { name: /Soutenez TIBELE/ });

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => vi.useRealTimers());

describe('DonationWidget', () => {
  it('bouton cœur permanent vers le lien de don, popup absent au départ', () => {
    setup();
    const heart = screen.getByRole('link', { name: 'Soutenir TIBELE par un don' });
    expect(heart).toHaveAttribute('href', DONATION_URL);
    expect(heart).toHaveAttribute('target', '_blank');
    expect(heart).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(dialog()).not.toBeInTheDocument();
  });

  it('popup après 2 minutes de navigation, non modal', () => {
    setup();
    advance(115_000);
    expect(dialog()).not.toBeInTheDocument();
    advance(10_000);
    expect(dialog()).toBeInTheDocument();
    expect(dialog()).toHaveAttribute('aria-modal', 'false');
  });

  it('popup après 3 pages vues', async () => {
    const { router } = setup('/');
    await act(() => router.navigate('/a'));
    advance(5000);
    expect(dialog()).not.toBeInTheDocument(); // 2 pages vues
    await act(() => router.navigate('/b'));
    advance(5000);
    expect(dialog()).toBeInTheDocument(); // 3 pages vues
  });

  it('fermer : le popup disparaît et ne revient pas (7 jours), le cœur reste', () => {
    setup();
    advance(125_000);
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(dialog()).not.toBeInTheDocument();
    expect(Number(localStorage.getItem('tibele:donation:dismissedAt'))).toBeGreaterThan(0);
    advance(600_000);
    expect(dialog()).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Soutenir TIBELE par un don' })).toBeInTheDocument();
  });

  it('cliquer sur « Faire un don » compte aussi comme une fermeture', () => {
    setup();
    advance(125_000);
    fireEvent.click(screen.getByRole('link', { name: 'Faire un don' }));
    expect(dialog()).not.toBeInTheDocument();
    expect(localStorage.getItem('tibele:donation:dismissedAt')).not.toBeNull();
  });

  it('au maximum une fois par session, même sans l’avoir fermé', () => {
    const first = setup();
    advance(125_000);
    expect(dialog()).toBeInTheDocument();
    first.unmount();

    setup(); // nouvelle page dans la même session
    advance(600_000);
    expect(dialog()).not.toBeInTheDocument();
  });

  it('jamais pendant la connexion ni pendant un quiz', () => {
    const login = setup('/connexion');
    advance(600_000);
    expect(dialog()).not.toBeInTheDocument();
    login.unmount();
    sessionStorage.clear();

    setup('/quiz/paludisme');
    advance(600_000);
    expect(dialog()).not.toBeInTheDocument();
  });

  it('le popup ne bloque pas la navigation (aucune surcouche plein écran)', () => {
    setup();
    advance(125_000);
    const popup = dialog();
    expect(popup?.className).not.toMatch(/inset-0/);
    expect(screen.getByText('Page /')).toBeInTheDocument();
  });
});
