import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fake } from '../../helpers/supabase-mock';

vi.mock('@/lib/supabase', async () => {
  const { fake } = await import('../../helpers/supabase-mock');
  return { supabase: fake.supabase };
});

const { App } = await import('@/app/App');

beforeEach(() => fake.reset());

describe('App', () => {
  it('assemble la mise en page : navigation, accueil avec avertissement médical, pied de page', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'TIBELE' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navigation principale' })).toBeInTheDocument();
    // Bandeau complet sur l'accueil + version compacte en pied de page
    expect(screen.getByRole('note', { name: 'Avertissement médical' })).toHaveTextContent(
      /aucun cas un conseil médical/,
    );
    expect(screen.getAllByRole('note')).toHaveLength(2);
    expect(await screen.findByRole('link', { name: 'Connexion' })).toBeInTheDocument();
  });

  it('propose un lien d’évitement vers le contenu principal', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: 'Aller au contenu' })).toHaveAttribute(
      'href',
      '#contenu',
    );
    expect(screen.getByRole('main')).toHaveAttribute('id', 'contenu');
  });
});
