import { MedicalDisclaimer } from '@/components/medical/MedicalDisclaimer';
import { usePageTitle } from '@/hooks/usePageTitle';

/** Page d'accueil provisoire : sera remplacée par la liste des pathologies. */
export function HomePage() {
  usePageTitle();
  return (
    <section className="space-y-6">
      <MedicalDisclaimer />
      <div className="py-10 text-center">
        <h1 className="text-3xl font-bold text-primary-800">TIBELE</h1>
        <p className="mt-2 text-slate-600">
          Support pédagogique pour étudiants en médecine, infirmiers et médecins.
        </p>
      </div>
    </section>
  );
}
