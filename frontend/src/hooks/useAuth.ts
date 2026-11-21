import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '@/context/auth-context';

/** Accès à l'état d'authentification et aux actions (connexion, inscription, déconnexion). */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l’intérieur de <AuthProvider>');
  }
  return context;
}

/** Utilisateur courant (`null` si déconnecté ou en cours de chargement). */
export function useCurrentUser() {
  return useAuth().user;
}
