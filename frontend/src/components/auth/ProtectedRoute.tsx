/**
 * Protection des routes selon l'authentification et le rôle.
 *
 * S'utilise comme « route de mise en page » : les routes enfants ne sont
 * rendues que si la condition est remplie.
 *
 *   { element: <ProtectedRoute />, children: [ …pages réservées aux connectés… ] }
 *   { element: <AdminRoute />,     children: [ …pages d'administration… ] }
 *
 * ⚠️ Ces gardes améliorent l'expérience (pas d'écran inutile) mais NE SONT PAS
 * une protection : le code du navigateur est modifiable. La sécurité réelle est
 * assurée par le backend, qui revérifie le jeton et le rôle sur chaque requête.
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';
import { buttonClasses } from '@/components/ui/button-styles';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';

function CenteredSpinner() {
  return (
    <div className="flex justify-center py-24 text-primary-800">
      <Spinner className="size-8" label="Chargement…" />
    </div>
  );
}

function AccessDenied() {
  return (
    <section className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-primary-800">Accès refusé</h1>
      <p className="mt-2 text-slate-600">Cette page est réservée aux administrateurs de TIBELE.</p>
      <Link to={ROUTES.home} className={buttonClasses('primary', 'mt-6')}>
        Retour à l’accueil
      </Link>
    </section>
  );
}

export function ProtectedRoute({ requireAdmin = false }: { requireAdmin?: boolean }) {
  const { user, isLoading, isAdmin } = useAuth();
  const location = useLocation();

  // On attend la lecture de la session : évite de renvoyer à tort vers la connexion.
  if (isLoading) return <CenteredSpinner />;

  // Non connecté : connexion, puis retour à la page demandée.
  if (!user) return <Navigate to={ROUTES.login} replace state={{ from: location }} />;

  if (requireAdmin && !isAdmin) return <AccessDenied />;

  return <Outlet />;
}

/** Variante réservée au rôle administrateur. */
export function AdminRoute() {
  return <ProtectedRoute requireAdmin />;
}
