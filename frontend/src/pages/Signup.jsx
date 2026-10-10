import { useState } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { signupAPI } from '../api/userApi.js';
import { errorMessage, fieldErrors } from '../api/client.js';
import useMeta from '../lib/useMeta.js';
import { passwordIssues } from '../lib/styles.js';
import AuthCard from '../components/AuthCard.jsx';
import GoogleSignIn from '../components/GoogleSignIn.jsx';
import useGoogleLogin from '../lib/useGoogleLogin.js';
import FormField, { PasswordInput, PasswordStrength, SubmitButton } from '../components/FormField.jsx';

export default function Signup() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const meta = useMeta();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from;
  const redirectTo = from ? `${from.pathname}${from.search || ''}` : '/explore';
  const domains = meta?.allowedEmailDomains || [];

  // Hooks must run before the early return below
  const handleGoogle = useGoogleLogin({ redirectTo, setError, setSubmitting });

  if (user && !submitting) {
    return <Navigate to={redirectTo} replace />;
  }

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const found = {};
    if (!/^[A-Za-z0-9_.-]{3,30}$/.test(form.username)) {
      found.username = '3–30 characters: letters, numbers, ".", "_" or "-"';
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) found.email = 'Enter a valid email address';
    else if (domains.length && !domains.includes(form.email.split('@')[1].toLowerCase())) {
      found.email = `Use your campus email (${domains.map((d) => '@' + d).join(', ')})`;
    }
    const issues = passwordIssues(form.password);
    if (issues.length) found.password = `Password needs ${issues.join(', ')}`;
    return found;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const data = await signupAPI(form);
      login(data);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errorMessage(err, 'Signup failed. Please try again.'));
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      eyebrow="Create your account"
      title="Sign up"
      error={error}
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" state={location.state} className="font-semibold text-accent-text hover:underline underline-offset-4">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSignup} noValidate className="space-y-4">
        <FormField label="Username" required error={errors.username}>
          {(props) => <input {...props} type="text" autoComplete="username" autoFocus value={form.username} onChange={set('username')} />}
        </FormField>

        <FormField
          label="Email address"
          required
          error={errors.email}
          hint={domains.length ? `Use your campus email (${domains.map((d) => '@' + d).join(', ')})` : undefined}
        >
          {(props) => <input {...props} type="email" autoComplete="email" value={form.email} onChange={set('email')} />}
        </FormField>

        <FormField label="Password" required error={errors.password}>
          {(props) => (
            <>
              <PasswordInput {...props} autoComplete="new-password" value={form.password} onChange={set('password')} />
              {!errors.password && <PasswordStrength password={form.password} />}
            </>
          )}
        </FormField>

        <SubmitButton loading={submitting} loadingText="Creating account…">
          Create account
        </SubmitButton>
      </form>

      <GoogleSignIn onCredential={handleGoogle} disabled={submitting} text={'signup_with'} />
    </AuthCard>
  );
}
