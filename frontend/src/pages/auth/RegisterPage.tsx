/** Inscription : nom complet (facultatif), email et mot de passe via Supabase Auth. */
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { AuthCard } from '@/components/auth/AuthCard';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/button-styles';
import { PasswordField, TextField } from '@/components/ui/TextField';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { getRedirectTarget } from '@/lib/redirect';
import {
  PASSWORD_MIN_LENGTH,
  validateEmail,
  validateFullName,
  validateNewPassword,
} from '@/lib/validation';

type FieldErrors = { fullName?: string | null; email?: string | null; password?: string | null };

export function RegisterPage() {
  usePageTitle('Inscription');
  const { signUp, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Renseigné quand le compte est créé mais que l'email doit d'abord être confirmé.
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);

  // Inscription réussie avec session ouverte : retour à la page demandée, sinon l'accueil.
  if (!isLoading && isAuthenticated) {
    return <Navigate to={getRedirectTarget(location.state)} replace />;
  }

  if (confirmationEmail) {
    return (
      <AuthCard title="Vérifiez votre email">
        <Alert variant="success">
          Votre compte a été créé. Un message de confirmation vient d’être envoyé à{' '}
          <strong>{confirmationEmail}</strong>. Cliquez sur le lien qu’il contient, puis
          connectez-vous.
        </Alert>
        <Link to={ROUTES.login} className={buttonClasses('primary', 'mt-6 w-full')}>
          Aller à la connexion
        </Link>
      </AuthCard>
    );
  }

  const clear = (field: keyof FieldErrors) =>
    setErrors((current) => ({ ...current, [field]: null }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const next: FieldErrors = {
      fullName: validateFullName(fullName),
      email: validateEmail(email),
      password: validateNewPassword(password),
    };
    setErrors(next);
    const firstInvalid = next.fullName
      ? 'register-name'
      : next.email
        ? 'register-email'
        : next.password
          ? 'register-password'
          : null;
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setSubmitting(true);
    const result = await signUp(email, password, fullName);
    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.message);
    } else if (result.needsEmailConfirmation) {
      setConfirmationEmail(email.trim());
    }
    // Sinon : session ouverte, le rendu ci-dessus redirige.
  };

  return (
    <AuthCard
      title="Créer un compte"
      subtitle="Gratuit, sans abonnement. Accédez au forum, aux quiz et à votre historique."
      footer={
        <>
          Déjà inscrit ?{' '}
          <Link
            to={ROUTES.login}
            state={location.state}
            className="font-medium text-primary-800 underline"
          >
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-4">
        {formError && <Alert variant="error">{formError}</Alert>}

        <TextField
          id="register-name"
          label="Nom complet (facultatif)"
          autoComplete="name"
          value={fullName}
          onChange={(event) => {
            setFullName(event.target.value);
            clear('fullName');
          }}
          error={errors.fullName}
        />
        <TextField
          id="register-email"
          label="Adresse email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            clear('email');
          }}
          error={errors.email}
        />
        <PasswordField
          id="register-password"
          label="Mot de passe"
          autoComplete="new-password"
          hint={`Au moins ${PASSWORD_MIN_LENGTH} caractères.`}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            clear('password');
          }}
          error={errors.password}
        />

        <Button type="submit" loading={submitting} className="w-full">
          Créer mon compte
        </Button>
        <p className="text-xs text-slate-500">
          TIBELE est un support pédagogique et ne fournit aucun conseil médical.
        </p>
      </form>
    </AuthCard>
  );
}
