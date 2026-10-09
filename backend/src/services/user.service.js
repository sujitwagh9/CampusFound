import { User } from '../models/user.model.js';
import { Item } from '../models/item.model.js';
import { ClaimRequest } from '../models/claimRequest.model.js';
import { destroyImages } from '../middlewares/upload.middleware.js';

/**
 * Deletes a user together with everything that belongs to them, so no
 * orphaned items or claims are left behind. Returns null if not found.
 */
export const deleteUserService = async (userId) => {
  const user = await User.findByIdAndDelete(userId);
  if (!user) return null;

  const items = await Item.find({ reportedBy: userId }, '_id images');
  const itemIds = items.map((i) => i._id);

  // Items this user had a pending claim on go back to being claimable
  const pendingClaims = await ClaimRequest.find({ claimant: userId, status: 'pending' }, 'item');
  await Item.updateMany(
    { _id: { $in: pendingClaims.map((c) => c.item) }, status: 'under_review', claimedBy: userId },
    { status: 'pending', claimedBy: null }
  );

  await Promise.all([
    Item.deleteMany({ _id: { $in: itemIds } }),
    ClaimRequest.deleteMany({ $or: [{ claimant: userId }, { item: { $in: itemIds } }] }),
  ]);
  await destroyImages(items.flatMap((i) => i.images));

  return user;
};
