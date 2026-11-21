import type { User } from '@supabase/supabase-js';
import type { CurrentUser } from '@/types/auth';

/**
 * Convertit un utilisateur Supabase en `CurrentUser`.
 *
 * Le rôle vient EXCLUSIVEMENT de `app_metadata` : `user_metadata` est modifiable
 * par l'utilisateur lui-même et ne doit jamais servir à décider d'un droit.
 */
export function toCurrentUser(user: User): CurrentUser {
  const fullName = user.user_metadata?.['full_name'];
  return {
    id: user.id,
    email: user.email ?? '',
    fullName: typeof fullName === 'string' && fullName.trim() ? fullName.trim() : null,
    role: user.app_metadata?.['role'] === 'admin' ? 'admin' : 'user',
    createdAt: user.created_at,
  };
}
