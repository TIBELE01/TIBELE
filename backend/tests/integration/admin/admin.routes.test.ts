import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '../../../src/generated/prisma/client.js';
import { supabaseMock } from '../../helpers/supabase-mock.js';

// Erreur injectée hors des spies (Vitest 5 fait échouer un test si un spy rejette).
let nextDeleteError: Error | null = null;
const deleteSpy = vi.fn();

const prisma = {
  pathology: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: (args: unknown) => {
      if (nextDeleteError) {
        const error = nextDeleteError;
        nextDeleteError = null;
        return Promise.reject(error);
      }
      return deleteSpy(args);
    },
  },
  question: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  forumTopic: { delete: vi.fn(), updateMany: vi.fn() },
  forumPost: { findUnique: vi.fn(), delete: vi.fn() },
  $transaction: (fn: (tx: unknown) => unknown) => fn(prisma),
};
vi.mock('../../../src/config/prisma.js', () => ({ prisma }));
vi.mock('../../../src/config/supabase.js', () => supabaseMock);

const { createApp } = await import('../../../src/app.js');
const app = createApp();

const ADMIN = { Authorization: 'Bearer jeton-admin' };
const USER = { Authorization: 'Bearer jeton-user' };
const ID = '00000000-0000-4000-8000-000000000001';

const ficheBody = {
  title: 'Paludisme',
  shortDescription: 'Courte description',
  definition: 'Définition',
  referenceDiagnosis: 'Diagnostic',
  onSiteTreatment: 'Traitement',
  dischargePrescription: 'Ordonnance',
  prevention: 'Prévention',
};
const qcmBody = {
  text: 'Question ?',
  type: 'QCM',
  options: [
    { text: 'A', isCorrect: true },
    { text: 'B', isCorrect: false },
  ],
};

/** Toutes les routes d'administration. */
const routes: [method: 'post' | 'patch' | 'put' | 'delete' | 'get', url: string, body?: object][] =
  [
    ['post', '/api/admin/pathologies', ficheBody],
    ['patch', `/api/admin/pathologies/${ID}`, { title: 'Nouveau titre' }],
    ['delete', `/api/admin/pathologies/${ID}`],
    ['get', `/api/admin/pathologies/${ID}/questions`],
    ['post', `/api/admin/pathologies/${ID}/questions`, qcmBody],
    ['put', `/api/admin/questions/${ID}`, qcmBody],
    ['delete', `/api/admin/questions/${ID}`],
    ['delete', `/api/admin/forum/topics/${ID}`],
    ['delete', `/api/admin/forum/posts/${ID}`],
  ];

function allPrismaFns() {
  const groups = [prisma.pathology, prisma.question, prisma.forumTopic, prisma.forumPost] as Record<
    string,
    unknown
  >[];
  return groups.flatMap((group) => Object.values(group)).filter(vi.isMockFunction);
}

beforeEach(() => {
  allPrismaFns().forEach((fn) => fn.mockReset());
  deleteSpy.mockReset().mockResolvedValue({});
  nextDeleteError = null;
});

describe('contrôle d’accès : TOUTES les routes admin sont réservées au rôle administrateur', () => {
  it.each(routes)(
    '%s %s : 401 sans jeton, 401 jeton invalide, 403 utilisateur standard',
    async (method, url, body) => {
      const send = (headers: Record<string, string>) =>
        request(app)[method](url).set(headers).send(body);

      expect((await send({})).status).toBe(401);
      expect((await send({ Authorization: 'Bearer faux' })).status).toBe(401);
      expect((await send(USER)).status).toBe(403);

      // Aucun accès à la base n'a eu lieu
      expect(allPrismaFns().every((fn) => fn.mock.calls.length === 0)).toBe(true);
      expect(deleteSpy).not.toHaveBeenCalled();
    },
  );
});

describe('pathologies', () => {
  it('POST : slug généré sans accents ; suffixe -2 si déjà pris ; 201', async () => {
    prisma.pathology.findMany.mockResolvedValue([{ slug: 'paludisme' }]);
    prisma.pathology.create.mockResolvedValue({
      id: ID,
      slug: 'paludisme-2',
      _count: { questions: 0 },
    });

    const res = await request(app).post('/api/admin/pathologies').set(ADMIN).send(ficheBody);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ slug: 'paludisme-2', questionsCount: 0 });
    const { data } = prisma.pathology.create.mock.calls[0]?.[0] as {
      data: Record<string, unknown>;
    };
    expect(data).toMatchObject({ slug: 'paludisme-2', exams: [], references: [], imageUrl: null });
  });

  it('POST : 400 avec le détail des champs invalides (XSS dans imageUrl refusé)', async () => {
    const res = await request(app)
      .post('/api/admin/pathologies')
      .set(ADMIN)
      .send({ ...ficheBody, title: '', imageUrl: 'javascript:alert(1)' });
    expect(res.status).toBe(400);
    const paths = res.body.error.details.map((d: { path: string }) => d.path).sort();
    expect(paths).toEqual(['imageUrl', 'title']);
    expect(prisma.pathology.create).not.toHaveBeenCalled();
  });

  it('POST : ignore les champs inattendus (slug, id imposés par le client)', async () => {
    prisma.pathology.findMany.mockResolvedValue([]);
    prisma.pathology.create.mockResolvedValue({
      id: ID,
      slug: 'paludisme',
      _count: { questions: 0 },
    });
    await request(app)
      .post('/api/admin/pathologies')
      .set(ADMIN)
      .send({ ...ficheBody, slug: 'pirate', id: 'x', searchVector: 'y' });
    const { data } = prisma.pathology.create.mock.calls[0]?.[0] as {
      data: Record<string, unknown>;
    };
    expect(data['slug']).toBe('paludisme');
    expect(data).not.toHaveProperty('id');
    expect(data).not.toHaveProperty('searchVector');
  });

  it('PATCH : modification partielle (le slug n’est pas touché, les autres champs non plus)', async () => {
    prisma.pathology.update.mockResolvedValue({
      id: ID,
      slug: 'paludisme',
      _count: { questions: 3 },
    });
    const res = await request(app)
      .patch(`/api/admin/pathologies/${ID}`)
      .set(ADMIN)
      .send({ title: 'Paludisme grave' });
    expect(res.status).toBe(200);
    expect(prisma.pathology.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: ID }, data: { title: 'Paludisme grave' } }),
    );
  });

  it('PATCH : 400 pour un corps vide ou un id invalide', async () => {
    expect(
      (await request(app).patch(`/api/admin/pathologies/${ID}`).set(ADMIN).send({})).status,
    ).toBe(400);
    expect(
      (await request(app).patch('/api/admin/pathologies/abc').set(ADMIN).send({ title: 'xx' }))
        .status,
    ).toBe(400);
  });

  it('DELETE : 204 ; 404 si la fiche n’existe pas', async () => {
    expect((await request(app).delete(`/api/admin/pathologies/${ID}`).set(ADMIN)).status).toBe(204);
    expect(deleteSpy).toHaveBeenCalledWith({ where: { id: ID } });

    nextDeleteError = new Prisma.PrismaClientKnownRequestError('absent', {
      code: 'P2025',
      clientVersion: 't',
    });
    expect((await request(app).delete(`/api/admin/pathologies/${ID}`).set(ADMIN)).status).toBe(404);
  });
});

describe('questions', () => {
  it('GET : l’administrateur voit les bonnes réponses', async () => {
    prisma.pathology.findUnique.mockResolvedValue({ id: ID });
    prisma.question.findMany.mockResolvedValue([{ id: 'q', options: qcmBody.options }]);
    const res = await request(app).get(`/api/admin/pathologies/${ID}/questions`).set(ADMIN);
    expect(res.status).toBe(200);
    expect(res.body.data[0].options[0].isCorrect).toBe(true);
  });

  it('POST QCM : 201, rattachée à la pathologie', async () => {
    prisma.pathology.findUnique.mockResolvedValue({ id: ID });
    prisma.question.create.mockResolvedValue({ id: 'q' });
    const res = await request(app)
      .post(`/api/admin/pathologies/${ID}/questions`)
      .set(ADMIN)
      .send(qcmBody);
    expect(res.status).toBe(201);
    expect(prisma.question.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ pathologyId: ID, type: 'QCM', explanation: null }),
      }),
    );
  });

  it('POST QCD : libellés normalisés en Vrai / Faux', async () => {
    prisma.pathology.findUnique.mockResolvedValue({ id: ID });
    prisma.question.create.mockResolvedValue({ id: 'q' });
    await request(app)
      .post(`/api/admin/pathologies/${ID}/questions`)
      .set(ADMIN)
      .send({
        text: 'Affirmation',
        type: 'QCD',
        options: [
          { text: 'oui', isCorrect: false },
          { text: 'non', isCorrect: true },
        ],
      });
    const { data } = prisma.question.create.mock.calls[0]?.[0] as { data: { options: unknown } };
    expect(data.options).toEqual([
      { text: 'Vrai', isCorrect: false },
      { text: 'Faux', isCorrect: true },
    ]);
  });

  it.each([
    [
      'QCM sans bonne réponse',
      { ...qcmBody, options: qcmBody.options.map((o) => ({ ...o, isCorrect: false })) },
    ],
    [
      'QCD avec deux bonnes réponses',
      {
        text: 'x',
        type: 'QCD',
        options: [
          { text: 'a', isCorrect: true },
          { text: 'b', isCorrect: true },
        ],
      },
    ],
    [
      'QCD à 3 options',
      {
        text: 'x',
        type: 'QCD',
        options: [
          { text: 'a', isCorrect: true },
          { text: 'b', isCorrect: false },
          { text: 'c', isCorrect: false },
        ],
      },
    ],
    ['type inconnu', { ...qcmBody, type: 'QCU' }],
    ['texte vide', { ...qcmBody, text: '  ' }],
  ])('POST : 400 pour %s', async (_label, body) => {
    const res = await request(app)
      .post(`/api/admin/pathologies/${ID}/questions`)
      .set(ADMIN)
      .send(body);
    expect(res.status).toBe(400);
    expect(prisma.question.create).not.toHaveBeenCalled();
  });

  it('POST : 404 si la pathologie n’existe pas', async () => {
    prisma.pathology.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .post(`/api/admin/pathologies/${ID}/questions`)
      .set(ADMIN)
      .send(qcmBody);
    expect(res.status).toBe(404);
  });

  it('PUT : met à jour ; le type ne peut pas changer ; 404 si absente', async () => {
    prisma.question.findUnique.mockResolvedValue({ type: 'QCM' });
    prisma.question.update.mockResolvedValue({ id: ID });
    expect(
      (await request(app).put(`/api/admin/questions/${ID}`).set(ADMIN).send(qcmBody)).status,
    ).toBe(200);

    const changeType = await request(app)
      .put(`/api/admin/questions/${ID}`)
      .set(ADMIN)
      .send({
        text: 'x',
        type: 'QCD',
        options: [
          { text: 'a', isCorrect: true },
          { text: 'b', isCorrect: false },
        ],
      });
    expect(changeType.status).toBe(400);
    expect(changeType.body.error.message).toMatch(/type/);

    prisma.question.findUnique.mockResolvedValue(null);
    expect(
      (await request(app).put(`/api/admin/questions/${ID}`).set(ADMIN).send(qcmBody)).status,
    ).toBe(404);
  });

  it('DELETE : 204', async () => {
    prisma.question.delete.mockResolvedValue({});
    expect((await request(app).delete(`/api/admin/questions/${ID}`).set(ADMIN)).status).toBe(204);
  });
});

describe('modération du forum', () => {
  it('DELETE sujet : 204', async () => {
    prisma.forumTopic.delete.mockResolvedValue({});
    expect((await request(app).delete(`/api/admin/forum/topics/${ID}`).set(ADMIN)).status).toBe(
      204,
    );
    expect(prisma.forumTopic.delete).toHaveBeenCalledWith({ where: { id: ID } });
  });

  it('DELETE message : supprime et décrémente le compteur de réponses (jamais sous 0)', async () => {
    prisma.forumPost.findUnique.mockResolvedValue({ topicId: 'topic-1' });
    prisma.forumPost.delete.mockResolvedValue({});
    prisma.forumTopic.updateMany.mockResolvedValue({ count: 1 });

    expect((await request(app).delete(`/api/admin/forum/posts/${ID}`).set(ADMIN)).status).toBe(204);

    expect(prisma.forumPost.delete).toHaveBeenCalledWith({ where: { id: ID } });
    expect(prisma.forumTopic.updateMany).toHaveBeenCalledWith({
      where: { id: 'topic-1', replyCount: { gt: 0 } },
      data: { replyCount: { decrement: 1 } },
    });
  });

  it('DELETE message : 404 s’il n’existe pas, sans rien supprimer', async () => {
    prisma.forumPost.findUnique.mockResolvedValue(null);
    expect((await request(app).delete(`/api/admin/forum/posts/${ID}`).set(ADMIN)).status).toBe(404);
    expect(prisma.forumPost.delete).not.toHaveBeenCalled();
  });
});
