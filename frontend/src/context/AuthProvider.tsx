/**
 * Contexte d'authentification : source unique de l'état de session.
 *
 * - La session est portée par le SDK Supabase (stockage local, rafraîchissement
 *   automatique des jetons). Ce contexte en expose une vue simple à l'interface.
 * - L'événement `INITIAL_SESSION` du SDK donne la session initiale sans appel
 *   réseau : l'application reste utilisable hors ligne.
 * - Le rôle est relu depuis le serveur (`getUser`) en arrière-plan : une
 *   promotion en administrateur est donc visible sans attendre l'expiration du jeton.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { queryClient } from '@/lib/queryClient';
import { mapAuthError } from '@/lib/auth-errors';
import { toCurrentUser } from '@/lib/auth-user';
import { supabase } from '@/lib/supabase';
import type { AuthActionResult, CurrentUser, SignUpResult } from '@/types/auth';
import { AuthContext, type AuthContextValue } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Suivi de la session : connexion, déconnexion, rafraîchissement du jeton, autre onglet…
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ? toCurrentUser(session.user) : null);
      setIsLoading(false);
      // Déconnexion : on ne garde aucune donnée personnelle en cache mémoire.
      if (event === 'SIGNED_OUT') queryClient.clear();
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Revalidation serveur (rôle à jour, compte supprimé…). Sans effet hors ligne.
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    let active = true;
    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (data.user) {
        setUser(toCurrentUser(data.user));
      } else if (error && (error.status === 401 || error.status === 403)) {
        // Jeton révoqué ou compte supprimé : on ferme la session locale.
        void supabase.auth.signOut({ scope: 'local' });
      }
    });
    return () => {
      active = false;
    };
  }, [userId]);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthActionResult> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return { ok: false, message: mapAuthError(error) };
    if (data.session?.user) setUser(toCurrentUser(data.session.user));
    return { ok: true };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName?: string): Promise<SignUpResult> => {
      const name = fullName?.trim();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          // Lu par le trigger SQL qui crée le profil
          ...(name ? { data: { full_name: name } } : {}),
          emailRedirectTo: `${window.location.origin}/connexion`,
        },
      });
      if (error) return { ok: false, message: mapAuthError(error) };

      // Supabase répond « succès » sans erreur pour un email déjà inscrit (anti-énumération),
      // mais renvoie alors un utilisateur sans aucune identité.
      if (data.user && data.user.identities?.length === 0) {
        return { ok: false, message: mapAuthError({ code: 'user_already_exists' }) };
      }
      if (data.session?.user) setUser(toCurrentUser(data.session.user));
      return { ok: true, needsEmailConfirmation: !data.session };
    },
    [],
  );

  const signOut = useCallback(async () => {
    // Déconnexion de cet appareil uniquement
    await supabase.auth.signOut({ scope: 'local' });
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      isAdmin: user?.role === 'admin',
      signIn,
      signUp,
      signOut,
    }),
    [user, isLoading, signIn, signUp, signOut],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
