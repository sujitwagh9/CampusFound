import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext.jsx';
import { googleLoginAPI } from '../api/userApi.js';
import { errorMessage } from '../api/client.js';

/**
 * Finishes "Continue with Google" on the login and signup pages: exchanges
 * Google's credential for a CampusFound session and redirects.
 */
export default function useGoogleLogin({ redirectTo, setError, setSubmitting }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  return async (credential) => {
    setError('');
    setSubmitting(true);
    try {
      const data = await googleLoginAPI(credential);
      login(data);
      if (data.linked) {
        toast.info('Your account is now linked to Google', {
          description: 'For security, your old password was cleared. You can set a new one in your profile.',
          duration: 8000,
        });
      } else if (data.created) {
        toast.success(`Welcome to CampusFound, ${data.user.username}!`);
      }
      navigate(redirectTo || (data.user.role === 'admin' ? '/admin/claim-requests' : '/explore'), { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Google sign-in failed. Please try again.'));
      setSubmitting(false);
    }
  };
}
