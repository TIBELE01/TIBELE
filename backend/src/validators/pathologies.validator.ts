import { z } from 'zod';
import { PAGINATION, SLUG_PATTERN } from '../constants/pagination.js';
import { pageSchema } from './common.validator.js';

/** GET /api/pathologies?page=&limit=&q= */
export const listPathologiesQuery = z.object({
  page: pageSchema,
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.MAX_PAGE_SIZE)
    .default(PAGINATION.PATHOLOGIES_DEFAULT_PAGE_SIZE),
  /** Terme de recherche ; une chaîne vide équivaut à « pas de recherche ». */
  q: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => value || undefined),
});
export type ListPathologiesQuery = z.infer<typeof listPathologiesQuery>;

/** GET /api/pathologies/:slug */
export const pathologyParams = z.object({
  slug: z.string().max(220).regex(SLUG_PATTERN, 'Slug invalide'),
});
