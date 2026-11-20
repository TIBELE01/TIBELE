/**
 * Client Prisma (singleton).
 *
 * - Se connecte avec `DATABASE_URL` (URL avec pooler Supabase) via l'adaptateur
 *   `pg`. Les migrations, elles, utilisent `DIRECT_URL` (voir prisma.config.ts).
 * - Singleton conservé sur `globalThis` pour éviter d'ouvrir de nouveaux pools
 *   à chaque rechargement à chaud en développement (`tsx watch`).
 * - Prisma ne touche jamais au schéma `auth` : seules les tables de `public`
 *   sont déclarées dans schema.prisma.
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { env } from './env.js';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({
    adapter,
    log: env.isProduction ? ['error'] : ['warn', 'error'],
  });
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (!env.isProduction) {
  globalForPrisma.prisma = prisma;
}

/** Ferme proprement les connexions (à appeler à l'arrêt du serveur). */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
