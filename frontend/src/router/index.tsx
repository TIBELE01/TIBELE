/**
 * Déclaration des routes.
 *
 * Toutes les pages partagent `AppLayout` (barre de navigation, pied de page).
 * Trois niveaux d'accès : publiques, connectés (`ProtectedRoute`), administrateurs
 * (`AdminRoute`). `*` doit rester en dernier. Les pages « bientôt disponible »
 * sont remplacées au fil du développement.
 */
import { createBrowserRouter } from 'react-router-dom';
import { AdminRoute, ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { ROUTES } from '@/constants/routes';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ComingSoonPage } from '@/pages/common/ComingSoonPage';
import { NotFoundPage } from '@/pages/errors/NotFoundPage';
import { HomePage } from '@/pages/home/HomePage';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      // Publiques
      { path: ROUTES.home, element: <HomePage /> },
      { path: ROUTES.forum, element: <ComingSoonPage title="Forum" /> },
      { path: ROUTES.login, element: <LoginPage /> },
      { path: ROUTES.register, element: <RegisterPage /> },

      // Utilisateurs connectés
      {
        element: <ProtectedRoute />,
        children: [
          { path: ROUTES.history, element: <ComingSoonPage title="Historique" /> },
          { path: ROUTES.profile, element: <ComingSoonPage title="Profil" /> },
        ],
      },

      // Administrateurs
      {
        element: <AdminRoute />,
        children: [{ path: ROUTES.admin, element: <ComingSoonPage title="Administration" /> }],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
