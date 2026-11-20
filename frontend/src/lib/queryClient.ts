/** Configuration de TanStack Query (cache des données serveur). */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Données considérées fraîches 1 minute : moins de requêtes sur connexion mobile faible.
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      // Une seule nouvelle tentative : évite d'épuiser le quota de requêtes sur réseau instable.
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
