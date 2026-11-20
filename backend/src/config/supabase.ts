/**
 * Client Supabase côté serveur, en mode « service role ».
 *
 * Usage exclusif : vérifier les jetons émis par Supabase Auth
 * (`supabaseAdmin.auth.getUser(token)`) et, plus tard, des opérations
 * d'administration (script de seed). Le backend ne gère NI l'inscription NI la
 * connexion : elles sont faites par le frontend avec la clé publique.
 *
 * ⚠️ La clé service role contourne toute la sécurité Supabase : elle ne doit
 * jamais quitter le backend (ni logs, ni réponses, ni bundle client).
 */
import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    // Backend sans état : aucune session n'est conservée ni rafraîchie.
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});
