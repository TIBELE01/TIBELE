import type { AppRole } from '../constants/roles.js';

/** Utilisateur authentifié, injecté dans la requête par le middleware `authenticate`. */
export interface AuthUser {
  /** Identifiant Supabase (= profiles.id). */
  id: string;
  email: string | null;
  /** Rôle lu dans `app_metadata` (non modifiable par l'utilisateur). */
  role: AppRole;
}

declare global {
  namespace Express {
    interface Request {
      /** Défini uniquement après passage par `authenticate`. */
      user?: AuthUser;
    }
  }
}
