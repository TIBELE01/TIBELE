import { describe, expect, it } from 'vitest';
import { mapAuthError } from '@/lib/auth-errors';
import { toCurrentUser } from '@/lib/auth-user';
import { getRedirectTarget } from '@/lib/redirect';
import {
  validateEmail,
  validateFullName,
  validateLoginPassword,
  validateNewPassword,
} from '@/lib/validation';
import { fakeUser } from '../../helpers/supabase-mock';

describe('toCurrentUser — rôle', () => {
  it('administrateur si app_metadata.role = admin', () => {
    expect(toCurrentUser(fakeUser({ role: 'admin' })).role).toBe('admin');
  });

  it('utilisateur par défaut', () => {
    expect(toCurrentUser(fakeUser()).role).toBe('user');
  });

  it('IGNORE user_metadata (modifiable par l’utilisateur) : pas d’escalade de privilèges', () => {
    expect(toCurrentUser(fakeUser({ userRole: 'admin' })).role).toBe('user');
  });

  it('extrait le nom complet', () => {
    expect(toCurrentUser(fakeUser({ fullName: '  Awa Koné ' })).fullName).toBe('Awa Koné');
    expect(toCurrentUser(fakeUser()).fullName).toBeNull();
  });
});

describe('mapAuthError', () => {
  it.each([
    [{ code: 'invalid_credentials' }, /incorrect/],
    [{ code: 'email_not_confirmed' }, /confirmée/],
    [{ code: 'user_already_exists' }, /existe déjà/],
    [{ code: 'email_exists' }, /existe déjà/],
    [{ code: 'weak_password' }, /trop faible/],
    [{ code: 'over_request_rate_limit' }, /Trop de tentatives/],
    [{ name: 'AuthRetryableFetchError', status: 0 }, /connexion internet/],
    [{ message: 'Invalid login credentials' }, /incorrect/],
    [{ message: 'User already registered' }, /existe déjà/],
    [{ message: 'Failed to fetch' }, /connexion internet/],
    [{ message: 'boom' }, /Une erreur est survenue/],
  ])('%j -> %s', (error, expected) => {
    expect(mapAuthError(error)).toMatch(expected);
  });

  it('ne laisse jamais fuiter un message technique brut', () => {
    expect(mapAuthError({ message: 'duplicate key value violates constraint' })).not.toMatch(
      /duplicate/,
    );
  });
});

describe('validation', () => {
  it('email', () => {
    expect(validateEmail('')).toMatch(/Saisissez/);
    expect(validateEmail('pas-un-email')).toMatch(/invalide/);
    expect(validateEmail('  awa@exemple.ci ')).toBeNull();
  });

  it('mot de passe : connexion non vide, inscription >= 8 caractères', () => {
    expect(validateLoginPassword('')).toMatch(/Saisissez/);
    expect(validateLoginPassword('x')).toBeNull();
    expect(validateNewPassword('')).toMatch(/Choisissez/);
    expect(validateNewPassword('1234567')).toMatch(/au moins 8/);
    expect(validateNewPassword('12345678')).toBeNull();
  });

  it('nom complet limité à 120 caractères', () => {
    expect(validateFullName('x'.repeat(121))).toMatch(/trop long/);
    expect(validateFullName('')).toBeNull();
  });
});

describe('getRedirectTarget', () => {
  it('renvoie la page demandée, avec sa query string', () => {
    expect(getRedirectTarget({ from: { pathname: '/historique', search: '?page=2' } })).toBe(
      '/historique?page=2',
    );
  });

  it.each([
    [undefined],
    [null],
    [{}],
    [{ from: { pathname: '//evil.example' } }],
    [{ from: { pathname: 'https://evil.example' } }],
    [{ from: { pathname: '/connexion' } }],
    [{ from: { pathname: '/inscription' } }],
    [{ from: { pathname: 42 } }],
  ])('retombe sur l’accueil pour %j (jamais de redirection externe ni de boucle)', (state) => {
    expect(getRedirectTarget(state)).toBe('/');
  });
});
