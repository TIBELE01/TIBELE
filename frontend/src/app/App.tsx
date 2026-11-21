/**
 * Composant racine : fournisseurs globaux (cache de données, session, routeur).
 * L'ordre compte : la session est disponible dans toutes les routes.
 */
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthProvider';
import { queryClient } from '@/lib/queryClient';
import { router } from '@/router';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
