import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordAPI } from '../api/userApi.js';
import { errorMessage } from '../api/client.js';
import AuthCard from '../components/AuthCard.jsx';
import FormField, { SubmitButton } from '../components/FormField.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSubmitting(true);
    try {
      const res = await forgotPasswordAPI(email);
      setMessage(res.message);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Forgot password"
      subtitle="Enter your email and we’ll send you a link to reset your password."
      error={error}
      success={message}
      footer={
        <Link to="/login" className="font-medium text-accent-text hover:underline underline-offset-4">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Email address">
          {(props) => (
            <input {...props} type="email" autoComplete="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
          )}
        </FormField>
        <SubmitButton loading={submitting} loadingText="Sending…">
          Send reset link
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
