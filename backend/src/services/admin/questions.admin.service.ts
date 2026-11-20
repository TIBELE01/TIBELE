/**
 * Gestion des questions (administrateur).
 * Ici seulement, les options sont renvoyées AVEC `isCorrect` : ces routes sont
 * réservées au rôle administrateur.
 */
import { prisma } from '../../config/prisma.js';
import { BadRequestError, NotFoundError } from '../../errors/index.js';
import type { QuestionBody } from '../../validators/question.validator.js';

const adminQuestionSelect = {
  id: true,
  pathologyId: true,
  text: true,
  type: true,
  options: true,
  explanation: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listQuestions(pathologyId: string) {
  const pathology = await prisma.pathology.findUnique({
    where: { id: pathologyId },
    select: { id: true },
  });
  if (!pathology) throw new NotFoundError('Pathologie introuvable');

  return prisma.question.findMany({
    where: { pathologyId },
    select: adminQuestionSelect,
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
}

export async function createQuestion(pathologyId: string, input: QuestionBody) {
  const pathology = await prisma.pathology.findUnique({
    where: { id: pathologyId },
    select: { id: true },
  });
  if (!pathology) throw new NotFoundError('Pathologie introuvable');

  return prisma.question.create({
    data: { ...input, pathologyId },
    select: adminQuestionSelect,
  });
}

/**
 * Remplacement complet d'une question. Le TYPE est immuable : les réponses déjà
 * enregistrées dans l'historique ont le format de l'ancien type.
 */
export async function updateQuestion(id: string, input: QuestionBody) {
  const existing = await prisma.question.findUnique({ where: { id }, select: { type: true } });
  if (!existing) throw new NotFoundError('Question introuvable');
  if (existing.type !== input.type) {
    throw new BadRequestError(
      'Le type d’une question ne peut pas être modifié : supprimez-la et recréez-la',
    );
  }

  return prisma.question.update({
    where: { id },
    data: { text: input.text, options: input.options, explanation: input.explanation },
    select: adminQuestionSelect,
  });
}

/** Supprime la question (et, en cascade, les réponses d'historique associées). */
export async function deleteQuestion(id: string): Promise<void> {
  await prisma.question.delete({ where: { id } }); // P2025 -> 404
}
