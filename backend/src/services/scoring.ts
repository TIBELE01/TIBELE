/**
 * Moteur de correction des quiz — fonctions pures, sans accès base ni HTTP.
 *
 * Règles (CONTEXTE §6) :
 *  - QCM : logique TOUT OU RIEN. La réponse est correcte uniquement si
 *    l'ensemble des options cochées est EXACTEMENT l'ensemble des bonnes
 *    options : une mauvaise option cochée, ou une bonne oubliée, rend la
 *    réponse fausse. Aucun point partiel.
 *  - QCD : binaire. Options [0] = « Vrai », [1] = « Faux ». La réponse
 *    (booléen) est correcte si elle correspond à la valeur de vérité.
 *
 * Format stocké (UserAnswer.answer) : QCM -> { selected: number[] } ;
 * QCD -> { value: boolean }.
 */
import { BadRequestError } from '../errors/index.js';
import type { StoredOption } from './question-options.js';

export interface GradableQuestion {
  id: string;
  type: 'QCM' | 'QCD';
  options: readonly StoredOption[];
}

/** Réponse telle qu'envoyée par le client (une seule des deux formes selon le type). */
export interface SubmittedAnswer {
  questionId: string;
  selected?: number[] | undefined;
  value?: boolean | undefined;
}

export type StoredAnswer = { selected: number[] } | { value: boolean };

export interface GradedAnswer {
  stored: StoredAnswer;
  isCorrect: boolean;
}

/** QCM : égalité stricte entre l'ensemble coché et l'ensemble des bonnes options. */
export function isQcmCorrect(
  options: readonly StoredOption[],
  selected: readonly number[],
): boolean {
  const correct = new Set<number>();
  options.forEach((option, index) => {
    if (option.isCorrect) correct.add(index);
  });
  const chosen = new Set(selected);

  return chosen.size === correct.size && [...correct].every((index) => chosen.has(index));
}

/** QCD : vrai si la valeur choisie est la valeur de vérité de l'énoncé. */
export function isQcdCorrect(options: readonly StoredOption[], value: boolean): boolean {
  const statementIsTrue = options[0]?.isCorrect === true;
  return value === statementIsTrue;
}

/**
 * Corrige une réponse. Lève une 400 si sa forme ne correspond pas au type de
 * la question (ex. `value` pour un QCM) ou si un index d'option est hors bornes.
 */
export function gradeAnswer(question: GradableQuestion, answer: SubmittedAnswer): GradedAnswer {
  if (question.type === 'QCM') {
    if (answer.selected === undefined || answer.value !== undefined) {
      throw new BadRequestError(
        `La question ${question.id} (QCM) attend « selected » (liste d’index)`,
      );
    }
    if (answer.selected.some((index) => index >= question.options.length)) {
      throw new BadRequestError(`Index d’option invalide pour la question ${question.id}`);
    }
    const selected = [...answer.selected].sort((a, b) => a - b);
    return { stored: { selected }, isCorrect: isQcmCorrect(question.options, selected) };
  }

  if (answer.value === undefined || answer.selected !== undefined) {
    throw new BadRequestError(`La question ${question.id} (QCD) attend « value » (vrai ou faux)`);
  }
  return {
    stored: { value: answer.value },
    isCorrect: isQcdCorrect(question.options, answer.value),
  };
}
