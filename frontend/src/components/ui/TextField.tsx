import { useId, useState, type InputHTMLAttributes } from 'react';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  /** Message d'erreur : rend le champ invalide et est lu par les lecteurs d'écran. */
  error?: string | null | undefined;
  hint?: string | undefined;
  /** Identifiant du champ (utile pour y placer le focus) ; généré par défaut. */
  id?: string;
}

const inputClasses =
  'block w-full min-h-11 rounded-lg border bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:bg-slate-100';

export function TextField({ label, error, hint, id, className = '', ...rest }: TextFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const describedBy = [error ? `${fieldId}-error` : null, hint ? `${fieldId}-hint` : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className}>
      <label htmlFor={fieldId} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`${inputClasses} ${error ? 'border-red-500' : 'border-slate-300'}`}
        {...rest}
      />
      {hint && !error && (
        <p id={`${fieldId}-hint`} className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${fieldId}-error`} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

/** Champ mot de passe avec bouton afficher / masquer (pratique sur mobile). */
export function PasswordField(props: Omit<TextFieldProps, 'type'>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <TextField {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-pressed={visible}
        className="absolute right-2 top-7 min-h-9 rounded px-2 text-xs font-medium text-primary-800 hover:bg-primary-50"
      >
        {visible ? 'Masquer' : 'Afficher'}
      </button>
    </div>
  );
}
