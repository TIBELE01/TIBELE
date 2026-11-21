/**
 * Mise en page globale : barre de navigation, contenu de la page (<Outlet />),
 * pied de page, et widgets flottants (dons). Mobile-first.
 */
import { Outlet } from 'react-router-dom';
import { DonationWidget } from '@/components/donation/DonationWidget';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* Lien d'évitement : accès direct au contenu pour la navigation au clavier */}
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-primary-800"
      >
        Aller au contenu
      </a>
      <Navbar />
      <main
        id="contenu"
        tabIndex={-1}
        className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 focus:outline-none"
      >
        <Outlet />
      </main>
      <Footer />
      <DonationWidget />
    </div>
  );
}
