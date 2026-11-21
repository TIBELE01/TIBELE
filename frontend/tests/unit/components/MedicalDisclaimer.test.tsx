import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MedicalDisclaimer } from '@/components/medical/MedicalDisclaimer';

describe('MedicalDisclaimer', () => {
  it('bandeau complet : visible, annoncé comme une note, mentionne l’absence de conseil médical', () => {
    render(<MedicalDisclaimer />);
    const note = screen.getByRole('note', { name: 'Avertissement médical' });
    expect(note).toHaveTextContent(/Support pédagogique uniquement/);
    expect(note).toHaveTextContent(/aucun cas un conseil médical/);
  });

  it('version compacte', () => {
    render(<MedicalDisclaimer variant="compact" />);
    expect(screen.getByRole('note')).toHaveTextContent(/ne constitue pas un conseil médical/);
  });
});
