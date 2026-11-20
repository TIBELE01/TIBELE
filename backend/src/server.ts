/** Point d'entrée : démarre le serveur HTTP et gère l'arrêt propre. */
import { createApp } from './app.js';
import { disconnectPrisma } from './config/prisma.js';
import { env } from './config/env.js';

const server = createApp().listen(env.PORT, () => {
  console.info(`[tibele-api] à l'écoute sur le port ${env.PORT} (${env.NODE_ENV})`);
});

let shuttingDown = false;

/** Arrêt propre : cesse d'accepter des requêtes, ferme la base, puis quitte. */
function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;
  console.info(`[tibele-api] ${signal} reçu, arrêt en cours…`);

  // Garde-fou : on force la sortie si l'arrêt traîne.
  setTimeout(() => process.exit(1), 10_000).unref();

  server.close(() => {
    disconnectPrisma()
      .catch((err: unknown) => console.error('[tibele-api] erreur à la déconnexion', err))
      .finally(() => process.exit(0));
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => console.error('[tibele-api] rejet non géré', reason));
