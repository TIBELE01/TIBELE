import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '@/app/App';

describe('App', () => {
  it('affiche la page d’accueil avec l’avertissement médical', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'TIBELE' })).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent(/pas un outil de conseil médical/i);
  });
});
