/**
 * Client Supabase côté navigateur, avec la clé PUBLIQUE « anon ».
 *
 * Sert uniquement à l'authentification (inscription, connexion, session,
 * rafraîchissement des jetons). Les données passent par l'API backend, qui
 * vérifie le jeton d'accès envoyé dans le header Authorization.
 */
import { createClient } from '@supabase/supabase-js';
import { env } from './env';

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
