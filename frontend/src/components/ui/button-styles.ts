/** Styles de bouton partagés (pour <Button> et pour les <Link> qui ressemblent à un bouton). */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary-800 text-white hover:bg-primary-900',
  secondary: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
  ghost: 'text-primary-800 hover:bg-primary-50',
};

export function buttonClasses(variant: ButtonVariant = 'primary', extra = ''): string {
  return `${base} ${variants[variant]} ${extra}`.trim();
}
