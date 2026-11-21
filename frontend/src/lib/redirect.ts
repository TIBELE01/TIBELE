import { ROUTES } from '@/constants/routes';

/**
 * Destination après connexion : la page demandée avant la redirection vers
 * /connexion (transmise dans `location.state.from`), sinon l'accueil.
 * Seuls les chemins internes sont acceptés (jamais d'URL externe).
 */
export function getRedirectTarget(state: unknown): string {
  const from = (state as { from?: { pathname?: unknown; search?: unknown } } | null)?.from;
  const pathname = typeof from?.pathname === 'string' ? from.pathname : '';
  const search = typeof from?.search === 'string' ? from.search : '';

  const isInternal = pathname.startsWith('/') && !pathname.startsWith('//');
  const isAuthPage = pathname === ROUTES.login || pathname === ROUTES.register;
  return isInternal && !isAuthPage ? `${pathname}${search}` : ROUTES.home;
}
