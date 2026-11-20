/** Paramètres de pagination de l'API. */
export const PAGINATION = {
  /** Pathologies par page, si le client ne précise pas `limit`. */
  PATHOLOGIES_DEFAULT_PAGE_SIZE: 12,
  /** Plafond de `limit` (protège la base contre les requêtes démesurées). */
  MAX_PAGE_SIZE: 50,
  /** Taille de page du forum (sujets et messages) : fixée à 10 par le contexte. */
  FORUM_PAGE_SIZE: 10,
  /** Numéro de page maximal accepté (évite les OFFSET gigantesques). */
  MAX_PAGE: 10_000,
} as const;

/** Format d'un slug : minuscules ASCII et chiffres séparés par des tirets (cf. CHECK en base). */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
