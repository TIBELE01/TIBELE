/** Connexion : email + mot de passe via Supabase Auth, puis retour à la page demandée. */
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { AuthCard } from '@/components/auth/AuthCard';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { PasswordField, TextField } from '@/components/ui/TextField';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { getRedirectTarget } from '@/lib/redirect';
import { validateEmail, validateLoginPassword } from '@/lib/validation';

export function LoginPage() {
  usePageTitle('Connexion');
  const { signIn, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Déjà connecté (ou connexion réussie) : retour à la page demandée, sinon l'accueil.
  if (!isLoading && isAuthenticated) {
    return <Navigate to={getRedirectTarget(location.state)} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const next = { email: validateEmail(email), password: validateLoginPassword(password) };
    setErrors(next);
    if (next.email || next.password) {
      document.getElementById(next.email ? 'login-email' : 'login-password')?.focus();
      return;
    }

    setSubmitting(true);
    const result = await signIn(email, password);
    setSubmitting(false);
    if (!result.ok) setFormError(result.message);
    // Succès : le contexte met l'utilisateur à jour, le rendu ci-dessus redirige.
  };

  return (
    <AuthCard
      title="Connexion"
      subtitle="Accédez au forum, aux quiz et à votre historique."
      footer={
        <>
          Pas encore de compte ?{' '}
          <Link
            to={ROUTES.register}
            state={location.state}
            className="font-medium text-primary-800 underline"
          >
            Créer un compte
          </Link>
        </>
      }
    >
      <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-4">
        {formError && <Alert variant="error">{formError}</Alert>}

        <TextField
          id="login-email"
          label="Adresse email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setErrors((current) => ({ ...current, email: null }));
          }}
          error={errors.email}
        />
        <PasswordField
          id="login-password"
          label="Mot de passe"
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setErrors((current) => ({ ...current, password: null }));
          }}
          error={errors.password}
        />

        <Button type="submit" loading={submitting} className="w-full">
          Se connecter
        </Button>
      </form>
    </AuthCard>
  );
}
