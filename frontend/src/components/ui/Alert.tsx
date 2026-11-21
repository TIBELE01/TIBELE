import type { ReactNode } from 'react';

type AlertVariant = 'error' | 'success' | 'info' | 'warning';

const styles: Record<AlertVariant, string> = {
  error: 'border-red-200 bg-red-50 text-red-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  info: 'border-primary-200 bg-primary-50 text-primary-900',
  warning: 'border-amber-300 bg-amber-50 text-amber-900',
};

/** Message d'information ; les erreurs sont annoncées immédiatement aux lecteurs d'écran. */
export function Alert({
  variant = 'info',
  children,
  className = '',
}: {
  variant?: AlertVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`rounded-lg border px-4 py-3 text-sm ${styles[variant]} ${className}`}
    >
      {children}
    </div>
  );
}
