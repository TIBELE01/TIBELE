/**
 * Dons : popup flottant non intrusif + bouton cœur permanent.
 *
 *  - Le popup n'est JAMAIS modal : pas de fond grisé, pas de capture du focus,
 *    la navigation reste libre. Règles d'affichage : voir lib/donation.ts.
 *  - Le bouton cœur, discret en bas à droite, mène à tout moment au lien de don.
 *  - Sans lien de don configuré (VITE_DONATION_URL), rien n'est affiché.
 */
import { env } from '@/lib/env';
import { useDonationPrompt } from '@/hooks/useDonationPrompt';

const DONATION_URL = env.donationUrl;

function Heart({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="m12 21-1.5-1.4C5.4 15.4 2 12.3 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.5c0 3.8-3.4 6.9-8.5 11.1L12 21Z" />
    </svg>
  );
}

export function DonationWidget() {
  const { visible, dismiss } = useDonationPrompt(DONATION_URL !== null);
  if (!DONATION_URL) return null;

  return (
    <>
      {visible && (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby="donation-title"
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-4 right-4 z-40 rounded-xl border border-slate-200 bg-white p-4 shadow-lg sm:left-auto sm:w-80"
        >
          <button
            type="button"
            onClick={dismiss}
            aria-label="Fermer"
            className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
          >
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
          <h2
            id="donation-title"
            className="flex items-center gap-2 pr-8 font-semibold text-primary-800"
          >
            <Heart className="size-4 text-rose-500" />
            Soutenez TIBELE
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            TIBELE est entièrement gratuit. Si le projet vous est utile, un don, même modeste, nous
            aide à continuer.
          </p>
          <div className="mt-3 flex gap-2">
            <a
              href={DONATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={dismiss}
              className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg bg-primary-800 px-4 text-sm font-medium text-white hover:bg-primary-900"
            >
              Faire un don
            </a>
            <button
              type="button"
              onClick={dismiss}
              className="min-h-10 rounded-lg px-3 text-sm text-slate-600 hover:bg-slate-100"
            >
              Plus tard
            </button>
          </div>
        </section>
      )}

      <a
        href={DONATION_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Soutenir TIBELE par un don"
        title="Soutenir TIBELE"
        className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-40 flex size-12 items-center justify-center rounded-full border border-slate-200 bg-white text-rose-500 shadow-md transition-colors hover:bg-rose-50"
      >
        <Heart className="size-5" />
      </a>
    </>
  );
}
