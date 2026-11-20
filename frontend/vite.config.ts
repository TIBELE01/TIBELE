import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import { buildPwaOptions } from './pwa.config.ts';

export default defineConfig(({ mode }) => {
  const publicEnv = loadEnv(mode, process.cwd(), 'VITE_');

  // Garde-fou : toute variable VITE_* est publique (embarquée dans le bundle).
  // La clé « service role » de Supabase ne doit JAMAIS y figurer.
  const leaked = Object.keys(publicEnv).filter((name) => /service[_-]?role/i.test(name));
  if (leaked.length > 0) {
    throw new Error(
      `Variable interdite côté frontend : ${leaked.join(', ')}. La clé service role est réservée au backend.`,
    );
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      // Pas de service worker pendant les tests
      ...(process.env['VITEST'] ? [] : [VitePWA(buildPwaOptions(publicEnv['VITE_API_URL']))]),
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: { port: 5173 },
    preview: { port: 4173 },
    build: { target: 'es2022', sourcemap: false },
    test: {
      environment: 'jsdom',
      include: ['tests/**/*.test.{ts,tsx}'],
      setupFiles: ['tests/setup.ts'],
      passWithNoTests: true,
      // Variables factices : la validation de l'environnement s'exécute à l'import.
      env: {
        VITE_API_URL: 'http://localhost:4000',
        VITE_SUPABASE_URL: 'http://localhost:54321',
        VITE_SUPABASE_ANON_KEY: 'test-anon-key',
        VITE_DONATION_URL: '',
      },
    },
  };
});
