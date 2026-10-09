import { ClaimRequest } from '../models/claimRequest.model.js';
import { Item } from '../models/item.model.js';
import { User } from '../models/user.model.js';
import { sendClaimDecisionMail, sendItemClaimedMail } from '../utils/mail.utils.js';
import { deleteUserService } from '../services/user.service.js';

const CLAIM_STATUSES = ['pending', 'approved', 'rejected'];

export const getAllClaimRequests = async (req, res) => {
  const { status } = req.query;
  const filter = CLAIM_STATUSES.includes(status) ? { status } : {};

  const claims = await ClaimRequest.find(filter)
    .sort({ createdAt: -1 })
    .populate({
      path: 'item',
      populate: { path: 'reportedBy', select: 'username email' },
    })
    .populate('claimant', 'username email')
    .populate('lostItem', 'title description location category status createdAt');

  res.json(claims);
};

export const getStats = async (req, res) => {
  const [claimsByStatus, itemsByStatus, itemsByType, users] = await Promise.all([
    ClaimRequest.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Item.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Item.aggregate([{ $group: { _id: { $toLower: '$type' }, count: { $sum: 1 } } }]),
    User.countDocuments(),
  ]);

  const toObject = (rows) => Object.fromEntries(rows.map((r) => [r._id, r.count]));
  const items = toObject(itemsByStatus);

  res.json({
    users,
    claims: { pending: 0, approved: 0, rejected: 0, ...toObject(claimsByStatus) },
    items: {
      total: Object.values(items).reduce((a, b) => a + b, 0),
      ...toObject(itemsByType),
      byStatus: items,
      returned: (items.claimed || 0) + (items.resolved || 0),
    },
  });
};

export const handleClaimRequest = async (req, res) => {
  const { claimRequestId } = req.params;
  const { action } = req.body; // validated: 'approve' | 'reject'
  const approved = action === 'approve';

  // Atomic so the same claim can't be processed twice
  const claimRequest = await ClaimRequest.findOneAndUpdate(
    { _id: claimRequestId, status: 'pending' },
    { status: approved ? 'approved' : 'rejected' },
    { new: true }
  ).populate('claimant', 'username email emailActivity');

  if (!claimRequest) {
    const exists = await ClaimRequest.exists({ _id: claimRequestId });
    return exists
      ? res.status(400).json({ message: 'Claim request already processed' })
      : res.status(404).json({ message: 'Claim request not found' });
  }

  const item = await Item.findById(claimRequest.item).populate('reportedBy', 'username email');
  if (item) {
    if (approved) {
      item.status = 'claimed';
      item.claimedBy = claimRequest.claimant?._id || null;
    } else {
      // Rejected: release the item so the real owner can still claim it
      item.status = 'pending';
      item.claimedBy = null;
    }
    await item.save();

    // The owner has their item back, so their own lost report is done too
    let closedLostReport = null;
    if (approved && claimRequest.lostItem) {
      closedLostReport = await Item.findOneAndUpdate(
        { _id: claimRequest.lostItem, reportedBy: claimRequest.claimant?._id, status: { $in: ['pending', 'under_review'] } },
        { status: 'resolved' },
        { new: true }
      );
    }

    if (approved && item.reportedBy) sendItemClaimedMail(item.reportedBy, item);
    if (claimRequest.claimant) sendClaimDecisionMail(claimRequest.claimant, item, approved, closedLostReport);
  }

  res.json({ message: `Claim request ${approved ? 'approved' : 'rejected'} successfully` });
};

export const deleteClaimRequest = async (req, res) => {
  const claim = await ClaimRequest.findByIdAndDelete(req.params.claimRequestId);
  if (!claim) {
    return res.status(404).json({ message: 'Claim request not found' });
  }

  // Deleting a pending claim must not leave the item stuck in review
  if (claim.status === 'pending') {
    await Item.updateOne(
      { _id: claim.item, status: 'under_review', claimedBy: claim.claimant },
      { status: 'pending', claimedBy: null }
    );
  }

  res.json({ message: 'Claim request deleted successfully' });
};

export const getAllUsers = async (req, res) => {
  const users = await User.find({}, 'username email role createdAt').sort({ createdAt: -1 });
  const counts = await Item.aggregate([{ $group: { _id: '$reportedBy', count: { $sum: 1 } } }]);
  const countById = new Map(counts.map((c) => [c._id?.toString(), c.count]));

  res.json(users.map((u) => ({ ...u.toJSON(), itemCount: countById.get(u._id.toString()) || 0 })));
};

export const updateUserRole = async (req, res) => {
  const { userId } = req.params;
  if (userId === req.user.id) {
    return res.status(400).json({ message: 'You cannot change your own role' });
  }

  const user = await User.findByIdAndUpdate(
    userId,
    // Revoke sessions so the new role takes effect on next sign in
    { role: req.body.role, refreshTokens: [] },
    { new: true, projection: 'username email role createdAt' }
  );
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json({ message: `${user.username} is now ${user.role === 'admin' ? 'an admin' : 'a user'}`, user });
};

export const deleteUser = async (req, res) => {
  const { userId } = req.params;
  if (userId === req.user.id) {
    return res.status(400).json({ message: 'You cannot delete your own account' });
  }

  const deletedUser = await deleteUserService(userId);
  if (!deletedUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.status(200).json({ message: 'User deleted successfully' });
};
