import {ClaimRequest} from '../models/claimRequest.model.js';
import {Item }from '../models/item.model.js';
import {User} from '../models/user.model.js';
import { sendEmailNotification } from '../utils/adminMail.util.js';
import { deleteUserService } from '../services/user.service.js';
// Admin: Get all claim requests
export const getAllClaimRequests = async (req, res) => {
  try {
    const claims = await ClaimRequest.find()
  .populate({
    path: 'item',
    populate: { path: 'reportedBy', select: 'username email' }
  })
  .populate('claimant', 'username email');

res.json(claims);

  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch claim requests' });
  }
};

export const handleClaimRequest = async (req, res) => {
  const { claimRequestId } = req.params;
  const { action } = req.body;  // 'approve' or 'reject'

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Invalid action' });
  }

  try {
    const claimRequest = await ClaimRequest.findById(claimRequestId)
      .populate('item')
      .populate('claimant');

    if (!claimRequest) {
      return res.status(404).json({ message: 'Claim request not found' });
    }

    if (claimRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Claim request already processed' });
    }

    claimRequest.status = action === 'approve' ? 'approved' : 'rejected';
    await claimRequest.save();

    const item = await Item.findById(claimRequest.item._id).populate('reportedBy');

    if (action === 'approve') {
      item.status = 'claimed';
      await item.save();

      // Notify Reporter
      await sendEmailNotification(
        item.reportedBy.email,
        'Item Claimed Notification',
        `Your reported item "${item.title}" has been successfully claimed.`
      );

      // Notify Claimant
      await sendEmailNotification(
        claimRequest.claimant.email,
        'Claim Approved',
        `Your claim request for item "${item.title}" has been approved by the admin.`
      );

    } else {
      // Notify Claimant about rejection
      await sendEmailNotification(
        claimRequest.claimant.email,
        'Claim Rejected',
        `Your claim request for item "${item.title}" has been rejected by the admin.`
      );
    }

    res.json({ message: `Claim request ${action}d successfully` });

  } catch (err) {
    console.error('Error handling claim request:', err);
    res.status(500).json({ message: 'Server error handling claim request' });
  }
};


export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'username email role createdAt');
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
}

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;  // from URL /users/:userId

    const deletedUser = await deleteUserService(userId);  // service function to delete
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully', user: deletedUser });
  } catch (error) {
    console.error('Failed to delete user:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
