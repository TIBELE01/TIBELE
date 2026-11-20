import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Dépendances externes simulées : aucune base ni appel réseau.
const prisma = {
  pathology: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
  $queryRaw: vi.fn(),
};
vi.mock('../../../src/config/prisma.js', () => ({ prisma }));

const { createApp } = await import('../../../src/app.js');
const app = createApp();

const summary = {
  id: 'p1',
  title: 'Paludisme',
  slug: 'paludisme',
  shortDescription: 'Maladie parasitaire',
  imageUrl: null,
};

beforeEach(() => {
  for (const fn of [prisma.pathology.findMany, prisma.pathology.count, prisma.pathology.findUnique])
    fn.mockReset();
  prisma.$queryRaw.mockReset();
});

describe('GET /api/pathologies', () => {
  it('liste paginée, publique (sans jeton)', async () => {
    prisma.pathology.findMany.mockResolvedValue([summary]);
    prisma.pathology.count.mockResolvedValue(25);

    const res = await request(app).get('/api/pathologies?page=2&limit=10');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([summary]);
    expect(res.body.meta).toEqual({ page: 2, pageSize: 10, total: 25, totalPages: 3 });
    expect(prisma.pathology.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
    // Le vecteur de recherche ne doit jamais être sélectionné
    expect(JSON.stringify(prisma.pathology.findMany.mock.calls[0])).not.toContain('searchVector');
  });

  it('avec q : passe par la recherche full-text (requête brute paramétrée)', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([summary]).mockResolvedValueOnce([{ total: 1 }]);

    const res = await request(app).get('/api/pathologies?q=palu');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([summary]);
    expect(res.body.meta.total).toBe(1);
    expect(prisma.pathology.findMany).not.toHaveBeenCalled();
    // La saisie est transmise comme paramètre lié, jamais concaténée dans le SQL
    const sqlObject = prisma.$queryRaw.mock.calls[0]?.[0] as { sql: string; values: unknown[] };
    expect(sqlObject.values).toContain('palu');
    expect(sqlObject.values).toContain('%palu%');
    expect(sqlObject.sql).not.toContain('palu');
  });

  it('échappe les jokers LIKE saisis par l’utilisateur', async () => {
    prisma.$queryRaw.mockResolvedValue([]);
    await request(app).get('/api/pathologies?q=50%25_x');
    const sqlObject = prisma.$queryRaw.mock.calls[0]?.[0] as { values: unknown[] };
    expect(sqlObject.values).toContain('%50\\%\\_x%');
  });

  it('400 si les paramètres sont invalides', async () => {
    const res = await request(app).get('/api/pathologies?limit=999');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/pathologies/:slug', () => {
  it('renvoie la fiche complète avec le nombre de questions', async () => {
    prisma.pathology.findUnique.mockResolvedValue({
      ...summary,
      definition: 'def',
      exams: ['TDR'],
      references: [],
      _count: { questions: 10 },
    });

    const res = await request(app).get('/api/pathologies/paludisme');

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ slug: 'paludisme', exams: ['TDR'], questionsCount: 10 });
    expect(res.body.data._count).toBeUndefined();
    expect(prisma.pathology.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: 'paludisme' } }),
    );
  });

  it('404 si le slug est inconnu', async () => {
    prisma.pathology.findUnique.mockResolvedValue(null);
    const res = await request(app).get('/api/pathologies/inconnu');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('400 pour un slug mal formé, sans interroger la base', async () => {
    const res = await request(app).get('/api/pathologies/Mauvais_Slug');
    expect(res.status).toBe(400);
    expect(prisma.pathology.findUnique).not.toHaveBeenCalled();
  });
});

describe('application', () => {
  it('/health répond, route inconnue = 404 au format standard', async () => {
    expect((await request(app).get('/health')).body).toEqual({ status: 'ok' });
    const res = await request(app).get('/api/nimporte');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('en-têtes de sécurité et CORS en liste blanche', async () => {
    const res = await request(app).get('/health').set('Origin', 'http://localhost:5173');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');

    const other = await request(app).get('/health').set('Origin', 'https://evil.example');
    expect(other.headers['access-control-allow-origin']).toBeUndefined();
  });
});
