import { useSyncExternalStore } from 'react';
import { canInstall, promptInstall, subscribeInstallPrompt } from '@/lib/pwa-install';

/** État d'installabilité de la PWA et action d'installation. */
export function useInstallPrompt() {
  const installable = useSyncExternalStore(subscribeInstallPrompt, canInstall, () => false);
  return { canInstall: installable, install: promptInstall };
}
