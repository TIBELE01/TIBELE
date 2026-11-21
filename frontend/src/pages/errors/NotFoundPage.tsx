import { Link } from 'react-router-dom';
import { buttonClasses } from '@/components/ui/button-styles';
import { ROUTES } from '@/constants/routes';
import { usePageTitle } from '@/hooks/usePageTitle';

export function NotFoundPage() {
  usePageTitle('Page introuvable');
  return (
    <section className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-bold text-primary-800">Page introuvable</h1>
      <p className="mt-2 text-slate-600">Cette page n’existe pas ou a été déplacée.</p>
      <Link to={ROUTES.home} className={buttonClasses('primary', 'mt-6')}>
        Retour à l’accueil
      </Link>
    </section>
  );
}
