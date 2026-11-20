import { describe, expect, it } from 'vitest';
import { buildPwaOptions, pathologiesApiPattern, THEME_COLOR } from '../../../pwa.config.ts';

describe('cache des pathologies (stale-while-revalidate)', () => {
  const pattern = pathologiesApiPattern('https://api.tibele.ci');

  it.each([
    'https://api.tibele.ci/api/pathologies',
    'https://api.tibele.ci/api/pathologies?page=2&limit=12',
    'https://api.tibele.ci/api/pathologies?q=palu',
    'https://api.tibele.ci/api/pathologies/paludisme',
  ])('met en cache %s', (url) => {
    expect(pattern.test(url)).toBe(true);
  });

  it.each([
    'https://api.tibele.ci/api/quiz/pathologies/paludisme/questions',
    'https://api.tibele.ci/api/admin/pathologies/123',
    'https://api.tibele.ci/api/quiz/attempts',
    'https://api.tibele.ci/api/forum/topics',
    'https://api.tibele.ci/api/pathologiesX',
    'https://autre-site.example/api/pathologies',
  ])('ne met JAMAIS en cache %s', (url) => {
    expect(pattern.test(url)).toBe(false);
  });
});

describe('manifeste PWA', () => {
  const options = buildPwaOptions('https://api.tibele.ci');
  const manifest = options.manifest as Exclude<typeof options.manifest, false | undefined>;

  it('respecte le contexte : nom, standalone, couleurs, icônes requises', () => {
    expect(manifest).toMatchObject({
      name: 'TIBELE',
      short_name: 'TIBELE',
      display: 'standalone',
      theme_color: THEME_COLOR,
      background_color: '#ffffff',
    });
    const icons = manifest.icons ?? [];
    expect(icons.map((i) => `${i.sizes}${i.purpose ? `:${i.purpose}` : ''}`)).toEqual([
      '192x192',
      '512x512',
      '512x512:maskable',
    ]);
  });

  it('mise à jour automatique, et aucune règle d’API si l’URL est absente', () => {
    expect(options.registerType).toBe('autoUpdate');
    const withoutApi = buildPwaOptions(undefined).workbox?.runtimeCaching ?? [];
    expect(withoutApi.every((rule) => rule.options?.cacheName !== 'tibele-pathologies')).toBe(true);
  });
});
