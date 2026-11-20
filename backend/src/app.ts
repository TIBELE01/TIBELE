/**
 * Construction de l'application Express (sans écouter sur un port, pour pouvoir
 * la tester avec supertest). L'ordre des middlewares est important.
 */
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler, globalRateLimiter, notFoundHandler } from './middlewares/index.js';
import { apiRouter } from './routes/index.js';

export function createApp(): Express {
  const app = express();

  // Derrière un reverse proxy : lire la vraie IP client (rate limiting).
  app.set('trust proxy', env.TRUST_PROXY);

  // En-têtes de sécurité HTTP (retire aussi `X-Powered-By`).
  app.use(helmet());

  // CORS : liste blanche d'origines uniquement.
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 600,
    }),
  );

  // Sonde de vie (hébergeur) : avant le rate limiting pour ne jamais être bloquée.
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(globalRateLimiter);
  app.use(express.json({ limit: '100kb' }));

  app.use('/api', apiRouter);

  // Toujours en dernier : 404 puis gestionnaire d'erreurs centralisé.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
