import { describe, expect, it } from 'vitest';
import { assertNoAnswerLeak } from '../../../src/utils/answer-leak.js';
import { parseStoredOptions, toPublicOptions } from '../../../src/services/question-options.js';

describe('assertNoAnswerLeak', () => {
  it('accepte une charge utile sans indice de correction', () => {
    expect(() =>
      assertNoAnswerLeak({
        pathology: { id: '1', title: 'x' },
        questions: [
          { id: 'q', text: 'Quelle réponse est correcte ?', options: [{ text: 'correct' }] },
        ],
      }),
    ).not.toThrow();
  });

  it.each([
    ['isCorrect', { questions: [{ options: [{ text: 'a', isCorrect: true }] }] }],
    ['correct', { q: { correct: 1 } }],
    ['correctOptions', { q: { correctOptions: [0] } }],
    ['answer', { q: { answer: 'x' } }],
    ['explanation', { q: [{ explanation: 'indice' }] }],
    ['ISCORRECT', { q: { ISCORRECT: false } }],
  ])('bloque la clé « %s », même imbriquée', (_key, payload) => {
    expect(() => assertNoAnswerLeak(payload)).toThrow(/Fuite de réponse bloquée/);
  });
});

describe('options de question', () => {
  it('toPublicOptions ne conserve que le libellé, même si l’objet source a d’autres champs', () => {
    const source = [{ text: 'A', isCorrect: true, secret: 'x' }] as never;
    expect(toPublicOptions(source)).toEqual([{ text: 'A' }]);
  });

  it('parseStoredOptions rejette des options corrompues', () => {
    expect(() => parseStoredOptions(null)).toThrow(/corrompues/);
    expect(() => parseStoredOptions([{ text: 'a' }])).toThrow();
    expect(parseStoredOptions([{ text: 'a', isCorrect: false }])).toHaveLength(1);
  });
});
