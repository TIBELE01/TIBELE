import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  addPageView,
  addSeconds,
  browserStores,
  isQuietPath,
  markShown,
  shouldShowDonationPrompt,
  snooze,
} from '@/lib/donation';

/** Intervalle de comptage du temps de navigation (secondes). */
const TICK_SECONDS = 5;

/**
 * Pilote l'affichage automatique du popup de dons.
 * `enabled` est faux quand aucun lien de don n'est configuré.
 */
export function useDonationPrompt(enabled: boolean) {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const quiet = isQuietPath(pathname);

  // Compte les pages vues (une par changement de page, y compris la première).
  useEffect(() => {
    if (enabled) addPageView(browserStores());
  }, [enabled, pathname]);

  // Compte le temps de navigation (onglet visible uniquement) et décide de l'affichage.
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      const stores = browserStores();
      if (document.visibilityState === 'visible') addSeconds(stores, TICK_SECONDS);
      if (!quiet && shouldShowDonationPrompt(stores)) {
        markShown(stores); // au maximum une fois par session
        setVisible(true);
      }
    }, TICK_SECONDS * 1000);
    return () => window.clearInterval(id);
  }, [enabled, quiet]);

  /** Fermeture : plus de popup pendant 7 jours. */
  const dismiss = useCallback(() => {
    snooze(browserStores());
    setVisible(false);
  }, []);

  return { visible: enabled && visible, dismiss };
}
