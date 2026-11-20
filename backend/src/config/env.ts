/**
 * Chargement et validation des variables d'environnement.
 *
 * - Le fichier `.env` est chargé s'il existe (les variables déjà présentes dans
 *   l'environnement du processus ont priorité, ce qui convient à la production).
 * - Tout est validé avec Zod au démarrage : si une variable manque ou est
 *   invalide, le processus s'arrête immédiatement avec un message explicite
 *   (les noms des variables fautives sont listés, jamais leurs valeurs).
 * - Le reste du code importe `env` d'ici et n'accède jamais à `process.env`.
 */
import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv({ quiet: true });

/** Liste d'origines CORS séparées par des virgules, normalisées (sans « / » final). */
const corsOrigins = z
  .string()
  .min(1, 'au moins une origine est requise')
  .transform((value, ctx) => {
    const origins: string[] = [];
    for (const raw of value.split(',')) {
      const item = raw.trim();
      if (!item) continue;
      try {
        const { origin } = new URL(item);
        if (origin === 'null') throw new Error('origine invalide');
        origins.push(origin);
      } catch {
        ctx.addIssue({ code: 'custom', message: `origine invalide : « ${item} »` });
        return z.NEVER;
      }
    }
    if (origins.length === 0) {
      ctx.addIssue({ code: 'custom', message: 'au moins une origine est requise' });
      return z.NEVER;
    }
    return origins;
  });

const envSchema = z.object({
  // --- Application ---
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  CORS_ORIGINS: corsOrigins,
  /** Nombre de proxys de confiance (0 en local, 1 derrière un reverse proxy). */
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),

  // --- Base de données ---
  /** URL avec pooler : requêtes applicatives. */
  DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, 'doit commencer par postgresql://'),
  /** URL directe : migrations uniquement (lue par prisma.config.ts, validée ici aussi). */
  DIRECT_URL: z.string().regex(/^postgres(ql)?:\/\//, 'doit commencer par postgresql://'),

  // --- Supabase ---
  SUPABASE_URL: z.url(),
  /** Clé service role : réservée au backend, ne doit jamais atteindre le frontend. */
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, 'clé trop courte ou absente'),
});

export type Env = z.infer<typeof envSchema> & {
  readonly isProduction: boolean;
  readonly isTest: boolean;
};

/**
 * Valide une source de variables (exporté pour les tests).
 * @throws Error listant les variables invalides, sans jamais afficher leurs valeurs.
 */
export function parseEnv(source: NodeJS.ProcessEnv): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const lines = result.error.issues.map(
      (issue) => `  - ${issue.path.join('.') || '(env)'} : ${issue.message}`,
    );
    throw new Error(
      `Variables d'environnement invalides ou manquantes (voir backend/.env.example) :\n${lines.join('\n')}`,
    );
  }
  const data = result.data;
  return {
    ...data,
    isProduction: data.NODE_ENV === 'production',
    isTest: data.NODE_ENV === 'test',
  };
}

export const env: Env = parseEnv(process.env);
