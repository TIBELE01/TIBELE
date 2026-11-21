import { createContext } from 'react';
import type { AuthActionResult, CurrentUser, SignUpResult } from '@/types/auth';

export interface AuthContextValue {
  /** Utilisateur connecté, ou `null`. */
  user: CurrentUser | null;
  /** `true` tant que la session initiale n'a pas été lue (évite un flash « déconnecté »). */
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Rôle administrateur (interface uniquement : le backend fait foi). */
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signUp: (email: string, password: string, fullName?: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
