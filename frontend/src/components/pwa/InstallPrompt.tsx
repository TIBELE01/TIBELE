import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { Button } from '@/components/ui/Button';

/**
 * Bouton discret « Installer TIBELE ».
 * N'apparaît que si le navigateur juge l'application installable, et disparaît
 * une fois qu'elle est installée.
 */
export function InstallPrompt({ className = '' }: { className?: string }) {
  const { canInstall, install } = useInstallPrompt();
  if (!canInstall) return null;

  return (
    <Button
      variant="secondary"
      className={`min-h-9 px-3 ${className}`}
      onClick={() => void install()}
    >
      <svg
        className="size-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Installer TIBELE
    </Button>
  );
}
