/**
 * Invitation à installer la PWA.
 *
 * Le navigateur émet `beforeinstallprompt` UNE fois, souvent avant que React
 * soit monté : l'écoute est donc démarrée dès `main.tsx` (`initInstallPrompt`)
 * et l'événement est conservé ici, en dehors de React, puis lu via
 * `useSyncExternalStore` (voir hooks/useInstallPrompt.ts).
 *
 * L'invitation disparaît toute seule une fois l'application installée
 * (événement `appinstalled`) et n'est jamais proposée si l'application tourne
 * déjà en mode installé (standalone).
 */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let initialized = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

/** Vrai si l'application est déjà lancée comme application installée. */
export function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function initInstallPrompt(): void {
  if (initialized) return;
  initialized = true;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); // on déclenche nous-mêmes l'invitation, au bon moment
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}

export function subscribeInstallPrompt(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function canInstall(): boolean {
  return deferredPrompt !== null && !isStandalone();
}

/** Affiche l'invitation native. Renvoie `true` si l'utilisateur accepte. */
export async function promptInstall(): Promise<boolean> {
  const prompt = deferredPrompt;
  if (!prompt) return false;
  deferredPrompt = null; // l'événement n'est utilisable qu'une fois
  notify();
  await prompt.prompt();
  const { outcome } = await prompt.userChoice;
  return outcome === 'accepted';
}

/** Réservé aux tests : remet le module dans son état initial. */
export function resetInstallPromptForTests(): void {
  deferredPrompt = null;
  initialized = false;
  listeners.clear();
}
