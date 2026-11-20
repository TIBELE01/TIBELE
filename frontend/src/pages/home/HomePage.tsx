/** Page d'accueil provisoire : sera remplacée par la liste des pathologies. */
export function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center">
      <img src="/logo.svg" alt="" className="size-20 rounded-2xl" />
      <h1 className="text-3xl font-bold text-primary-800">TIBELE</h1>
      <p className="text-slate-600">
        Support pédagogique pour étudiants en médecine, infirmiers et médecins.
      </p>
      <p
        role="note"
        className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
      >
        TIBELE est un outil éducatif, pas un outil de conseil médical.
      </p>
    </main>
  );
}
