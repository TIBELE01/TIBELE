/** Formats de réponse de l'API backend. */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Réponse d'un endpoint renvoyant un élément : `{ data }`. */
export interface ApiItem<T> {
  data: T;
}

/** Réponse d'un endpoint paginé : `{ data, meta }`. */
export interface ApiList<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Corps d'erreur : `{ error: { code, message, details? } }`. */
export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}
