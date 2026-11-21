/**
 * Traduit les erreurs de Supabase Auth en messages clairs, en français.
 * On s'appuie d'abord sur `code` (stable), puis sur le message en dernier recours.
 */
interface AuthErrorLike {
  code?: string | undefined;
  message?: string | undefined;
  name?: string | undefined;
  status?: number | undefined;
}

const NETWORK_MESSAGE = 'Connexion impossible. Vérifiez votre connexion internet puis réessayez.';

export function mapAuthError(error: AuthErrorLike): string {
  switch (error.code) {
    case 'invalid_credentials':
      return 'Email ou mot de passe incorrect.';
    case 'email_not_confirmed':
      return 'Votre adresse email n’est pas encore confirmée. Consultez votre boîte de réception.';
    case 'user_already_exists':
    case 'email_exists':
      return 'Un compte existe déjà avec cette adresse email.';
    case 'weak_password':
      return 'Mot de passe trop faible. Utilisez au moins 8 caractères, en mélangeant lettres et chiffres.';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.';
    case 'signup_disabled':
      return 'Les inscriptions sont momentanément fermées.';
    case 'validation_failed':
      return 'Les informations saisies sont invalides.';
  }

  if (error.name === 'AuthRetryableFetchError' || error.status === 0) {
    return NETWORK_MESSAGE;
  }

  // Anciennes versions de l'API : pas de `code`, seulement un message.
  const message = error.message ?? '';
  if (/invalid login credentials/i.test(message)) return 'Email ou mot de passe incorrect.';
  if (/already registered|already exists/i.test(message)) {
    return 'Un compte existe déjà avec cette adresse email.';
  }
  if (/failed to fetch|network/i.test(message)) return NETWORK_MESSAGE;

  return 'Une erreur est survenue. Veuillez réessayer.';
}
