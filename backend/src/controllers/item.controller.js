import mongoose from 'mongoose';
import { Item, ITEM_CATEGORIES, ITEM_STATUSES, ITEM_TYPES } from '../models/item.model.js';
import { User } from '../models/user.model.js';
import { ClaimRequest } from '../models/claimRequest.model.js';
import { destroyImages, uploadedImages, MAX_IMAGES } from '../middlewares/upload.middleware.js';
import {
  sendClaimRequestMail, sendClaimSubmittedMail, sendItemDeletedMail, sendItemReportedMail, sendItemStatusByOwnerMail,
  sendItemUpdatedMail, sendPossibleMatchMail, sendStatusChangeMail,
} from '../utils/mail.utils.js';

// Only the public profile of the reporter is exposed — never their email
const REPORTER_FIELDS = '_id username';
const OPEN_STATUSES = ['pending', 'under_review'];
const MAIL_FIELDS = 'username email emailActivity';
const FIELD_LABELS = { title: 'title', description: 'description', category: 'category', location: 'location' };
// MongoDB text score below which a "match" is usually one coincidental word
const MIN_MATCH_SCORE = 1;

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isOwner = (item, user) => item.reportedBy?._id?.toString?.() === user.id || item.reportedBy?.toString?.() === user.id;
const isAdmin = (user) => user?.role === 'admin';

// Images are uploaded before the controller runs, so they must be removed
// again whenever the request is rejected.
const discardUploads = (req) => destroyImages(uploadedImages(req.files));

const typeFilter = (type) => new RegExp(`^${type}$`, 'i'); // matches legacy 'Lost'/'Found'

/**
 * Finds open items of the opposite type that look similar to `item`.
 */
export const findMatches = async (item, limit = 5) => {
  const oppositeType = item.type.toLowerCase() === 'lost' ? 'found' : 'lost';
  const filter = {
    _id: { $ne: item._id },
    type: typeFilter(oppositeType),
    status: { $in: OPEN_STATUSES },
    reportedBy: { $ne: item.reportedBy?._id || item.reportedBy },
    $text: { $search: `${item.title} ${item.description}` },
  };
  // Same category, or "Other" on either side since people categorise differently
  if (item.category && item.category !== 'Other') filter.category = { $in: [item.category, 'Other'] };

  try {
    const candidates = await Item.find(filter, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .populate('reportedBy', REPORTER_FIELDS);
    // Drop matches that share only a single common word (e.g. just "blue")
    return candidates.filter((c) => c.get('score') >= MIN_MATCH_SCORE);
  } catch (err) {
    // e.g. the text index is still being built — matching is best-effort
    console.error('[matches] lookup failed:', err.message);
    return [];
  }
};

export const getAllItem = async (req, res) => {
  const { q, type, category, status = 'all', sort = 'newest' } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);

  const filter = {};
  if (ITEM_TYPES.includes(type)) filter.type = typeFilter(type);
  if (ITEM_CATEGORIES.includes(category)) filter.category = category;
  if (status === 'open') filter.status = { $in: OPEN_STATUSES };
  else if (ITEM_STATUSES.includes(status)) filter.status = status;
  if (typeof q === 'string' && q.trim()) {
    const regex = new RegExp(escapeRegex(q.trim().slice(0, 100)), 'i');
    filter.$or = [{ title: regex }, { description: regex }, { location: regex }];
  }

  const [items, total] = await Promise.all([
    Item.find(filter)
      .sort({ createdAt: sort === 'oldest' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('reportedBy', REPORTER_FIELDS),
    Item.countDocuments(filter),
  ]);

  res.json({ items, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
};

export const getItemById = async (req, res) => {
  const item = await Item.findById(req.params.id).populate('reportedBy', REPORTER_FIELDS);
  if (!item) {
    return res.status(404).json({ message: 'Item not found' });
  }

  // When the viewer is signed in, tell them about their own claim on this item
  let myClaim = null;
  if (req.user) {
    myClaim = await ClaimRequest.findOne({ item: item._id, claimant: req.user.id })
      .sort({ createdAt: -1 })
      .select('status createdAt');
  }

  res.json({ item, myClaim });
};

export const addItem = async (req, res) => {
  // req.body is validated: type, title, description, category, location only
  const item = await Item.create({
    ...req.body,
    images: uploadedImages(req.files),
    status: 'pending',
    reportedBy: req.user.id,
  });

  const matches = await findMatches(item);

  // A newly found item may belong to someone who reported it lost: let them know
  if (item.type === 'found' && matches.length) {
    const owners = await User.find({ _id: { $in: matches.map((m) => m.reportedBy._id) } }, MAIL_FIELDS);
    const ownerById = new Map(owners.map((o) => [o._id.toString(), o]));
    matches.forEach((lost) => {
      const owner = ownerById.get(lost.reportedBy._id.toString());
      if (owner) sendPossibleMatchMail(owner, lost, item);
    });
  }

  const reporter = await User.findById(req.user.id, MAIL_FIELDS);
  sendItemReportedMail(reporter, item, matches.length);

  res.status(201).json({ message: 'Item reported successfully', item, matches });
};

export const updateItem = async (req, res) => {
  const item = await Item.findById(req.params.id).populate('reportedBy', MAIL_FIELDS);
  if (!item) {
    await discardUploads(req);
    return res.status(404).json({ message: 'Item not found' });
  }
  if (!isOwner(item, req.user) && !isAdmin(req.user)) {
    await discardUploads(req);
    return res.status(403).json({ message: 'Not authorized to update this item' });
  }

  const { status, removeImages = [], ...fields } = req.body;
  const newImages = uploadedImages(req.files);

  if (!Object.keys(fields).length && !status && !removeImages.length && !newImages.length) {
    return res.status(400).json({ message: 'Nothing to update' });
  }

  const oldStatus = item.status;
  if (status && status !== oldStatus) {
    // Items in the claim workflow are controlled by the admin's decision
    if (['under_review', 'claimed'].includes(oldStatus)) {
      await discardUploads(req);
      return res.status(400).json({
        message: oldStatus === 'claimed'
          ? 'This item has already been claimed'
          : 'This item has a pending claim; wait for an admin to review it',
      });
    }
    item.status = status;
  }

  // Remember what actually changed, for the confirmation email
  const changed = Object.keys(fields).filter((k) => String(item[k]) !== String(fields[k])).map((k) => FIELD_LABELS[k] || k);
  Object.assign(item, fields);

  const removed = item.images.filter((img) => removeImages.includes(img.public_id));
  const kept = item.images.filter((img) => !removeImages.includes(img.public_id));
  if (kept.length + newImages.length > MAX_IMAGES) {
    await discardUploads(req);
    return res.status(400).json({ message: `An item can have at most ${MAX_IMAGES} images` });
  }
  item.images = [...kept, ...newImages];

  await item.save();
  await destroyImages(removed);

  if (removed.length || newImages.length) changed.push('photos');
  if (item.reportedBy) {
    if (!isOwner(item, req.user)) {
      // An admin edited someone else's report
      if (item.status !== oldStatus) sendStatusChangeMail(item.reportedBy, item, item.status);
    } else if (item.status !== oldStatus) {
      sendItemStatusByOwnerMail(item.reportedBy, item);
    } else if (changed.length) {
      sendItemUpdatedMail(item.reportedBy, item, changed);
    }
  }

  await item.populate('reportedBy', REPORTER_FIELDS);
  res.json({ message: 'Item updated successfully', item });
};

export const claimRequest = async (req, res) => {
  const itemId = req.params.id;
  if (!mongoose.isValidObjectId(itemId)) {
    return res.status(400).json({ message: 'Invalid item id' });
  }

  const existing = await Item.findById(itemId).select('reportedBy type status');
  if (!existing) {
    return res.status(404).json({ message: 'Item not found' });
  }
  if (isOwner(existing, req.user)) {
    return res.status(400).json({ message: 'You cannot claim your own reported item' });
  }
  if (existing.type.toLowerCase() !== 'found') {
    return res.status(400).json({ message: 'Only items marked as "found" can be claimed' });
  }
  if (isAdmin(req.user)) {
    return res.status(400).json({ message: 'Admins cannot claim items' });
  }

  const previous = await ClaimRequest.findOne({ item: itemId, claimant: req.user.id, status: 'rejected' });
  if (previous) {
    return res.status(400).json({
      message: 'Your earlier claim for this item was rejected. Please contact the lost & found desk.',
    });
  }

  // Atomic check-and-set so two people can't claim the same item at once
  const item = await Item.findOneAndUpdate(
    { _id: itemId, status: 'pending' },
    { status: 'under_review', claimedBy: req.user.id },
    { new: true }
  ).populate('reportedBy', 'username email');

  if (!item) {
    return res.status(409).json({ message: 'This item is already under review or has been claimed' });
  }

  const claim = await ClaimRequest.create({
    item: item._id,
    claimant: req.user.id,
    message: req.body.message,
  });

  const claimer = await User.findById(req.user.id, MAIL_FIELDS);
  sendClaimSubmittedMail(claimer, item);
  if (item.reportedBy?.email && claimer) {
    sendClaimRequestMail(item.reportedBy, item, claimer);
  }

  res.status(201).json({ message: 'Claim request sent. An admin will review it shortly.', claim });
};

export const getItemMatches = async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) {
    return res.status(404).json({ message: 'Item not found' });
  }
  if (!isOwner(item, req.user) && !isAdmin(req.user)) {
    return res.status(403).json({ message: 'Not authorized to view matches for this item' });
  }
  res.json(await findMatches(item));
};

export const deleteItem = async (req, res) => {
  const item = await Item.findById(req.params.id).populate('reportedBy', MAIL_FIELDS);
  if (!item) {
    return res.status(404).json({ message: 'Item not found' });
  }
  if (!isOwner(item, req.user) && !isAdmin(req.user)) {
    return res.status(403).json({ message: 'Not authorized to delete this item' });
  }

  await Promise.all([
    Item.deleteOne({ _id: item._id }),
    ClaimRequest.deleteMany({ item: item._id }),
  ]);
  await destroyImages(item.images);
  if (item.reportedBy) sendItemDeletedMail(item.reportedBy, item, !isOwner(item, req.user));

  res.json({ message: 'Item deleted successfully' });
};

export const getUserItem = async (req, res) => {
  const items = await Item.find({ reportedBy: req.user.id })
    .sort({ createdAt: -1 })
    .populate('reportedBy', REPORTER_FIELDS);
  res.json(items);
};

export const getUserClaims = async (req, res) => {
  const claims = await ClaimRequest.find({ claimant: req.user.id })
    .sort({ createdAt: -1 })
    .populate({ path: 'item', populate: { path: 'reportedBy', select: REPORTER_FIELDS } });
  res.json(claims);
};
