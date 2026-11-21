/**
 * Barre de navigation, présente sur toutes les pages.
 * Mobile : logo + bouton hamburger qui déplie un menu ; à partir de `md` :
 * liens en ligne. Les liens dépendent de l'état de connexion et du rôle.
 */
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { Button } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/button-styles';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

export function Navbar() {
  const { user, isAuthenticated, isAdmin, isLoading, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const items: NavItem[] = [
    { to: ROUTES.home, label: 'Accueil', end: true },
    { to: ROUTES.forum, label: 'Forum' },
    ...(isAuthenticated
      ? [
          { to: ROUTES.history, label: 'Historique' },
          { to: ROUTES.profile, label: 'Profil' },
        ]
      : []),
    ...(isAdmin ? [{ to: ROUTES.admin, label: 'Administration' }] : []),
  ];

  const close = () => setOpen(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors ${
      isActive ? 'bg-primary-50 text-primary-800' : 'text-slate-700 hover:bg-slate-100'
    }`;

  const handleSignOut = async () => {
    close();
    await signOut();
  };

  const authActions = isLoading ? null : isAuthenticated ? (
    <Button variant="secondary" onClick={() => void handleSignOut()}>
      Déconnexion
    </Button>
  ) : (
    <>
      <Link to={ROUTES.login} onClick={close} className={buttonClasses('ghost')}>
        Connexion
      </Link>
      <Link to={ROUTES.register} onClick={close} className={buttonClasses('primary')}>
        Inscription
      </Link>
    </>
  );

  return (
    <header
      className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur"
      onKeyDown={(event) => {
        if (event.key === 'Escape') close();
      }}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <Link
          to={ROUTES.home}
          onClick={close}
          className="flex items-center gap-2"
          aria-label="TIBELE, accueil"
        >
          <img src="/logo.svg" alt="" className="size-8 rounded-lg" />
          <span className="text-lg font-bold tracking-wide text-primary-800">TIBELE</span>
        </Link>

        {/* Navigation en ligne (écrans larges) */}
        <nav aria-label="Navigation principale" className="hidden items-center gap-1 md:flex">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <InstallPrompt />
          {authActions}
        </div>

        {/* Bouton hamburger (mobile) */}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="menu-mobile"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          className="flex size-11 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 md:hidden"
        >
          <svg
            className="size-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {/* Menu mobile */}
      {open && (
        <div
          id="menu-mobile"
          className="border-t border-slate-200 bg-white px-4 pb-4 pt-2 md:hidden"
        >
          {user && (
            <p className="px-3 py-2 text-xs text-slate-500">
              Connecté :{' '}
              <span className="font-medium text-slate-700">{user.fullName ?? user.email}</span>
            </p>
          )}
          <nav aria-label="Navigation mobile" className="flex flex-col gap-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={linkClass}
                onClick={close}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 [&>*]:w-full">
            <InstallPrompt />
            {authActions}
          </div>
        </div>
      )}
    </header>
  );
}
