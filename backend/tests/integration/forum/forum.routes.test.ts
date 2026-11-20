import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USER_ID } from '../../helpers/supabase-mock.js';

const prisma = {
  pathology: { findUnique: vi.fn() },
  forumTopic: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
};
vi.mock('../../../src/config/prisma.js', () => ({ prisma }));

// Supabase simulé : seul le jeton « jeton-valide » est accepté.
vi.mock('../../../src/config/supabase.js', () => ({
  supabaseAdmin: {
    auth: {
      getUser: (token: string) =>
        Promise.resolve(
          token === 'jeton-valide'
            ? { data: { user: { id: USER_ID, email: 'a@x.ci', app_metadata: {} } }, error: null }
            : { data: { user: null }, error: { name: 'AuthApiError', status: 401 } },
        ),
    },
  },
}));

const { createApp } = await import('../../../src/app.js');
const app = createApp();

const topic = {
  id: '22222222-2222-4222-8222-222222222222',
  title: 'Question sur le TDR',
  replyCount: 0,
  createdAt: new Date('2026-01-01T10:00:00Z'),
  author: { fullName: 'Awa Koné' },
  pathology: null,
};

beforeEach(() => {
  for (const group of [prisma.forumTopic, prisma.pathology])
    for (const fn of Object.values(group)) fn.mockReset();
});

describe('GET /api/forum/topics', () => {
  it('liste paginée, 10 par page, du plus récent au plus ancien', async () => {
    prisma.forumTopic.findMany.mockResolvedValue([topic]);
    prisma.forumTopic.count.mockResolvedValue(23);

    const res = await request(app).get('/api/forum/topics?page=3');

    expect(res.status).toBe(200);
    expect(res.body.meta).toEqual({ page: 3, pageSize: 10, total: 23, totalPages: 3 });
    expect(res.body.data[0].author).toEqual({ fullName: 'Awa Koné' });
    expect(prisma.forumTopic.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 10,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      }),
    );
  });

  it('ne sélectionne jamais d’email ni d’identifiant d’auteur', async () => {
    prisma.forumTopic.findMany.mockResolvedValue([]);
    prisma.forumTopic.count.mockResolvedValue(0);
    await request(app).get('/api/forum/topics');
    const select = (
      prisma.forumTopic.findMany.mock.calls[0]?.[0] as { select: { author: unknown } }
    ).select.author;
    expect(select).toEqual({ select: { fullName: true } });
  });
});

describe('GET /api/forum/topics/:id', () => {
  it('404 si absent, 400 si l’id n’est pas un UUID', async () => {
    prisma.forumTopic.findUnique.mockResolvedValue(null);
    expect((await request(app).get(`/api/forum/topics/${topic.id}`)).status).toBe(404);
    expect((await request(app).get('/api/forum/topics/abc')).status).toBe(400);
  });

  it('renvoie le sujet avec son contenu', async () => {
    prisma.forumTopic.findUnique.mockResolvedValue({ ...topic, content: 'Bonjour' });
    const res = await request(app).get(`/api/forum/topics/${topic.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.content).toBe('Bonjour');
  });
});

describe('POST /api/forum/topics', () => {
  const body = { title: '  Nouveau sujet  ', content: 'Contenu <script>alert(1)</script>' };

  it('401 sans jeton ou avec un jeton invalide, sans toucher à la base', async () => {
    expect((await request(app).post('/api/forum/topics').send(body)).status).toBe(401);
    const bad = await request(app)
      .post('/api/forum/topics')
      .set('Authorization', 'Bearer faux')
      .send(body);
    expect(bad.status).toBe(401);
    expect(prisma.forumTopic.create).not.toHaveBeenCalled();
  });

  it('201 : crée le sujet au nom de l’utilisateur authentifié, contenu stocké tel quel', async () => {
    prisma.forumTopic.create.mockResolvedValue({ ...topic, content: body.content });

    const res = await request(app)
      .post('/api/forum/topics')
      .set('Authorization', 'Bearer jeton-valide')
      .send({ ...body, authorId: 'usurpation', replyCount: 99 });

    expect(res.status).toBe(201);
    const { data } = prisma.forumTopic.create.mock.calls[0]?.[0] as {
      data: Record<string, unknown>;
    };
    // L'auteur vient du jeton ; les champs superflus envoyés par le client sont ignorés
    expect(data).toEqual({
      title: 'Nouveau sujet',
      content: body.content,
      authorId: USER_ID,
      pathologyId: null,
    });
  });

  it('400 si la pathologie associée n’existe pas', async () => {
    prisma.pathology.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/forum/topics')
      .set('Authorization', 'Bearer jeton-valide')
      .send({ ...body, pathologyId: '33333333-3333-4333-8333-333333333333' });
    expect(res.status).toBe(400);
    expect(prisma.forumTopic.create).not.toHaveBeenCalled();
  });

  it('400 si les données sont invalides (détail par champ)', async () => {
    const res = await request(app)
      .post('/api/forum/topics')
      .set('Authorization', 'Bearer jeton-valide')
      .send({ title: 'x', content: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d: { path: string }) => d.path).sort()).toEqual([
      'content',
      'title',
    ]);
  });
});
