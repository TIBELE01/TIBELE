/**
 * Règles du popup de dons (CONTEXTE §8) — logique pure, testable.
 *
 *  - Il s'affiche après 2 minutes de navigation cumulées OU 3 pages vues ;
 *  - au maximum UNE fois par session ;
 *  - fermé, il n'est plus proposé pendant 7 jours ;
 *  - tout est stocké dans le navigateur (localStorage / sessionStorage) :
 *    aucune donnée n'est envoyée ni enregistrée en base.
 *
 * Tous les accès au stockage sont protégés : navigation privée ou stockage
 * bloqué ne doivent jamais casser l'application (le popup est alors simplement
 * moins « mémorisé »).
 */
export const DONATION_RULES = {
  minSeconds: 120,
  minPageViews: 3,
  snoozeDays: 7,
} as const;

const KEYS = {
  dismissedAt: 'tibele:donation:dismissedAt', // localStorage
  shown: 'tibele:donation:shown', // sessionStorage
  seconds: 'tibele:donation:seconds', // sessionStorage
  pageViews: 'tibele:donation:pageViews', // sessionStorage
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;

type Store = Pick<Storage, 'getItem' | 'setItem'>;

function read(store: Store | undefined, key: string): string | null {
  try {
    return store?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function write(store: Store | undefined, key: string, value: string): void {
  try {
    store?.setItem(key, value);
  } catch {
    // Stockage indisponible : on ignore.
  }
}

function readNumber(store: Store | undefined, key: string): number {
  const value = Number(read(store, key));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/** Stockages du navigateur (indéfinis si inaccessibles). */
export function browserStores(): { local?: Store; session?: Store } {
  try {
    return { local: window.localStorage, session: window.sessionStorage };
  } catch {
    return {};
  }
}

export interface DonationStores {
  local?: Store | undefined;
  session?: Store | undefined;
}

/** Le popup a-t-il été fermé il y a moins de 7 jours ? */
export function isSnoozed(stores: DonationStores, now = Date.now()): boolean {
  const dismissedAt = readNumber(stores.local, KEYS.dismissedAt);
  return dismissedAt > 0 && now - dismissedAt < DONATION_RULES.snoozeDays * DAY_MS;
}

export function snooze(stores: DonationStores, now = Date.now()): void {
  write(stores.local, KEYS.dismissedAt, String(now));
}

export function wasShownThisSession(stores: DonationStores): boolean {
  return read(stores.session, KEYS.shown) === '1';
}

export function markShown(stores: DonationStores): void {
  write(stores.session, KEYS.shown, '1');
}

export function addPageView(stores: DonationStores): number {
  const next = readNumber(stores.session, KEYS.pageViews) + 1;
  write(stores.session, KEYS.pageViews, String(next));
  return next;
}

export function addSeconds(stores: DonationStores, seconds: number): number {
  const next = readNumber(stores.session, KEYS.seconds) + seconds;
  write(stores.session, KEYS.seconds, String(next));
  return next;
}

/** Faut-il afficher le popup maintenant ? */
export function shouldShowDonationPrompt(stores: DonationStores, now = Date.now()): boolean {
  if (wasShownThisSession(stores) || isSnoozed(stores, now)) return false;
  return (
    readNumber(stores.session, KEYS.seconds) >= DONATION_RULES.minSeconds ||
    readNumber(stores.session, KEYS.pageViews) >= DONATION_RULES.minPageViews
  );
}

/** Pages sur lesquelles on ne dérange jamais (saisie d'un formulaire, passage d'un quiz). */
const QUIET_PATHS = ['/connexion', '/inscription', '/quiz'];

export function isQuietPath(pathname: string): boolean {
  return QUIET_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
