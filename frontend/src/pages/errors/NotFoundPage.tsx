import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold text-primary-800">Page introuvable</h1>
      <p className="text-slate-600">Cette page n'existe pas ou a été déplacée.</p>
      <Link
        to="/"
        className="rounded-lg bg-primary-800 px-5 py-3 font-medium text-white hover:bg-primary-900"
      >
        Retour à l'accueil
      </Link>
    </main>
  );
}
