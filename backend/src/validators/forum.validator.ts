import { z } from 'zod';
import { pageSchema, plainText } from './common.validator.js';

/** GET /api/forum/topics?page= (taille de page fixe : 10) */
export const listTopicsQuery = z.object({ page: pageSchema });

/** GET /api/forum/topics/:id */
export const topicParams = z.object({ id: z.uuid() });

/** POST /api/forum/topics — texte brut uniquement (échappé à l'affichage côté React). */
export const createTopicBody = z.object({
  title: plainText(3, 200),
  content: plainText(1, 10_000),
  /** Pathologie associée, facultative. */
  pathologyId: z
    .uuid()
    .nullish()
    .transform((value) => value ?? undefined),
});
export type CreateTopicInput = z.infer<typeof createTopicBody>;
