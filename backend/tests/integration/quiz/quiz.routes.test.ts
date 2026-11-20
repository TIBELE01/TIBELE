import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabaseMock, USER_ID } from '../../helpers/supabase-mock.js';

const prisma = {
  pathology: { findUnique: vi.fn() },
  question: { findMany: vi.fn() },
  quizAttempt: { create: vi.fn(), findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn() },
};
vi.mock('../../../src/config/prisma.js', () => ({ prisma }));
vi.mock('../../../src/config/supabase.js', () => supabaseMock);

const { createApp } = await import('../../../src/app.js');
const app = createApp();

const USER = { Authorization: 'Bearer jeton-user' };
const pathology = { id: 'p1', title: 'Paludisme', slug: 'paludisme' };
const Q1 = '00000000-0000-4000-8000-000000000001'; // QCM : bonnes réponses 0 et 2
const Q2 = '00000000-0000-4000-8000-000000000002'; // QCM : bonne réponse 1
const Q3 = '00000000-0000-4000-8000-000000000003'; // QCD : « Vrai » est correct

/** Lignes telles que renvoyées par la base : AVEC isCorrect et explanation. */
const rows = [
  {
    id: Q1,
    text: 'Q1 ?',
    type: 'QCM',
    explanation: 'EXPLICATION-SECRÈTE-1',
    options: [
      { text: 'A', isCorrect: true },
      { text: 'B', isCorrect: false },
      { text: 'C', isCorrect: true },
      { text: 'D', isCorrect: false },
    ],
  },
  {
    id: Q2,
    text: 'Q2 ?',
    type: 'QCM',
    explanation: null,
    options: [
      { text: 'A', isCorrect: false },
      { text: 'B', isCorrect: true },
      { text: 'C', isCorrect: false },
      { text: 'D', isCorrect: false },
    ],
  },
  {
    id: Q3,
    text: 'Q3 ?',
    type: 'QCD',
    explanation: 'Parce que.',
    options: [
      { text: 'Vrai', isCorrect: true },
      { text: 'Faux', isCorrect: false },
    ],
  },
];

beforeEach(() => {
  prisma.pathology.findUnique.mockReset().mockResolvedValue(pathology);
  prisma.question.findMany.mockReset().mockResolvedValue(rows);
  prisma.quizAttempt.create.mockReset().mockResolvedValue({
    id: 'att1',
    completedAt: new Date('2026-01-01T10:00:00Z'),
  });
  prisma.quizAttempt.findMany.mockReset();
  prisma.quizAttempt.count.mockReset();
  prisma.quizAttempt.findFirst.mockReset();
});

describe('GET /api/quiz/pathologies/:slug/questions — non-exposition des bonnes réponses', () => {
  it('401 sans jeton ou avec un jeton invalide (aucune lecture en base)', async () => {
    expect((await request(app).get('/api/quiz/pathologies/paludisme/questions')).status).toBe(401);
    const bad = await request(app)
      .get('/api/quiz/pathologies/paludisme/questions')
      .set('Authorization', 'Bearer faux');
    expect(bad.status).toBe(401);
    expect(prisma.question.findMany).not.toHaveBeenCalled();
  });

  it('ne révèle ni isCorrect, ni explication, même si la base les renvoie', async () => {
    const res = await request(app).get('/api/quiz/pathologies/paludisme/questions').set(USER);

    expect(res.status).toBe(200);
    expect(res.body.data.questions).toHaveLength(3);

    const raw = JSON.stringify(res.body);
    expect(raw).not.toMatch(/isCorrect|correct|explanation|EXPLICATION-SECRÈTE/i);
    expect(res.body.data.questions[0]).toEqual({
      id: Q1,
      text: 'Q1 ?',
      type: 'QCM',
      options: [{ text: 'A' }, { text: 'B' }, { text: 'C' }, { text: 'D' }],
    });
    // L'en-tête interdit toute mise en cache (navigateur, proxy, service worker)
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('n’appelle même pas la colonne « explanation » côté base', async () => {
    await request(app).get('/api/quiz/pathologies/paludisme/questions').set(USER);
    const { select } = prisma.question.findMany.mock.calls[0]?.[0] as { select: object };
    expect(select).toEqual({ id: true, text: true, type: true, options: true });
  });

  it('404 si la pathologie n’existe pas, 400 si le slug est mal formé', async () => {
    prisma.pathology.findUnique.mockResolvedValue(null);
    expect(
      (await request(app).get('/api/quiz/pathologies/inconnue/questions').set(USER)).status,
    ).toBe(404);
    expect(
      (await request(app).get('/api/quiz/pathologies/Mauvais_Slug/questions').set(USER)).status,
    ).toBe(400);
  });
});

describe('POST /api/quiz/pathologies/:slug/attempts — correction côté serveur', () => {
  const submit = (body: unknown, headers: Record<string, string> = USER) =>
    request(app)
      .post('/api/quiz/pathologies/paludisme/attempts')
      .set(headers)
      .send(body as object);

  it('401 sans jeton, rien n’est écrit', async () => {
    const res = await submit({ answers: [] }, {});
    expect(res.status).toBe(401);
    expect(prisma.quizAttempt.create).not.toHaveBeenCalled();
  });

  it('calcule le score : QCM tout ou rien et QCD binaire', async () => {
    const res = await submit({
      answers: [
        { questionId: Q1, selected: [2, 0] }, // exactement les bonnes -> juste
        { questionId: Q2, selected: [1, 3] }, // une mauvaise en plus -> faux
        { questionId: Q3, value: false }, // mauvaise valeur -> faux
      ],
    });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ id: 'att1', score: 1, totalQuestions: 3 });
    expect(res.body.data.results.map((r: { isCorrect: boolean }) => r.isCorrect)).toEqual([
      true,
      false,
      false,
    ]);

    // Persistance atomique : tentative + réponses, rattachées à l'utilisateur du jeton
    const { data } = prisma.quizAttempt.create.mock.calls[0]?.[0] as {
      data: {
        userId: string;
        score: number;
        totalQuestions: number;
        answers: { create: unknown[] };
      };
    };
    expect(data).toMatchObject({ userId: USER_ID, pathologyId: 'p1', score: 1, totalQuestions: 3 });
    expect(data.answers.create).toEqual([
      { questionId: Q1, answer: { selected: [0, 2] }, isCorrect: true },
      { questionId: Q2, answer: { selected: [1, 3] }, isCorrect: false },
      { questionId: Q3, answer: { value: false }, isCorrect: false },
    ]);
  });

  it('score parfait', async () => {
    const res = await submit({
      answers: [
        { questionId: Q1, selected: [0, 2] },
        { questionId: Q2, selected: [1] },
        { questionId: Q3, value: true },
      ],
    });
    expect(res.body.data.score).toBe(3);
  });

  it('renvoie verdicts et explications, mais JAMAIS les options correctes', async () => {
    const res = await submit({
      answers: [
        { questionId: Q1, selected: [0] },
        { questionId: Q2, selected: [0] },
        { questionId: Q3, value: true },
      ],
    });
    const raw = JSON.stringify(res.body.data.results);
    // Seules clés « isCorrect » autorisées : le verdict de chaque question (niveau résultat)
    for (const result of res.body.data.results as {
      options: object[];
      explanation: string | null;
    }[]) {
      for (const option of result.options) expect(Object.keys(option)).toEqual(['text']);
    }
    expect(raw.match(/isCorrect/g)).toHaveLength(3);
    expect(res.body.data.results[0].explanation).toBe('EXPLICATION-SECRÈTE-1');
    expect(res.body.data.results[0].userAnswer).toEqual({ selected: [0] });
  });

  it('ignore tout score ou verdict envoyé par le client (corps strict => 400)', async () => {
    for (const extra of [{ score: 3 }, { totalQuestions: 3 }]) {
      const res = await submit({ answers: [{ questionId: Q3, value: true }], ...extra });
      expect(res.status).toBe(400);
    }
    const forged = await submit({ answers: [{ questionId: Q3, value: true, isCorrect: true }] });
    expect(forged.status).toBe(400);
    expect(prisma.quizAttempt.create).not.toHaveBeenCalled();
  });

  it.each([
    ['réponses manquantes', { answers: [{ questionId: Q1, selected: [0, 2] }] }],
    [
      'question étrangère à la pathologie',
      {
        answers: [
          { questionId: Q1, selected: [0] },
          { questionId: Q2, selected: [1] },
          { questionId: Q3, value: true },
          { questionId: '00000000-0000-4000-8000-0000000000ff', value: true },
        ],
      },
    ],
    [
      'doublon',
      {
        answers: [
          { questionId: Q1, selected: [0] },
          { questionId: Q1, selected: [2] },
          { questionId: Q2, selected: [1] },
          { questionId: Q3, value: true },
        ],
      },
    ],
    [
      'QCM répondu avec « value »',
      {
        answers: [
          { questionId: Q1, value: true },
          { questionId: Q2, selected: [1] },
          { questionId: Q3, value: true },
        ],
      },
    ],
    [
      'QCD répondu avec « selected »',
      {
        answers: [
          { questionId: Q1, selected: [0] },
          { questionId: Q2, selected: [1] },
          { questionId: Q3, selected: [0] },
        ],
      },
    ],
    [
      'index d’option hors bornes',
      {
        answers: [
          { questionId: Q1, selected: [7] },
          { questionId: Q2, selected: [1] },
          { questionId: Q3, value: true },
        ],
      },
    ],
  ])('400 : %s (rien n’est écrit)', async (_label, body) => {
    const res = await submit(body);
    expect(res.status).toBe(400);
    expect(prisma.quizAttempt.create).not.toHaveBeenCalled();
  });

  it('400 si la pathologie n’a pas de questions ; 404 si elle n’existe pas', async () => {
    prisma.question.findMany.mockResolvedValue([]);
    expect((await submit({ answers: [{ questionId: Q3, value: true }] })).status).toBe(400);
    prisma.pathology.findUnique.mockResolvedValue(null);
    expect((await submit({ answers: [{ questionId: Q3, value: true }] })).status).toBe(404);
  });
});

describe('historique personnel', () => {
  it('liste uniquement les tentatives de l’utilisateur du jeton', async () => {
    prisma.quizAttempt.findMany.mockResolvedValue([
      { id: 'a1', score: 8, totalQuestions: 10, completedAt: new Date(), pathology },
    ]);
    prisma.quizAttempt.count.mockResolvedValue(11);

    const res = await request(app).get('/api/quiz/attempts?page=2').set(USER);

    expect(res.status).toBe(200);
    expect(res.body.meta).toEqual({ page: 2, pageSize: 10, total: 11, totalPages: 2 });
    expect(prisma.quizAttempt.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID }, skip: 10, take: 10 }),
    );
    expect(prisma.quizAttempt.count).toHaveBeenCalledWith({ where: { userId: USER_ID } });
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('401 sans jeton', async () => {
    expect((await request(app).get('/api/quiz/attempts')).status).toBe(401);
    expect(
      (await request(app).get('/api/quiz/attempts/00000000-0000-4000-8000-000000000001')).status,
    ).toBe(401);
  });

  it('détail : recherche filtrée par propriétaire ; tentative d’autrui = 404', async () => {
    prisma.quizAttempt.findFirst.mockResolvedValue(null);
    const id = '00000000-0000-4000-8000-0000000000aa';

    const res = await request(app).get(`/api/quiz/attempts/${id}`).set(USER);

    expect(res.status).toBe(404);
    expect(prisma.quizAttempt.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id, userId: USER_ID } }),
    );
  });

  it('détail : verdict, réponse de l’utilisateur, explication — sans options correctes', async () => {
    prisma.quizAttempt.findFirst.mockResolvedValue({
      id: 'a1',
      score: 1,
      totalQuestions: 1,
      completedAt: new Date('2026-01-01T10:00:00Z'),
      pathology,
      answers: [{ answer: { selected: [0] }, isCorrect: false, question: rows[0] }],
    });
    const res = await request(app)
      .get('/api/quiz/attempts/00000000-0000-4000-8000-0000000000aa')
      .set(USER);

    expect(res.status).toBe(200);
    expect(res.body.data.results[0]).toMatchObject({
      questionId: Q1,
      userAnswer: { selected: [0] },
      isCorrect: false,
      explanation: 'EXPLICATION-SECRÈTE-1',
    });
    expect(res.body.data.results[0].options).toEqual([
      { text: 'A' },
      { text: 'B' },
      { text: 'C' },
      { text: 'D' },
    ]);
    expect(res.body.data.answers).toBeUndefined();
  });

  it('400 si l’identifiant n’est pas un UUID', async () => {
    expect((await request(app).get('/api/quiz/attempts/abc').set(USER)).status).toBe(400);
  });
});
