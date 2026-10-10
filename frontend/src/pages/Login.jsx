import { useState } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { loginAPI } from '../api/userApi.js';
import { errorMessage } from '../api/client.js';
import AuthCard from '../components/AuthCard.jsx';
import GoogleSignIn from '../components/GoogleSignIn.jsx';
import useGoogleLogin from '../lib/useGoogleLogin.js';
import FormField, { PasswordInput, SubmitButton } from '../components/FormField.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Shown once, e.g. after the session expired
  const [error, setError] = useState(() => {
    const message = sessionStorage.getItem('authMessage');
    sessionStorage.removeItem('authMessage');
    return message || '';
  });

  const from = location.state?.from;
  const redirectTo = from ? `${from.pathname}${from.search || ''}` : null;

  // Hooks must run before the early return below
  const handleGoogle = useGoogleLogin({ redirectTo, setError, setSubmitting });

  if (user && !submitting) {
    return <Navigate to={redirectTo || '/explore'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await loginAPI({ email, password });
      login(data);
      navigate(redirectTo || (data.user.role === 'admin' ? '/admin/claim-requests' : '/explore'), { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Unable to sign in. Please try again.'));
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      eyebrow="Welcome back"
      title="Sign in"
      subtitle={from ? 'Please sign in to continue.' : undefined}
      error={error}
      footer={
        <>
          Don’t have an account?{' '}
          <Link to="/signup" state={location.state} className="font-semibold text-accent-text hover:underline underline-offset-4">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Email address">
          {(props) => (
            <input {...props} type="email" autoComplete="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
          )}
        </FormField>

        <FormField label="Password">
          {(props) => (
            <PasswordInput {...props} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          )}
        </FormField>

        <div className="flex justify-end text-sm">
          <Link to="/forgot-password" className="font-medium text-accent-text hover:underline underline-offset-4">
            Forgot password?
          </Link>
        </div>

        <SubmitButton loading={submitting} loadingText="Signing in…">
          Sign in
        </SubmitButton>
      </form>

      <GoogleSignIn onCredential={handleGoogle} disabled={submitting} text={'signin_with'} />
    </AuthCard>
  );
}
