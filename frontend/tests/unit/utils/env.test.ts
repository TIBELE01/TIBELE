import { describe, expect, it } from 'vitest';
import { parseEnv } from '@/lib/env';

const valid = {
  VITE_API_URL: 'https://api.tibele.ci/',
  VITE_SUPABASE_URL: 'https://abc.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'anon-key',
};

describe('parseEnv', () => {
  it('valide, retire le slash final et rend le lien de don facultatif', () => {
    expect(parseEnv(valid)).toEqual({
      apiUrl: 'https://api.tibele.ci',
      supabaseUrl: 'https://abc.supabase.co',
      supabaseAnonKey: 'anon-key',
      donationUrl: null,
    });
  });

  it('accepte un lien de don https', () => {
    expect(parseEnv({ ...valid, VITE_DONATION_URL: 'https://pay.djamo.com/xyz' }).donationUrl).toBe(
      'https://pay.djamo.com/xyz',
    );
  });

  it('liste toutes les variables manquantes ou invalides', () => {
    expect(() => parseEnv({})).toThrow(/VITE_API_URL[\s\S]*VITE_SUPABASE_URL[\s\S]*ANON_KEY/);
    expect(() => parseEnv({ ...valid, VITE_API_URL: 'pas-une-url' })).toThrow(/VITE_API_URL/);
    expect(() => parseEnv({ ...valid, VITE_API_URL: 'javascript:alert(1)' })).toThrow(
      /VITE_API_URL/,
    );
  });

  it('refuse un lien de don qui n’est pas en https', () => {
    expect(() => parseEnv({ ...valid, VITE_DONATION_URL: 'http://pay.exemple.ci' })).toThrow(
      /VITE_DONATION_URL/,
    );
  });
});
