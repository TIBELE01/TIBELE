import { describe, expect, it } from 'vitest';
import { parseEnv } from '../../../src/config/env.js';

const valid = {
  NODE_ENV: 'production',
  PORT: '8080',
  CORS_ORIGINS: 'https://tibele.ci/, http://localhost:5173',
  TRUST_PROXY: '1',
  DATABASE_URL: 'postgresql://u:p@host:6543/postgres',
  DIRECT_URL: 'postgresql://u:p@host:5432/postgres',
  SUPABASE_URL: 'https://abc.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'a-long-enough-service-role-key',
};

describe('parseEnv', () => {
  it('valide, convertit et normalise les variables', () => {
    const env = parseEnv(valid);
    expect(env.PORT).toBe(8080);
    expect(env.TRUST_PROXY).toBe(1);
    expect(env.CORS_ORIGINS).toEqual(['https://tibele.ci', 'http://localhost:5173']);
    expect(env.isProduction).toBe(true);
  });

  it('applique les valeurs par défaut', () => {
    const rest: Record<string, string> = { ...valid };
    delete rest['NODE_ENV'];
    delete rest['PORT'];
    delete rest['TRUST_PROXY'];
    const env = parseEnv(rest);
    expect(env).toMatchObject({ NODE_ENV: 'development', PORT: 4000, TRUST_PROXY: 0 });
  });

  it('liste les variables fautives sans révéler leurs valeurs', () => {
    const bad = { ...valid, SUPABASE_URL: 'pas-une-url', DATABASE_URL: 'mysql://secret' };
    expect(() => parseEnv(bad)).toThrow(/SUPABASE_URL/);
    try {
      parseEnv(bad);
    } catch (e) {
      expect(String(e)).toContain('DATABASE_URL');
      expect(String(e)).not.toContain('mysql://secret');
    }
  });

  it('refuse une origine CORS invalide ou un joker', () => {
    expect(() => parseEnv({ ...valid, CORS_ORIGINS: '*' })).toThrow(/CORS_ORIGINS/);
  });

  it('exige les variables obligatoires', () => {
    expect(() => parseEnv({})).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });
});
