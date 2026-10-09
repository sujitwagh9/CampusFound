import mongoose from "mongoose";

export const ITEM_TYPES = ['lost', 'found'];
export const ITEM_CATEGORIES = ['College-Id', 'Electronics', 'Accessories', 'Documents', 'Clothing', 'Books', 'Keys', 'Bags', 'Other'];
export const ITEM_STATUSES = ['pending', 'under_review', 'claimed', 'resolved'];

const itemSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        // 'Lost'/'Found' kept so documents created before types were normalised still validate
        enum: [...ITEM_TYPES, 'Lost', 'Found'],
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000,
    },
    category: {
        type: String,
        // 'Accessorires' kept so documents created with the old misspelling still validate
        enum: [...ITEM_CATEGORIES, 'Accessorires'],
        default: 'Other',
    },
    location: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120,
    },
    images: [{
        url: { type: String, required: true },
        public_id: { type: String, required: true }
    }],
    status: {
        type: String,
        // 'rejected' kept for legacy documents; it is no longer assigned
        enum: [...ITEM_STATUSES, 'rejected'],
        default: 'pending',
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    claimedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    }
}, { timestamps: true });

itemSchema.index({ title: 'text', description: 'text' });
itemSchema.index({ createdAt: -1 });

export const Item = mongoose.model('Item', itemSchema);
