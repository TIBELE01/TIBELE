// Configuration de la CLI Prisma (v7).
// - Les migrations utilisent l'URL DIRECTE (DIRECT_URL), sans pooler.
// - À l'exécution, l'application utilise l'URL avec pooler (DATABASE_URL)
//   via l'adaptateur @prisma/adapter-pg (voir src/config).
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx scripts/seed/index.ts',
  },
  datasource: {
    // Chaîne vide tolérée pour permettre `prisma generate` sans base configurée
    url: process.env.DIRECT_URL ?? '',
  },
});
