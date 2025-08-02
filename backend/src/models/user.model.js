import moongose from 'mongoose'
import bcrypt from 'bcryptjs';

const userSchema = new moongose.Schema(
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
            trim: true
        },
        role: {
            type: String,
            enum: ['admin', 'user'],
            default: 'user'
        },
        password: {
            type: String,
            required: true
        },
        resetToken: {
            type: String,
            default: null
        },
        resetTokenExpiry:{
            type: Date,
            default: null
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


export const User = moongose.model('User', userSchema);
