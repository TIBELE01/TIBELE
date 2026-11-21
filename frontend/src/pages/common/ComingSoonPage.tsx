import { usePageTitle } from '@/hooks/usePageTitle';

/** Page provisoire pour les écrans pas encore développés. */
export function ComingSoonPage({ title }: { title: string }) {
  usePageTitle(title);
  return (
    <section className="py-12 text-center">
      <h1 className="text-2xl font-bold text-primary-800">{title}</h1>
      <p className="mt-2 text-slate-600">Cette page sera disponible prochainement.</p>
    </section>
  );
}
