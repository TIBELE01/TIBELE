import { describe, expect, it } from 'vitest';
import {
  gradeAnswer,
  isQcdCorrect,
  isQcmCorrect,
  type GradableQuestion,
} from '../../../src/services/scoring.js';

const opts = (...flags: boolean[]) =>
  flags.map((isCorrect, i) => ({ text: `Option ${i}`, isCorrect }));

describe('isQcmCorrect — tout ou rien', () => {
  // Bonnes options : indices 0 et 2
  const options = opts(true, false, true, false);

  it.each([
    [[0, 2], true, 'exactement les bonnes options'],
    [[2, 0], true, 'ordre indifférent'],
    [[0], false, 'une bonne option oubliée'],
    [[2], false, 'une bonne option oubliée (autre)'],
    [[0, 2, 1], false, 'une mauvaise option en plus'],
    [[0, 2, 1, 3], false, 'tout coché'],
    [[1, 3], false, 'uniquement des mauvaises'],
    [[1], false, 'une seule mauvaise'],
    [[], false, 'rien coché'],
  ])('%j -> %s (%s)', (selected, expected) => {
    expect(isQcmCorrect(options, selected)).toBe(expected);
  });

  it('une seule bonne option', () => {
    const single = opts(false, true, false);
    expect(isQcmCorrect(single, [1])).toBe(true);
    expect(isQcmCorrect(single, [1, 2])).toBe(false);
    expect(isQcmCorrect(single, [0])).toBe(false);
  });

  it('toutes les options correctes : il faut toutes les cocher', () => {
    const all = opts(true, true, true);
    expect(isQcmCorrect(all, [0, 1, 2])).toBe(true);
    expect(isQcmCorrect(all, [0, 1])).toBe(false);
  });
});

describe('isQcdCorrect — binaire', () => {
  it('l’affirmation est vraie (options[0] correcte)', () => {
    const options = opts(true, false);
    expect(isQcdCorrect(options, true)).toBe(true);
    expect(isQcdCorrect(options, false)).toBe(false);
  });

  it('l’affirmation est fausse (options[1] correcte)', () => {
    const options = opts(false, true);
    expect(isQcdCorrect(options, false)).toBe(true);
    expect(isQcdCorrect(options, true)).toBe(false);
  });
});

describe('gradeAnswer', () => {
  const qcm: GradableQuestion = { id: 'q1', type: 'QCM', options: opts(true, false, true) };
  const qcd: GradableQuestion = { id: 'q2', type: 'QCD', options: opts(false, true) };

  it('QCM : corrige et normalise (tri) la réponse stockée', () => {
    expect(gradeAnswer(qcm, { questionId: 'q1', selected: [2, 0] })).toEqual({
      stored: { selected: [0, 2] },
      isCorrect: true,
    });
    expect(gradeAnswer(qcm, { questionId: 'q1', selected: [0] }).isCorrect).toBe(false);
  });

  it('QCD : corrige et stocke un booléen', () => {
    expect(gradeAnswer(qcd, { questionId: 'q2', value: false })).toEqual({
      stored: { value: false },
      isCorrect: true,
    });
  });

  it('refuse une réponse dont la forme ne correspond pas au type', () => {
    expect(() => gradeAnswer(qcm, { questionId: 'q1', value: true })).toThrow(/QCM/);
    expect(() => gradeAnswer(qcm, { questionId: 'q1' })).toThrow(/QCM/);
    expect(() => gradeAnswer(qcd, { questionId: 'q2', selected: [0] })).toThrow(/QCD/);
    expect(() => gradeAnswer(qcd, { questionId: 'q2' })).toThrow(/QCD/);
    expect(() => gradeAnswer(qcm, { questionId: 'q1', selected: [0], value: true })).toThrow();
  });

  it('refuse un index d’option hors bornes', () => {
    expect(() => gradeAnswer(qcm, { questionId: 'q1', selected: [3] })).toThrow(/Index/);
  });
});
