import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['Lost', 'Found','lost', 'found'],
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    category: {
        type: String,
        enum: ['College-Id', 'Electronics', 'Accessorires', 'Documents', 'Clothing', 'Books', 'Other'],
        default: 'Other',
    },
    location: {
        type: String,
        required: true,
        trim: true,
    },
    images: [{
        url: { type: String, required: true },
        public_id: { type: String, required: true },
    }],
    status: {
        type: String,
        enum: ['pending', 'claimed', 'resolved','under_review','rejected'],
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


export const Item = mongoose.model('Item', itemSchema);

