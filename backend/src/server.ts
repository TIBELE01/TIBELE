/**
 * Point d'entrée : démarre le serveur HTTP et gère l'arrêt propre.
 * (L'application elle-même — middlewares globaux, routes, erreurs — est
 * assemblée dans app.ts.)
 */
import { createApp } from './app.js';
import { env } from './config/env.js';
import { disconnectPrisma } from './config/prisma.js';

const server = createApp().listen(env.PORT, () => {
  console.info(`[tibele-api] à l'écoute sur le port ${env.PORT} (${env.NODE_ENV})`);
});

// Plus longs que le délai d'inactivité des reverse proxies / load balancers
// (souvent 60 s), sinon ils réutilisent une connexion déjà fermée (erreurs 502).
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;

server.on('error', (err: NodeJS.ErrnoException) => {
  console.error(
    err.code === 'EADDRINUSE'
      ? `[tibele-api] le port ${env.PORT} est déjà utilisé`
      : '[tibele-api] erreur du serveur',
    err,
  );
  process.exit(1);
});

let shuttingDown = false;

/**
 * Arrêt propre : cesse d'accepter des connexions, laisse finir les requêtes en
 * cours, ferme la base, puis quitte avec le code demandé.
 */
function shutdown(reason: string, exitCode = 0): void {
  if (shuttingDown) return;
  shuttingDown = true;
  console.info(`[tibele-api] ${reason}, arrêt en cours…`);

  // Garde-fou : on force la sortie si l'arrêt traîne.
  setTimeout(() => process.exit(1), 10_000).unref();

  server.close(() => {
    disconnectPrisma()
      .catch((err: unknown) => console.error('[tibele-api] erreur à la déconnexion', err))
      .finally(() => process.exit(exitCode));
  });
  // Ferme les connexions keep-alive inactives pour que `close` se termine vite.
  server.closeIdleConnections();
}

process.on('SIGTERM', () => shutdown('SIGTERM reçu'));
process.on('SIGINT', () => shutdown('SIGINT reçu'));

// Un rejet de promesse non géré est journalisé ; une exception non interceptée
// laisse le processus dans un état incertain : arrêt propre puis sortie en erreur.
process.on('unhandledRejection', (reason) => console.error('[tibele-api] rejet non géré', reason));
process.on('uncaughtException', (err) => {
  console.error('[tibele-api] exception non interceptée', err);
  shutdown('exception non interceptée', 1);
});
