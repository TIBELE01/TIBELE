import { describe, expect, it } from 'vitest';
import { createTopicBody, listTopicsQuery } from '../../../src/validators/forum.validator.js';
import {
  listPathologiesQuery,
  pathologyParams,
} from '../../../src/validators/pathologies.validator.js';

describe('listPathologiesQuery', () => {
  it('applique les valeurs par défaut', () => {
    expect(listPathologiesQuery.parse({})).toEqual({ page: 1, limit: 12, q: undefined });
  });

  it('convertit les chaînes, rogne q et traite « vide » comme absent', () => {
    expect(listPathologiesQuery.parse({ page: '2', limit: '5', q: '  palu ' })).toEqual({
      page: 2,
      limit: 5,
      q: 'palu',
    });
    expect(listPathologiesQuery.parse({ q: '   ' }).q).toBeUndefined();
  });

  it.each([
    { page: '0' },
    { page: 'abc' },
    { limit: '51' },
    { limit: '0' },
    { q: 'x'.repeat(101) },
  ])('rejette %j', (query) => {
    expect(listPathologiesQuery.safeParse(query).success).toBe(false);
  });
});

describe('pathologyParams', () => {
  it('accepte un slug valide et refuse le reste', () => {
    expect(pathologyParams.safeParse({ slug: 'diabete-de-type-2' }).success).toBe(true);
    for (const slug of ['Majuscule', 'a b', '-x', "x'; DROP TABLE", '../etc']) {
      expect(pathologyParams.safeParse({ slug }).success).toBe(false);
    }
  });
});

describe('forum validators', () => {
  it('createTopicBody : rogne et valide', () => {
    const parsed = createTopicBody.parse({
      title: '  Question sur le TDR  ',
      content: ' Bonjour ',
    });
    expect(parsed).toEqual({
      title: 'Question sur le TDR',
      content: 'Bonjour',
      pathologyId: undefined,
    });
  });

  it('createTopicBody : refuse titre court, contenu vide, uuid invalide, caractère nul', () => {
    const base = { title: 'Titre valide', content: 'ok' };
    expect(createTopicBody.safeParse({ ...base, title: 'ab' }).success).toBe(false);
    expect(createTopicBody.safeParse({ ...base, content: '   ' }).success).toBe(false);
    expect(createTopicBody.safeParse({ ...base, pathologyId: 'pas-un-uuid' }).success).toBe(false);
    expect(createTopicBody.safeParse({ ...base, content: 'a\u0000b' }).success).toBe(false);
    expect(createTopicBody.safeParse({ ...base, pathologyId: null }).success).toBe(true);
  });

  it('listTopicsQuery : page >= 1', () => {
    expect(listTopicsQuery.parse({}).page).toBe(1);
    expect(listTopicsQuery.safeParse({ page: '0' }).success).toBe(false);
  });
});
