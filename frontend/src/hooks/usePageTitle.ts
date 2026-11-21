import { useEffect } from 'react';

/** Définit le titre de l'onglet : « Titre — TIBELE ». */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} — TIBELE` : 'TIBELE — Support pédagogique en santé';
  }, [title]);
}
