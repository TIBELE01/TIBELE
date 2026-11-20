/**
 * Module quiz : questions SANS bonnes réponses, correction côté serveur,
 * historique personnel.
 *
 * Règles de sécurité appliquées ici :
 *  1. Avant correction, une question ne sort que via `toPublicQuestion`
 *     (liste blanche : id, texte, type, libellés des options). L'explication
 *     n'est même pas lue en base pour cet endpoint (elle peut révéler la réponse).
 *  2. Le score est calculé exclusivement côté serveur (services/scoring.ts) ;
 *     le client n'envoie que ses choix, jamais de correction ni de score.
 *  3. La correction renvoie le verdict (juste/faux) et l'explication, mais PAS
 *     les options correctes : on ne peut pas « apprendre » la solution par
 *     simple soumission.
 *  4. Chaque tentative est filtrée par l'identifiant de l'utilisateur du jeton :
 *     la tentative d'un autre utilisateur est indiscernable d'une tentative
 *     inexistante (404).
 */
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { PAGINATION } from '../constants/pagination.js';
import { BadRequestError, NotFoundError } from '../errors/index.js';
import type { Prisma } from '../generated/prisma/client.js';
import { assertNoAnswerLeak } from '../utils/answer-leak.js';
import { toSkipTake } from '../utils/pagination.js';
import { type PublicOption, parseStoredOptions, toPublicOptions } from './question-options.js';
import { gradeAnswer, type StoredAnswer, type SubmittedAnswer } from './scoring.js';

/** Ordre stable des questions d'une pathologie (création, puis identifiant). */
const questionOrder = [
  { createdAt: 'asc' },
  { id: 'asc' },
] satisfies Prisma.QuestionOrderByWithRelationInput[];

const pathologyRefSelect = { id: true, title: true, slug: true } satisfies Prisma.PathologySelect;

// ---------------------------------------------------------------------------
// Questions (avant correction)
// ---------------------------------------------------------------------------

export interface PublicQuestion {
  id: string;
  text: string;
  type: 'QCM' | 'QCD';
  options: PublicOption[];
}

/** Liste blanche : aucune autre information de la ligne n'est propagée. */
function toPublicQuestion(row: {
  id: string;
  text: string;
  type: 'QCM' | 'QCD';
  options: Prisma.JsonValue;
}): PublicQuestion {
  return {
    id: row.id,
    text: row.text,
    type: row.type,
    options: toPublicOptions(parseStoredOptions(row.options)),
  };
}

export async function getQuizQuestions(slug: string) {
  const pathology = await prisma.pathology.findUnique({
    where: { slug },
    select: pathologyRefSelect,
  });
  if (!pathology) throw new NotFoundError('Pathologie introuvable');

  const rows = await prisma.question.findMany({
    where: { pathologyId: pathology.id },
    // `explanation` volontairement NON sélectionnée.
    select: { id: true, text: true, type: true, options: true },
    orderBy: questionOrder,
  });

  const payload = { pathology, questions: rows.map(toPublicQuestion) };
  assertNoAnswerLeak(payload); // seconde barrière
  return payload;
}

// ---------------------------------------------------------------------------
// Soumission et correction
// ---------------------------------------------------------------------------

export interface QuestionResult {
  questionId: string;
  text: string;
  type: 'QCM' | 'QCD';
  options: PublicOption[];
  /** Ce que l'utilisateur a répondu. */
  userAnswer: StoredAnswer | null;
  isCorrect: boolean;
  explanation: string | null;
}

export async function submitAttempt(userId: string, slug: string, answers: SubmittedAnswer[]) {
  const pathology = await prisma.pathology.findUnique({
    where: { slug },
    select: pathologyRefSelect,
  });
  if (!pathology) throw new NotFoundError('Pathologie introuvable');

  const questions = await prisma.question.findMany({
    where: { pathologyId: pathology.id },
    select: { id: true, text: true, type: true, options: true, explanation: true },
    orderBy: questionOrder,
  });
  if (questions.length === 0) {
    throw new BadRequestError('Cette pathologie ne comporte pas encore de questions');
  }

  // Une réponse, et une seule, par question de la pathologie.
  const byQuestion = new Map<string, SubmittedAnswer>();
  for (const answer of answers) {
    if (byQuestion.has(answer.questionId)) {
      throw new BadRequestError(`Plusieurs réponses pour la question ${answer.questionId}`);
    }
    byQuestion.set(answer.questionId, answer);
  }
  const knownIds = new Set(questions.map((question) => question.id));
  const unknown = [...byQuestion.keys()].filter((id) => !knownIds.has(id));
  if (unknown.length > 0) {
    throw new BadRequestError('Certaines questions n’appartiennent pas à cette pathologie');
  }
  const missing = questions.filter((question) => !byQuestion.has(question.id));
  if (missing.length > 0) {
    throw new BadRequestError(
      `Réponses manquantes pour ${missing.length} question(s) : répondez à toutes les questions`,
    );
  }

  // Correction côté serveur.
  const graded = questions.map((question) => {
    const options = parseStoredOptions(question.options);
    const result = gradeAnswer(
      { id: question.id, type: question.type, options },
      byQuestion.get(question.id) as SubmittedAnswer,
    );
    return { question, options, ...result };
  });
  const score = graded.filter((item) => item.isCorrect).length;

  // Écriture atomique : la tentative et toutes ses réponses, ou rien.
  const attempt = await prisma.quizAttempt.create({
    data: {
      userId,
      pathologyId: pathology.id,
      score,
      totalQuestions: questions.length,
      answers: {
        create: graded.map((item) => ({
          questionId: item.question.id,
          answer: item.stored,
          isCorrect: item.isCorrect,
        })),
      },
    },
    select: { id: true, completedAt: true },
  });

  const results: QuestionResult[] = graded.map((item) => ({
    questionId: item.question.id,
    text: item.question.text,
    type: item.question.type,
    options: toPublicOptions(item.options),
    userAnswer: item.stored,
    isCorrect: item.isCorrect,
    explanation: item.question.explanation,
  }));

  return {
    id: attempt.id,
    pathology,
    score,
    totalQuestions: questions.length,
    completedAt: attempt.completedAt,
    results,
  };
}

// ---------------------------------------------------------------------------
// Historique personnel
// ---------------------------------------------------------------------------

export async function listAttempts(userId: string, page: number) {
  const { skip, take } = toSkipTake(page, PAGINATION.HISTORY_PAGE_SIZE);
  const [items, total] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: { userId },
      select: {
        id: true,
        score: true,
        totalQuestions: true,
        completedAt: true,
        pathology: { select: pathologyRefSelect },
      },
      orderBy: [{ completedAt: 'desc' }, { id: 'asc' }],
      skip,
      take,
    }),
    prisma.quizAttempt.count({ where: { userId } }),
  ]);
  return { items, total };
}

const storedAnswerSchema = z.union([
  z.object({ selected: z.array(z.int()) }),
  z.object({ value: z.boolean() }),
]);

/** Détail d'une tentative PASSÉE de l'utilisateur (jamais celle d'un autre). */
export async function getAttempt(userId: string, attemptId: string) {
  const attempt = await prisma.quizAttempt.findFirst({
    where: { id: attemptId, userId },
    select: {
      id: true,
      score: true,
      totalQuestions: true,
      completedAt: true,
      pathology: { select: pathologyRefSelect },
      answers: {
        orderBy: [{ question: { createdAt: 'asc' } }, { questionId: 'asc' }],
        select: {
          answer: true,
          isCorrect: true,
          question: {
            select: { id: true, text: true, type: true, options: true, explanation: true },
          },
        },
      },
    },
  });
  if (!attempt) throw new NotFoundError('Tentative introuvable');

  const results: QuestionResult[] = attempt.answers.map(({ answer, isCorrect, question }) => {
    const userAnswer = storedAnswerSchema.safeParse(answer);
    return {
      questionId: question.id,
      text: question.text,
      type: question.type,
      options: toPublicOptions(parseStoredOptions(question.options)),
      userAnswer: userAnswer.success ? userAnswer.data : null,
      isCorrect,
      explanation: question.explanation,
    };
  });

  return {
    id: attempt.id,
    pathology: attempt.pathology,
    score: attempt.score,
    totalQuestions: attempt.totalQuestions,
    completedAt: attempt.completedAt,
    results,
  };
}
