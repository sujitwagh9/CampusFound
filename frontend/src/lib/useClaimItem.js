import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext.jsx';
import { claimItemRequest } from '../api/itemApi.js';
import { errorMessage } from '../api/client.js';
import { promptText } from './dialogs.js';

/**
 * Returns a function that walks the user through claiming an item:
 * sign in if needed, describe proof of ownership, submit.
 * Resolves to true when a claim was submitted.
 */
export default function useClaimItem() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return async (item) => {
    if (!user) {
      toast.info('Please sign in to claim this item');
      navigate('/login', { state: { from: location } });
      return false;
    }

    const message = await promptText({
      title: `Claim "${item.title}"`,
      text: 'To prove it is yours, describe something only the owner would know: identifying marks, contents, serial number, lock screen, etc. An admin will review your claim.',
      placeholder: 'e.g. There is a scratch on the back and my initials "SW" inside the cover…',
      confirmText: 'Send claim',
      minLength: 10,
    });
    if (message === null) return false;

    try {
      const res = await claimItemRequest(item._id, message);
      toast.success(res.message || 'Claim request sent');
      return true;
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to send claim request'));
      return false;
    }
  };
}
