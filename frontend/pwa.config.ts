/**
 * Configuration PWA (manifeste + service worker Workbox), isolée de vite.config.ts
 * pour pouvoir être testée.
 *
 * Stratégies de cache (CONTEXTE §9) :
 *  - Fichiers statiques (JS, CSS, HTML, icônes) : PRÉCACHE, donc servis depuis
 *    le cache d'abord (cache-first), versionnés par le build.
 *  - Endpoints des pathologies : stale-while-revalidate -> une fiche déjà
 *    consultée reste lisible hors ligne ou en zone à faible connectivité,
 *    et se met à jour en arrière-plan.
 *  - Tout le reste de l'API (quiz, forum, admin, historique…) : JAMAIS mis en
 *    cache — données personnelles, et les questions de quiz ne doivent pas
 *    être conservées hors du contrôle du serveur.
 *
 * ⚠️ Les `urlPattern` sont recopiés tels quels dans le service worker : ils ne
 * doivent référencer aucune variable extérieure (d'où l'usage de RegExp).
 */
import type { VitePWAOptions } from 'vite-plugin-pwa';

export const THEME_COLOR = '#0B3D91';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Reconnaît `<api>/api/pathologies`, `<api>/api/pathologies/<slug>` et la
 * recherche `?q=…`, mais PAS `/api/quiz/pathologies/…` ni `/api/admin/pathologies/…`.
 */
export function pathologiesApiPattern(apiUrl: string): RegExp {
  const origin = new URL(apiUrl).origin;
  return new RegExp(`^${escapeRegExp(origin)}/api/pathologies(?:[/?]|$)`);
}

export function buildPwaOptions(apiUrl: string | undefined): Partial<VitePWAOptions> {
  return {
    // Mise à jour automatique : le nouveau service worker prend la main sans action de l'utilisateur
    registerType: 'autoUpdate',
    // L'enregistrement est fait explicitement dans src/main.tsx
    injectRegister: false,
    includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'logo.svg'],
    manifest: {
      id: '/',
      name: 'TIBELE',
      short_name: 'TIBELE',
      description:
        'Support pédagogique pour étudiants en médecine, infirmiers et médecins : fiches pathologies, forum et auto-évaluation.',
      lang: 'fr',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      theme_color: THEME_COLOR,
      background_color: '#ffffff',
      categories: ['education', 'medical'],
      icons: [
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        {
          src: 'maskable-icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      skipWaiting: true,
      // Application monopage : toute navigation hors ligne retombe sur index.html
      navigateFallback: '/index.html',
      navigateFallbackDenylist: [/^\/api\//],
      runtimeCaching: [
        ...(apiUrl
          ? [
              {
                urlPattern: pathologiesApiPattern(apiUrl),
                handler: 'StaleWhileRevalidate' as const,
                options: {
                  cacheName: 'tibele-pathologies',
                  expiration: { maxEntries: 150, maxAgeSeconds: 7 * 24 * 60 * 60 },
                  cacheableResponse: { statuses: [200] },
                },
              },
            ]
          : []),
        {
          // Images des fiches (souvent hébergées sur un CDN) : cache-first, quota borné
          urlPattern: ({ request }: { request: Request }) => request.destination === 'image',
          handler: 'CacheFirst' as const,
          options: {
            cacheName: 'tibele-images',
            expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
      ],
    },
    // Service worker désactivé en développement (évite les caches fantômes pendant le dev)
    devOptions: { enabled: false },
  };
}
