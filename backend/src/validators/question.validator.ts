/**
 * Format des questions (QCM / QCD), partagé entre l'administration (écriture)
 * et le module quiz.
 *
 * Options stockées : [{ "text": string, "isCorrect": boolean }, ...]
 *  - QCM : 2 à 8 options, au moins une correcte (plusieurs possibles).
 *  - QCD : exactement 2 options, la 1re = « Vrai », la 2e = « Faux »,
 *          une seule marquée correcte.
 */
import { z } from 'zod';
import { optionalText, plainText } from './common.validator.js';

export const QUESTION_TYPES = ['QCM', 'QCD'] as const;
export type QuestionKind = (typeof QUESTION_TYPES)[number];

export const MAX_OPTIONS = 8;

const optionSchema = z.strictObject({
  text: plainText(1, 500),
  isCorrect: z.boolean(),
});

export const questionBody = z
  .object({
    text: plainText(1, 2000),
    type: z.enum(QUESTION_TYPES),
    options: z.array(optionSchema).min(2).max(MAX_OPTIONS),
    explanation: optionalText(5000),
  })
  .superRefine((question, ctx) => {
    const correctCount = question.options.filter((option) => option.isCorrect).length;

    if (question.type === 'QCD') {
      if (question.options.length !== 2) {
        ctx.addIssue({
          code: 'custom',
          path: ['options'],
          message: 'Un QCD comporte exactement 2 options (Vrai, Faux)',
        });
      }
      if (correctCount !== 1) {
        ctx.addIssue({
          code: 'custom',
          path: ['options'],
          message: 'Un QCD a exactement une bonne réponse',
        });
      }
    } else if (correctCount < 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Un QCM comporte au moins une bonne réponse',
      });
    }
  })
  // QCD : les libellés sont normalisés (index 0 = « Vrai », index 1 = « Faux »).
  .transform((question) =>
    question.type === 'QCD'
      ? {
          ...question,
          options: [
            { text: 'Vrai', isCorrect: question.options[0]?.isCorrect === true },
            { text: 'Faux', isCorrect: question.options[1]?.isCorrect === true },
          ],
        }
      : question,
  );

export type QuestionBody = z.output<typeof questionBody>;
