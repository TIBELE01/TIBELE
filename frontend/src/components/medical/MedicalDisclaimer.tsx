/**
 * Avertissement médical réutilisable.
 *
 * TIBELE est un support pédagogique, JAMAIS un outil de conseil médical : ce
 * bandeau doit être affiché de façon visible sur chaque fiche pathologie (et
 * sur les autres pages clés), pas seulement en pied de page.
 *
 *  - `banner`  : version complète (fiches pathologies, accueil) ;
 *  - `compact` : une ligne (pied de page, pages secondaires).
 */
interface MedicalDisclaimerProps {
  variant?: 'banner' | 'compact';
  className?: string;
}

export function MedicalDisclaimer({ variant = 'banner', className = '' }: MedicalDisclaimerProps) {
  if (variant === 'compact') {
    return (
      <p role="note" className={`text-xs text-slate-600 ${className}`}>
        <strong className="font-semibold">Support pédagogique :</strong> TIBELE ne constitue pas un
        conseil médical.
      </p>
    );
  }

  return (
    <aside
      role="note"
      aria-label="Avertissement médical"
      className={`flex gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 ${className}`}
    >
      <svg
        className="mt-0.5 size-5 shrink-0 text-amber-600"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 2 1 21h22L12 2Zm1 14h-2v-2h2v2Zm0-4h-2V9h2v3Z" />
      </svg>
      <p>
        <strong className="font-semibold">Support pédagogique uniquement.</strong> TIBELE est un
        outil éducatif : il ne remplace pas l’avis d’un professionnel de santé et ne constitue en
        aucun cas un conseil médical, un diagnostic ou une prescription.
      </p>
    </aside>
  );
}
