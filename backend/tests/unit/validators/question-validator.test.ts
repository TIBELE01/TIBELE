import { describe, expect, it } from 'vitest';
import { questionBody } from '../../../src/validators/question.validator.js';
import {
  createPathologyBody,
  updatePathologyBody,
} from '../../../src/validators/admin/pathology.validator.js';
import { submitAttemptBody } from '../../../src/validators/quiz.validator.js';

const UUID = '11111111-1111-4111-8111-111111111111';

describe('questionBody', () => {
  const qcm = {
    text: 'Question ?',
    type: 'QCM',
    options: [
      { text: 'A', isCorrect: true },
      { text: 'B', isCorrect: false },
    ],
  };

  it('QCM valide ; explication absente => null', () => {
    expect(questionBody.parse(qcm).explanation).toBeNull();
  });

  it('QCM : au moins une bonne réponse, 2 à 8 options', () => {
    const noneCorrect = { ...qcm, options: qcm.options.map((o) => ({ ...o, isCorrect: false })) };
    expect(questionBody.safeParse(noneCorrect).success).toBe(false);
    expect(questionBody.safeParse({ ...qcm, options: [qcm.options[0]] }).success).toBe(false);
    const nine = Array.from({ length: 9 }, (_, i) => ({ text: `o${i}`, isCorrect: i === 0 }));
    expect(questionBody.safeParse({ ...qcm, options: nine }).success).toBe(false);
  });

  it('QCD : exactement 2 options dont une correcte ; libellés normalisés Vrai/Faux', () => {
    const qcd = (a: boolean, b: boolean) => ({
      text: 'Affirmation',
      type: 'QCD',
      options: [
        { text: 'oui', isCorrect: a },
        { text: 'non', isCorrect: b },
      ],
    });
    expect(questionBody.parse(qcd(false, true)).options).toEqual([
      { text: 'Vrai', isCorrect: false },
      { text: 'Faux', isCorrect: true },
    ]);
    expect(questionBody.safeParse(qcd(true, true)).success).toBe(false);
    expect(questionBody.safeParse(qcd(false, false)).success).toBe(false);
    expect(
      questionBody.safeParse({
        ...qcd(true, false),
        options: [...qcd(true, false).options, { text: 'x', isCorrect: false }],
      }).success,
    ).toBe(false);
  });

  it('refuse un type inconnu et les clés superflues dans une option', () => {
    expect(questionBody.safeParse({ ...qcm, type: 'QCU' }).success).toBe(false);
    const extra = { ...qcm, options: [{ text: 'A', isCorrect: true, hack: 1 }, qcm.options[1]] };
    expect(questionBody.safeParse(extra).success).toBe(false);
  });
});

describe('pathologies (admin)', () => {
  const valid = {
    title: 'Fièvre typhoïde',
    shortDescription: 'Courte',
    definition: 'Def',
    referenceDiagnosis: 'D',
    onSiteTreatment: 'T',
    dischargePrescription: 'O',
    prevention: 'P',
  };

  it('création : listes par défaut vides, imageUrl null', () => {
    expect(createPathologyBody.parse(valid)).toMatchObject({
      exams: [],
      references: [],
      imageUrl: null,
    });
  });

  it('refuse les URL d’image non http(s)', () => {
    for (const imageUrl of [
      'javascript:alert(1)',
      'data:text/html,x',
      'ftp://x.ci/a.png',
      'pas une url',
    ]) {
      expect(createPathologyBody.safeParse({ ...valid, imageUrl }).success).toBe(false);
    }
    expect(
      createPathologyBody.safeParse({ ...valid, imageUrl: 'https://cdn.tibele.ci/a.png' }).success,
    ).toBe(true);
  });

  it('PATCH : ne remet pas à zéro les champs absents, refuse un corps vide', () => {
    expect(updatePathologyBody.parse({ title: 'Nouveau' })).toEqual({ title: 'Nouveau' });
    expect(updatePathologyBody.parse({ imageUrl: null })).toEqual({ imageUrl: null });
    expect(updatePathologyBody.safeParse({}).success).toBe(false);
    expect(updatePathologyBody.safeParse({ unknown: 1 }).success).toBe(false);
  });
});

describe('submitAttemptBody', () => {
  it('accepte QCM (selected) et QCD (value)', () => {
    const body = {
      answers: [
        { questionId: UUID, selected: [0, 2] },
        { questionId: UUID, value: true },
      ],
    };
    expect(submitAttemptBody.safeParse(body).success).toBe(true);
  });

  it.each([
    [{ answers: [] }, 'liste vide'],
    [{ answers: [{ questionId: 'x', value: true }] }, 'id non UUID'],
    [{ answers: [{ questionId: UUID, selected: [0, 0] }] }, 'index en double'],
    [{ answers: [{ questionId: UUID, selected: [-1] }] }, 'index négatif'],
    [{ answers: [{ questionId: UUID, selected: [8] }] }, 'index trop grand'],
    [
      { answers: [{ questionId: UUID, value: true, isCorrect: true }] },
      'clé « isCorrect » envoyée par le client',
    ],
    [{ answers: [{ questionId: UUID, value: true }], score: 10 }, 'score envoyé par le client'],
  ])('refuse %j (%s)', (body, _raison) => {
    expect(submitAttemptBody.safeParse(body).success).toBe(false);
  });
});
