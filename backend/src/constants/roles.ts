/**
 * Rôles applicatifs.
 *
 * Ces valeurs sont celles stockées dans `app_metadata.role` côté Supabase Auth
 * (source de vérité, non modifiable par l'utilisateur). Elles ne sont PAS
 * identiques aux membres de l'enum Prisma `Role` (`USER` / `ADMIN`), qui
 * correspondent à la copie `profiles.role` en base.
 */
export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];
