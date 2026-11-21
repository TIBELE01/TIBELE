import { beforeEach, describe, expect, it } from 'vitest';
import {
  addPageView,
  addSeconds,
  isQuietPath,
  isSnoozed,
  markShown,
  shouldShowDonationPrompt,
  snooze,
  type DonationStores,
} from '@/lib/donation';

function memoryStore() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

const DAY = 24 * 60 * 60 * 1000;
let stores: DonationStores;
beforeEach(() => {
  stores = { local: memoryStore(), session: memoryStore() };
});

describe('règles du popup de dons', () => {
  it('ne s’affiche pas tant que les seuils ne sont pas atteints', () => {
    addSeconds(stores, 119);
    addPageView(stores);
    addPageView(stores);
    expect(shouldShowDonationPrompt(stores)).toBe(false);
  });

  it('s’affiche après 2 minutes cumulées', () => {
    addSeconds(stores, 120);
    expect(shouldShowDonationPrompt(stores)).toBe(true);
  });

  it('s’affiche après 3 pages vues', () => {
    addPageView(stores);
    addPageView(stores);
    addPageView(stores);
    expect(shouldShowDonationPrompt(stores)).toBe(true);
  });

  it('au maximum une fois par session', () => {
    addSeconds(stores, 500);
    markShown(stores);
    expect(shouldShowDonationPrompt(stores)).toBe(false);
  });

  it('fermé : plus de popup pendant 7 jours, puis de nouveau possible', () => {
    addSeconds(stores, 500);
    const t0 = 1_000_000_000_000;
    snooze(stores, t0);
    expect(isSnoozed(stores, t0 + 6 * DAY)).toBe(true);
    expect(shouldShowDonationPrompt(stores, t0 + 6 * DAY)).toBe(false);
    expect(isSnoozed(stores, t0 + 7 * DAY + 1)).toBe(false);
    expect(shouldShowDonationPrompt(stores, t0 + 7 * DAY + 1)).toBe(true);
  });

  it('survit à un stockage indisponible (navigation privée) sans exception', () => {
    const broken = {
      getItem: () => {
        throw new Error('bloqué');
      },
      setItem: () => {
        throw new Error('bloqué');
      },
    };
    const none: DonationStores = { local: broken, session: broken };
    expect(() => {
      addPageView(none);
      addSeconds(none, 5);
      snooze(none);
      markShown(none);
    }).not.toThrow();
    expect(shouldShowDonationPrompt(none)).toBe(false);
  });

  it('jamais sur les pages de formulaire ni pendant un quiz', () => {
    for (const path of ['/connexion', '/inscription', '/quiz/paludisme', '/quiz']) {
      expect(isQuietPath(path)).toBe(true);
    }
    for (const path of ['/', '/forum', '/pathologies/paludisme', '/quiz-fake']) {
      expect(isQuietPath(path)).toBe(false);
    }
  });
});
