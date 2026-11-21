import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { initInstallPrompt, resetInstallPromptForTests } from '@/lib/pwa-install';

function installEvent(outcome: 'accepted' | 'dismissed' = 'accepted') {
  const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: string }>;
  };
  event.prompt = vi.fn(() => Promise.resolve());
  event.userChoice = Promise.resolve({ outcome });
  return event;
}

beforeEach(() => {
  resetInstallPromptForTests();
  initInstallPrompt();
});
afterEach(() => vi.unstubAllGlobals());

describe('InstallPrompt', () => {
  it('invisible tant que le navigateur ne signale pas l’installabilité', () => {
    render(<InstallPrompt />);
    expect(screen.queryByRole('button', { name: /Installer TIBELE/ })).not.toBeInTheDocument();
  });

  it('apparaît à beforeinstallprompt (événement capturé, bannière native retenue)', () => {
    render(<InstallPrompt />);
    const event = installEvent();
    act(() => void window.dispatchEvent(event));
    expect(event.defaultPrevented).toBe(true);
    expect(screen.getByRole('button', { name: /Installer TIBELE/ })).toBeInTheDocument();
  });

  it('détecte un événement émis AVANT le montage du composant', () => {
    act(() => void window.dispatchEvent(installEvent()));
    render(<InstallPrompt />);
    expect(screen.getByRole('button', { name: /Installer TIBELE/ })).toBeInTheDocument();
  });

  it('un clic déclenche l’invitation native puis masque le bouton', async () => {
    render(<InstallPrompt />);
    const event = installEvent();
    act(() => void window.dispatchEvent(event));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Installer TIBELE/ }));
    });
    expect(event.prompt).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: /Installer TIBELE/ })).not.toBeInTheDocument();
  });

  it('disparaît automatiquement une fois l’application installée (appinstalled)', () => {
    render(<InstallPrompt />);
    act(() => void window.dispatchEvent(installEvent()));
    expect(screen.getByRole('button', { name: /Installer TIBELE/ })).toBeInTheDocument();
    act(() => void window.dispatchEvent(new Event('appinstalled')));
    expect(screen.queryByRole('button', { name: /Installer TIBELE/ })).not.toBeInTheDocument();
  });

  it('jamais proposée quand l’application tourne déjà en mode installé', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    render(<InstallPrompt />);
    act(() => void window.dispatchEvent(installEvent()));
    expect(screen.queryByRole('button', { name: /Installer TIBELE/ })).not.toBeInTheDocument();
  });
});
