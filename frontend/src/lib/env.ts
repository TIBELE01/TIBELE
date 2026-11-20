/**
 * Variables d'environnement du frontend, validées au démarrage.
 *
 * Elles sont publiques (embarquées dans le bundle) : jamais de secret ici.
 * Si une variable obligatoire manque ou est invalide, l'application s'arrête
 * avec un message explicite plutôt que d'échouer plus tard de façon obscure.
 */
export interface AppEnv {
  /** URL de base de l'API, sans slash final (ex. https://api.tibele.ci). */
  apiUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  /** Lien de don Djamo ; `null` => popup de dons masqué. */
  donationUrl: string | null;
}

type Source = Record<string, string | undefined>;

function requireUrl(source: Source, name: string, errors: string[]): string {
  const value = source[name]?.trim();
  if (!value) {
    errors.push(`${name} est manquante`);
    return '';
  }
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('protocole');
    return value.replace(/\/+$/, '');
  } catch {
    errors.push(`${name} n'est pas une URL http(s) valide`);
    return '';
  }
}

/** Valide un objet de variables (exporté pour les tests). */
export function parseEnv(source: Source): AppEnv {
  const errors: string[] = [];

  const apiUrl = requireUrl(source, 'VITE_API_URL', errors);
  const supabaseUrl = requireUrl(source, 'VITE_SUPABASE_URL', errors);
  const supabaseAnonKey = source['VITE_SUPABASE_ANON_KEY']?.trim() ?? '';
  if (!supabaseAnonKey) errors.push('VITE_SUPABASE_ANON_KEY est manquante');

  let donationUrl: string | null = null;
  const rawDonation = source['VITE_DONATION_URL']?.trim();
  if (rawDonation) {
    try {
      if (new URL(rawDonation).protocol !== 'https:') throw new Error('protocole');
      donationUrl = rawDonation;
    } catch {
      errors.push('VITE_DONATION_URL doit être une URL https valide (ou vide)');
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Configuration invalide (voir frontend/.env.example) :\n${errors.map((e) => `  - ${e}`).join('\n')}`,
    );
  }
  return { apiUrl, supabaseUrl, supabaseAnonKey, donationUrl };
}

export const env: AppEnv = parseEnv(import.meta.env as Source);
