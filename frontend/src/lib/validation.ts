/** Validations des formulaires d'authentification (messages en français). */
export const PASSWORD_MIN_LENGTH = 8;

// Volontairement simple : la validité réelle est vérifiée par Supabase.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): string | null {
  const email = value.trim();
  if (!email) return 'Saisissez votre adresse email.';
  if (!EMAIL_PATTERN.test(email)) return 'Cette adresse email semble invalide.';
  return null;
}

/** Connexion : on exige seulement un mot de passe non vide (la règle de longueur est à l'inscription). */
export function validateLoginPassword(value: string): string | null {
  return value ? null : 'Saisissez votre mot de passe.';
}

export function validateNewPassword(value: string): string | null {
  if (!value) return 'Choisissez un mot de passe.';
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`;
  }
  return null;
}

export function validateFullName(value: string): string | null {
  return value.trim().length > 120 ? 'Le nom est trop long (120 caractères maximum).' : null;
}
