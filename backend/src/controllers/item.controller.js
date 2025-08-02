import { Item } from '../models/item.model.js';
import { User } from '../models/user.model.js';
import { sendStatusChangeMail } from '../utils/mail.utils.js';
import { sendClaimRequestMail } from '../utils/claimRequestMail.utils.js';
import { ClaimRequest } from '../models/claimRequest.model.js';

export const getAllItem = async (req, res) => {
  try {
    const items = await Item.find().populate('reportedBy', '_id username email');
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching items', error });
  }
};



export const addItem = async (req, res) => {
  const { type, title, description, category, location, status } = req.body;

  try {
    // Prepare images from uploaded files
    const images = req.files.map(file => ({
      url: file.path,
      public_id: file.filename
    }));

    const newItem = new Item({
      type,
      title,
      description,
      category,
      location,
      images,
      status,
      reportedBy: req.user.id
    });

    await newItem.save();
    res.status(201).json({ message: 'Item added successfully', item: newItem });
  } catch (error) {
    console.error('Error adding item:', error);
    res.status(500).json({ message: 'Error adding item', error });
  }
};


export const getItemById = async (req, res) => {
  const { id } = req.params;

  try {
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching item', error });
  }
};



export const updateItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Only owner or admin can update
    if (item.reportedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this item' });
    }

    const oldStatus = item.status;
    Object.assign(item, req.body);
    await item.save();

    if (req.body.status && req.body.status != oldStatus) {
      const user = await User.findById(item.reportedBy);

      if (user) {
        await sendStatusChangeMail(user.email, item, req.body.status);
      }
    }

    res.json({ message: 'Item updated successfully', item });
  } catch (error) {
    res.status(500).json({ message: 'Error updating item', error });
  }
};


export const claimRequest = async (req, res) => {
  console.log('Claim request hit for item:', req.params.id);
  const itemId = req.params.id;

  if (!itemId) {
    return res.status(400).json({ message: 'Item ID is required' });
  }

  try {
    const item = await Item.findById(itemId).populate('reportedBy');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.reportedBy?._id?.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot claim your own reported item' });
    }

    if (item.type.toLowerCase() !== 'found') {
      return res.status(403).json({ message: 'You can only claim items that are marked as "found".' });
    }

    if (['claimed', 'under_review'].includes(item.status)) {
      return res.status(400).json({ message: 'Item has already been claimed or is under review' });
    }

    // Update item to under review and assign claimer
    item.status = 'under_review';
    item.claimedBy = req.user.id;
    await item.save();

    // Create the claim request record
    const claimRequest = new ClaimRequest({
      item: item._id,
      claimant: req.user.id,
    });
    await claimRequest.save();
    console.log(`ClaimRequest created: ${claimRequest._id}`);

    // ✅ Fetch claimer full details
    const claimer = await User.findById(req.user.id);
    if (!claimer) {
      console.error(`Claimer not found for user id ${req.user.id}`);
    }

    // ✅ Send email to the reporter
    if (item.reportedBy && item.reportedBy.email) {
      console.log(`Sending claim request mail to ${item.reportedBy.email}`);
      await sendClaimRequestMail(item.reportedBy, item, claimer);
    } else {
      console.error(`Reporter details missing or incomplete for item ${itemId}`);
    }

    res.json({ message: 'Claim request sent successfully' });

  } catch (error) {
    console.error('Claim request error:', error);
    res.status(500).json({ message: 'Server error during claim request' });
  }
};


export const deleteItem = async (req, res) => {
  const { id } = req.params;

  try {
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    // Only owner or admin can delete
    if (item.reportedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this item' });
    }
    await Item.findByIdAndDelete(id);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting item',
      error
    });
  }
};


export const getUserItem = async (req, res) => {
  try {
    const items = await Item.find({ reportedBy: req.user.id }).populate('reportedBy', '_id username email');
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user items', error });
  }
}