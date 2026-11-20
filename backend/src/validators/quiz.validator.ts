import { z } from 'zod';
import { MAX_OPTIONS } from './question.validator.js';
import { pageSchema } from './common.validator.js';

/**
 * POST /api/quiz/pathologies/:slug/attempts
 * Une entrée par question : `selected` (index des options cochées) pour un QCM,
 * `value` (booléen) pour un QCD. Toute clé inconnue est refusée.
 */
const answerSchema = z.strictObject({
  questionId: z.uuid(),
  selected: z
    .array(
      z
        .int()
        .min(0)
        .max(MAX_OPTIONS - 1),
    )
    .max(MAX_OPTIONS)
    .refine((items) => new Set(items).size === items.length, 'Index en double')
    .optional(),
  value: z.boolean().optional(),
});

export const submitAttemptBody = z.strictObject({
  answers: z.array(answerSchema).min(1).max(200),
});

/** GET /api/quiz/attempts?page= */
export const listAttemptsQuery = z.object({ page: pageSchema });
