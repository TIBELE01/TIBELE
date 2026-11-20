/**
 * Génération des icônes PWA à partir de public/logo.svg : `npm run pwa:assets`.
 * Produit dans public/ : favicon.ico, pwa-64x64.png, pwa-192x192.png,
 * pwa-512x512.png, maskable-icon-512x512.png, apple-touch-icon-180x180.png.
 * Pour changer le logo : remplacer public/logo.svg puis relancer la commande.
 */
import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

const BRAND_BLUE = '#0B3D91';

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    // Icône « maskable » et iOS : fond bleu plein (pas de transparence)
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: BRAND_BLUE } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: BRAND_BLUE } },
  },
  images: ['public/logo.svg'],
});
