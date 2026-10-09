import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        // Email confirmations of the user's own actions (security emails are always sent)
        emailActivity: {
            type: Boolean,
            default: true
        },
        role: {
            type: String,
            enum: ['admin', 'user'],
            default: 'user'
        },
        password: {
            type: String,
            required: true,
            select: false
        },
        // SHA-256 hashes of the currently valid refresh tokens
        refreshTokens: {
            type: [String],
            default: [],
            select: false
        },
        // SHA-256 hash of the password reset token
        resetToken: {
            type: String,
            default: null,
            select: false
        },
        resetTokenExpiry: {
            type: Date,
            default: null,
            select: false
        }
    },
    {
        timestamps: true
    }
);

userSchema.virtual('items', {
    ref: 'Item',
    localField: '_id',
    foreignField: 'reportedBy'
});
userSchema.set('toObject', { virtuals: true });
userSchema.set('toJSON', { virtuals: true });


export const User = mongoose.model('User', userSchema);
