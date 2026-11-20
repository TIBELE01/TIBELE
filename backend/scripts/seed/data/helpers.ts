import type { SeedQuestion } from './types.js';

/** QCM : chaque option est [libellé, estCorrecte]. Plusieurs bonnes réponses possibles. */
export function qcm(text: string, options: [string, boolean][], explanation: string): SeedQuestion {
  return {
    text,
    type: 'QCM',
    options: options.map(([optionText, isCorrect]) => ({ text: optionText, isCorrect })),
    explanation,
  };
}

/** QCD (vrai / faux) : `answer` indique si l'affirmation est VRAIE. Options : [Vrai, Faux]. */
export function qcd(text: string, answer: boolean, explanation: string): SeedQuestion {
  return {
    text,
    type: 'QCD',
    options: [
      { text: 'Vrai', isCorrect: answer },
      { text: 'Faux', isCorrect: !answer },
    ],
    explanation,
  };
}
