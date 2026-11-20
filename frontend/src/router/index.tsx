/**
 * Déclaration des routes. Les pages (fiches, forum, quiz, admin…) s'ajoutent
 * ici au fil du développement ; `*` doit rester en dernier.
 */
import { createBrowserRouter } from 'react-router-dom';
import { NotFoundPage } from '@/pages/errors/NotFoundPage';
import { HomePage } from '@/pages/home/HomePage';

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '*', element: <NotFoundPage /> },
]);
