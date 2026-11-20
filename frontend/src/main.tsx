/**
 * Point d'entrée de l'application : enregistre le service worker (PWA) puis
 * monte React.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from '@/app/App';
import '@/styles/index.css';

// Mise à jour automatique : un nouveau service worker est activé dès qu'il est prêt.
registerSW({ immediate: true });

const container = document.getElementById('root');
if (!container) {
  throw new Error('Élément #root introuvable dans index.html');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
