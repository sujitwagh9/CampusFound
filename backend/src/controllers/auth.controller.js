import bcrypt from "bcryptjs";
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User } from "../models/user.model.js";
import { config } from '../config.js';
import { hashToken, issueSession, publicUser } from "../utils/jwt.utils.js";
import { sendPasswordChangedMail, sendPasswordResetMail, sendWelcomeMail } from "../utils/mail.utils.js";

// Case-insensitive match so accounts created before emails were lowercased still work
const CASE_INSENSITIVE = { locale: 'en', strength: 2 };
const findByEmail = (email) => User.findOne({ email }).collation(CASE_INSENSITIVE);

const INVALID_CREDENTIALS = "Invalid email or password";
const RESET_SENT = "If an account exists for that email, a password reset link has been sent";

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await findByEmail(email).select('+password +refreshTokens');
  // Same response for unknown email and wrong password so accounts can't be enumerated
  const isMatch = user ? await bcrypt.compare(password, user.password) : false;
  if (!isMatch) {
    return res.status(401).json({ message: INVALID_CREDENTIALS });
  }

  const { accessToken, refreshToken } = await issueSession(user);
  res.json({ accessToken, refreshToken, user: publicUser(user) });
};

export const signUp = async (req, res) => {
  // req.body has been validated and contains only username, email and password
  const { username, email, password } = req.body;

  if (config.allowedEmailDomains.length) {
    const domain = email.split('@')[1];
    if (!config.allowedEmailDomains.includes(domain)) {
      return res.status(400).json({
        message: `Please sign up with your campus email (${config.allowedEmailDomains.map((d) => '@' + d).join(', ')})`,
      });
    }
  }

  const [emailTaken, usernameTaken] = await Promise.all([
    findByEmail(email),
    User.findOne({ username }).collation(CASE_INSENSITIVE),
  ]);
  if (emailTaken) {
    return res.status(409).json({ message: "An account with this email already exists" });
  }
  if (usernameTaken) {
    return res.status(409).json({ message: "This username is already taken" });
  }

  const user = new User({
    username,
    email,
    role: "user",
    password: await bcrypt.hash(password, 10),
  });

  const { accessToken, refreshToken } = await issueSession(user);
  sendWelcomeMail(user);
  res.status(201).json({
    message: "User registered successfully",
    accessToken,
    refreshToken,
    user: publicUser(user),
  });
};

export const logout = async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await User.updateOne(
      { refreshTokens: hashToken(refreshToken) },
      { $pull: { refreshTokens: hashToken(refreshToken) } }
    );
  }
  res.status(200).json({ message: "Logged out successfully" });
};

export const forgotPassword = async (req, res) => {
  const user = await findByEmail(req.body.email);

  if (user) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = hashToken(resetToken);
    user.resetTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    sendPasswordResetMail(user.email, `${config.frontendUrl}/reset-password/${resetToken}`);
  }

  // Always the same response so the endpoint can't be used to discover accounts
  res.status(200).json({ message: RESET_SENT });
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  const user = await User.findOne({
    resetToken: hashToken(token),
    resetTokenExpiry: { $gt: Date.now() },
  });
  if (!user) {
    return res.status(400).json({ message: "This reset link is invalid or has expired" });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetToken = null;
  user.resetTokenExpiry = null;
  // Sign out every existing session after a password change
  user.refreshTokens = [];
  await user.save();
  sendPasswordChangedMail(user, 'reset');

  res.status(200).json({ message: "Password reset successfully. You can now sign in." });
};

export const refreshTokenController = async (req, res) => {
  const { refreshToken } = req.body;

  let payload;
  try {
    payload = jwt.verify(refreshToken, config.jwt.refreshSecret);
  } catch {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }

  const hashed = hashToken(refreshToken);
  const user = await User.findById(payload.id).select('+refreshTokens');
  if (!user || !user.refreshTokens.includes(hashed)) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }

  // Rotate: the used refresh token is revoked and replaced
  user.refreshTokens = user.refreshTokens.filter((t) => t !== hashed);
  const tokens = await issueSession(user);

  res.json({ ...tokens, user: publicUser(user) });
};
