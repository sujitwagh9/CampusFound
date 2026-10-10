import bcrypt from "bcryptjs";
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User } from "../models/user.model.js";
import { config } from '../config.js';
import { hashToken, issueSession, publicUser } from "../utils/jwt.utils.js";
import { sendGoogleLinkedMail, sendPasswordChangedMail, sendPasswordResetMail, sendWelcomeMail } from "../utils/mail.utils.js";
import { google } from "../services/google.service.js";

// Case-insensitive match so accounts created before emails were lowercased still work
const CASE_INSENSITIVE = { locale: 'en', strength: 2 };
const findByEmail = (email) => User.findOne({ email }).collation(CASE_INSENSITIVE);

const INVALID_CREDENTIALS = "Invalid email or password";

const emailDomainAllowed = (email) =>
  !config.allowedEmailDomains.length || config.allowedEmailDomains.includes(email.split('@')[1].toLowerCase());
const campusEmailMessage = () =>
  `Please use your campus email (${config.allowedEmailDomains.map((d) => '@' + d).join(', ')})`;
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

  if (!emailDomainAllowed(email)) {
    return res.status(400).json({ message: campusEmailMessage() });
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

// A free username based on the Google profile, e.g. "Sujit Wagh" -> "sujit.wagh", "sujit.wagh2", ...
const usernameFor = async (profile) => {
  const base =
    (profile.name || profile.email.split('@')[0])
      .normalize('NFKD')
      .replace(/[^\w\s.-]/g, '')
      .trim()
      .replace(/\s+/g, '.')
      .toLowerCase()
      .slice(0, 24) || 'user';
  const padded = base.length < 3 ? `${base}user` : base;
  for (let n = 0; n < 50; n++) {
    const candidate = n ? `${padded}${n + 1}` : padded;
    if (!(await User.exists({ username: candidate }).collation(CASE_INSENSITIVE))) return candidate;
  }
  return `${padded}${crypto.randomInt(1000, 9999)}`;
};

/**
 * Sign in with Google. The browser gets an ID token from Google; we verify it
 * here, then sign in the matching account, link it to an existing account
 * with the same (Google-verified) email, or create a new one.
 */
export const googleLogin = async (req, res) => {
  if (!config.google.clientId) {
    return res.status(503).json({ message: 'Google sign-in is not set up on this server' });
  }

  let profile;
  try {
    profile = await google.verifyIdToken(req.body.credential);
  } catch {
    return res.status(401).json({ message: 'Google sign-in failed. Please try again.' });
  }
  if (!profile?.sub || !profile.email || !profile.email_verified) {
    return res.status(401).json({ message: 'Your Google account email is not verified' });
  }

  const email = profile.email.toLowerCase();
  let user = await User.findOne({ googleId: profile.sub }).select('+refreshTokens');
  let created = false;
  let linked = false;

  if (!user) {
    user = await findByEmail(email).select('+refreshTokens');
    if (user) {
      // Google has just proven who owns this email. Password signups aren't
      // email-verified, so someone else could have registered it first and
      // still know its password: clear the password and end old sessions so
      // only the real owner keeps access. They can set a new password later.
      user.googleId = profile.sub;
      if (user.passwordSet !== false) {
        user.password = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
        user.passwordSet = false;
      }
      user.refreshTokens = [];
      linked = true;
    } else {
      if (!emailDomainAllowed(email)) {
        return res.status(400).json({ message: campusEmailMessage() });
      }
      user = new User({
        username: await usernameFor({ ...profile, email }),
        email,
        role: 'user',
        googleId: profile.sub,
        // Unusable random password until the user chooses one in their profile
        password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10),
        passwordSet: false,
      });
      created = true;
    }
  }

  const { accessToken, refreshToken } = await issueSession(user);
  if (created) sendWelcomeMail(user);
  if (linked) sendGoogleLinkedMail(user);
  res.status(created ? 201 : 200).json({ accessToken, refreshToken, user: publicUser(user), created, linked });
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
  user.passwordSet = true;
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
