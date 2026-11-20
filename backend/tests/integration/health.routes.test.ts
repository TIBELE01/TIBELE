import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

// Panne simulée hors spy (Vitest 5 fait échouer un test si un spy rejette).
let databaseDown = false;
const prisma = {
  $queryRaw: () =>
    databaseDown ? Promise.reject(new Error('base injoignable')) : Promise.resolve([1]),
};
vi.mock('../../src/config/prisma.js', () => ({ prisma }));

const { createApp } = await import('../../src/app.js');
const app = createApp();

describe('sondes de santé', () => {
  it('/health : liveness sans accès à la base', async () => {
    databaseDown = true;
    expect((await request(app).get('/health')).body).toEqual({ status: 'ok' });
  });

  it('/health/ready : 200 si la base répond, 503 sinon', async () => {
    databaseDown = false;
    const ok = await request(app).get('/health/ready');
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual({ status: 'ok', database: 'up' });

    databaseDown = true;
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const ko = await request(app).get('/health/ready');
    expect(ko.status).toBe(503);
    expect(ko.body).toEqual({ status: 'unavailable', database: 'down' });
    log.mockRestore();
  });
});
