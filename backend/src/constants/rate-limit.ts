/** Seuils de limitation du débit (par adresse IP). */
export const RATE_LIMIT = {
  /** Toute l'API : requêtes autorisées par fenêtre de 15 minutes. */
  GLOBAL_MAX: 300,
  GLOBAL_WINDOW_MS: 15 * 60 * 1000,
  /** Routes d'écriture : requêtes autorisées par minute. */
  WRITE_MAX: 20,
  WRITE_WINDOW_MS: 60 * 1000,
} as const;
