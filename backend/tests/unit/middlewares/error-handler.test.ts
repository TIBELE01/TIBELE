import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ConflictError } from '../../../src/errors/index.js';
import { Prisma } from '../../../src/generated/prisma/client.js';
import { errorHandler } from '../../../src/middlewares/error-handler.js';
import { notFoundHandler } from '../../../src/middlewares/not-found.js';

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('boom', { code, clientVersion: 'test' });
}

const app = express();
app.use(express.json({ limit: '1kb' }));
app.post('/echo', (req, res) => {
  res.json(req.body);
});
app.get('/app-error', () => {
  throw new ConflictError('déjà pris');
});
app.get('/zod', () => {
  z.object({ title: z.string().min(1) }).parse({ title: '' });
});
app.get('/async', async () => {
  await Promise.reject(new Error('secret interne'));
});
app.get('/p2002', () => {
  throw prismaError('P2002');
});
app.get('/p2025', () => {
  throw prismaError('P2025');
});
app.use(notFoundHandler);
app.use(errorHandler);

afterEach(() => vi.restoreAllMocks());

describe('errorHandler', () => {
  it('formate une AppError', async () => {
    const res = await request(app).get('/app-error');
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: { code: 'CONFLICT', message: 'déjà pris' } });
  });

  it('convertit une erreur Zod en 400 avec le détail par champ', async () => {
    const res = await request(app).get('/zod');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0].path).toBe('title');
  });

  it('traduit les erreurs Prisma P2002 / P2025', async () => {
    expect((await request(app).get('/p2002')).status).toBe(409);
    expect((await request(app).get('/p2025')).status).toBe(404);
  });

  it('500 générique sans fuite de détail, et journalise l’erreur (rejet async inclus)', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(app).get('/async');
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('secret interne');
    expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(log).toHaveBeenCalledOnce();
  });

  it('400 pour un JSON invalide et 413 pour un corps trop gros', async () => {
    const bad = await request(app).post('/echo').set('Content-Type', 'application/json').send('{x');
    expect(bad.status).toBe(400);
    expect(bad.body.error.message).toMatch(/JSON/);
    const big = await request(app)
      .post('/echo')
      .send({ a: 'x'.repeat(5000) });
    expect(big.status).toBe(413);
  });

  it('404 au format standard pour une route inconnue', async () => {
    const res = await request(app).get('/nimporte-quoi');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
