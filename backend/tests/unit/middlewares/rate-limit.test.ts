import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { errorHandler } from '../../../src/middlewares/error-handler.js';
import {
  buildGlobalRateLimiter,
  buildWriteRateLimiter,
} from '../../../src/middlewares/rate-limit.js';

// En environnement de test, les limiteurs sont inactifs par défaut : on les active ici.
const active = { disabled: false };

describe('rate limiting', () => {
  it('limiteur global : 429 au format standard après dépassement', async () => {
    const app = express();
    app.use(buildGlobalRateLimiter({ limit: 2, ...active }));
    app.get('/', (_req, res) => {
      res.json({ ok: true });
    });
    app.use(errorHandler);

    expect((await request(app).get('/')).status).toBe(200);
    expect((await request(app).get('/')).status).toBe(200);
    const blocked = await request(app).get('/');
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('TOO_MANY_REQUESTS');
    expect(blocked.headers['retry-after']).toBeDefined();
  });

  it('limiteur d’écriture : ne compte que les méthodes d’écriture', async () => {
    const app = express();
    app.use(buildWriteRateLimiter({ limit: 1, ...active }));
    app.all('/', (_req, res) => {
      res.json({ ok: true });
    });
    app.use(errorHandler);

    // Les lectures ne consomment pas le quota
    for (let i = 0; i < 3; i++) expect((await request(app).get('/')).status).toBe(200);
    expect((await request(app).post('/')).status).toBe(200);
    expect((await request(app).post('/')).status).toBe(429);
  });

  it('valeur par défaut du limiteur global : 300 / 15 min', () => {
    // Vérifié via les en-têtes d'une instance réellement active
    const app = express();
    app.use(buildGlobalRateLimiter(active));
    app.get('/', (_req, res) => {
      res.json({});
    });
    return request(app)
      .get('/')
      .then((res) => {
        expect(res.headers['ratelimit-policy']).toContain('300');
        expect(res.headers['ratelimit-policy']).toContain('900');
      });
  });
});
