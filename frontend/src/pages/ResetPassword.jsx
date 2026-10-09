import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { resetPasswordAPI } from '../api/userApi.js';
import { errorMessage } from '../api/client.js';
import { passwordIssues } from '../lib/styles.js';
import AuthCard from '../components/AuthCard.jsx';
import FormField, { PasswordInput, PasswordStrength, SubmitButton } from '../components/FormField.jsx';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const issues = passwordIssues(password);
    const found = {};
    if (issues.length) found.password = `Password needs ${issues.join(', ')}`;
    if (password !== confirm) found.confirm = 'Passwords do not match';
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const res = await resetPasswordAPI(token, password);
      toast.success(res.message);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Error resetting password'));
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Reset password"
      subtitle="Choose a new password for your account."
      error={error}
      footer={
        <Link to="/forgot-password" className="font-medium text-accent-text hover:underline underline-offset-4">
          Request a new reset link
        </Link>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField label="New password" error={errors.password}>
          {(props) => (
            <>
              <PasswordInput {...props} autoComplete="new-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
              {!errors.password && <PasswordStrength password={password} />}
            </>
          )}
        </FormField>
        <FormField label="Confirm new password" error={errors.confirm}>
          {(props) => <PasswordInput {...props} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />}
        </FormField>
        <SubmitButton loading={submitting} loadingText="Saving…">
          Reset password
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
