import { describe, expect, it } from 'vitest';
import { SLUG_PATTERN } from '../../../src/constants/pagination.js';
import { buildPaginationMeta, toSkipTake } from '../../../src/utils/pagination.js';
import { slugify } from '../../../src/utils/slug.js';
import { escapeLike } from '../../../src/utils/sql.js';

describe('slugify', () => {
  it.each([
    ['Hypertension artérielle', 'hypertension-arterielle'],
    ['  Gastro-entérite   aiguë ! ', 'gastro-enterite-aigue'],
    ['Paludisme (à P. falciparum)', 'paludisme-a-p-falciparum'],
    ['Cœur & Œdème', 'coeur-oedeme'],
    ['Diabète de type 2', 'diabete-de-type-2'],
  ])('%s -> %s', (input, expected) => {
    const slug = slugify(input);
    expect(slug).toBe(expected);
    expect(slug).toMatch(SLUG_PATTERN);
  });

  it('renvoie une chaîne vide sans caractère exploitable', () => {
    expect(slugify('!!! ???')).toBe('');
  });

  it('tronque sans laisser de tiret final', () => {
    expect(slugify('abc def ghi', 7)).toBe('abc-def');
  });
});

describe('pagination', () => {
  it('calcule skip / take', () => {
    expect(toSkipTake(1, 10)).toEqual({ skip: 0, take: 10 });
    expect(toSkipTake(3, 12)).toEqual({ skip: 24, take: 12 });
  });

  it('calcule les métadonnées', () => {
    expect(buildPaginationMeta(2, 10, 25)).toEqual({
      page: 2,
      pageSize: 10,
      total: 25,
      totalPages: 3,
    });
    expect(buildPaginationMeta(1, 10, 0).totalPages).toBe(0);
  });
});

describe('escapeLike', () => {
  it('échappe %, _ et \\', () => {
    expect(escapeLike('50%_a\\b')).toBe('50\\%\\_a\\\\b');
    expect(escapeLike('paludisme')).toBe('paludisme');
  });
});
