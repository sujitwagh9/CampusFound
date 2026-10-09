import bcrypt from 'bcryptjs';
import { User } from '../models/user.model.js';
import { ClaimRequest } from '../models/claimRequest.model.js';
import { issueSession, publicUser } from '../utils/jwt.utils.js';
import { sendPasswordChangedMail, sendSignedOutEverywhereMail, sendUsernameChangedMail } from '../utils/mail.utils.js';

export const getProfile = async (req, res) => {
    const user = await User.findById(req.user.id).populate({ path: 'items', select: 'status type' });
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const claims = await ClaimRequest.countDocuments({ claimant: user._id });
    const items = user.items || [];

    res.json({
        ...publicUser(user),
        stats: {
            reported: items.length,
            lost: items.filter((i) => i.type.toLowerCase() === 'lost').length,
            found: items.filter((i) => i.type.toLowerCase() === 'found').length,
            returned: items.filter((i) => ['claimed', 'resolved'].includes(i.status)).length,
            claims,
        },
    });
};

export const updateProfile = async (req, res) => {
    const { username, emailActivity } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const oldUsername = user.username;
    const renaming = username !== undefined && username !== oldUsername;
    if (renaming) {
        const taken = await User.findOne({ username, _id: { $ne: user._id } }).collation({ locale: 'en', strength: 2 });
        if (taken) {
            return res.status(409).json({ message: 'This username is already taken', errors: [{ field: 'username', message: 'This username is already taken' }] });
        }
        user.username = username;
    }
    if (emailActivity !== undefined) user.emailActivity = emailActivity;
    await user.save();

    if (renaming) sendUsernameChangedMail(user, oldUsername);
    res.json({ message: 'Profile updated', user: publicUser(user) });
};

export const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password +refreshTokens');
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    if (!(await bcrypt.compare(currentPassword, user.password))) {
        return res.status(400).json({ message: 'Current password is incorrect', errors: [{ field: 'currentPassword', message: 'Current password is incorrect' }] });
    }
    if (await bcrypt.compare(newPassword, user.password)) {
        return res.status(400).json({ message: 'Choose a password different from your current one', errors: [{ field: 'newPassword', message: 'Choose a different password' }] });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    // Sign out every other session; this device gets a fresh one
    user.refreshTokens = [];
    const tokens = await issueSession(user);
    sendPasswordChangedMail(user);

    res.json({ message: 'Password changed. Other devices have been signed out.', ...tokens, user: publicUser(user) });
};

export const logoutAll = async (req, res) => {
    const user = await User.findByIdAndUpdate(req.user.id, { refreshTokens: [] });
    if (user) sendSignedOutEverywhereMail(user);
    res.json({ message: 'Signed out of all devices' });
};
