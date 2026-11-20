import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    passWithNoTests: true,
    // Variables factices : la validation de l'environnement s'exécute à l'import.
    env: {
      NODE_ENV: 'test',
      PORT: '4000',
      CORS_ORIGINS: 'http://localhost:5173',
      DATABASE_URL: 'postgresql://user:pass@localhost:6543/test',
      DIRECT_URL: 'postgresql://user:pass@localhost:5432/test',
      SUPABASE_URL: 'http://localhost:54321',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key-0123456789',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/generated/**'],
      reporter: ['text', 'html'],
    },
  },
});
