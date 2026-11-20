/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/** Variables d'environnement exposées au navigateur (toutes PUBLIQUES). */
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_DONATION_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
