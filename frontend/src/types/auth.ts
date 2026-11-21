/** Rôles applicatifs (valeurs de `app_metadata.role` côté Supabase). */
export type AppRole = 'user' | 'admin';

/** Utilisateur courant, tel qu'exposé à l'interface. */
export interface CurrentUser {
  id: string;
  email: string;
  /** Nom complet saisi à l'inscription (facultatif). */
  fullName: string | null;
  /**
   * Rôle lu dans `app_metadata` (non modifiable par l'utilisateur).
   * ⚠️ Sert uniquement à ADAPTER L'INTERFACE : la vraie protection des routes
   * d'administration est faite par le backend.
   */
  role: AppRole;
  createdAt: string;
}

export type AuthActionResult = { ok: true } | { ok: false; message: string };

export type SignUpResult =
  { ok: true; needsEmailConfirmation: boolean } | { ok: false; message: string };
