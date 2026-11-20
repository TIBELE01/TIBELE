/**
 * Composant racine : fournisseurs globaux (cache de données, routeur).
 * Les fournisseurs à venir (authentification, etc.) s'ajoutent ici.
 */
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { queryClient } from '@/lib/queryClient';
import { router } from '@/router';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
