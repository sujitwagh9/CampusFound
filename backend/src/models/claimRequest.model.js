import mongoose from 'mongoose';

const claimRequestSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  claimant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Proof of ownership written by the claimant (identifying marks, contents, etc.)
  message: { type: String, trim: true, maxlength: 1000, default: '' },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
});

export const ClaimRequest = mongoose.model('ClaimRequest', claimRequestSchema);
