import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config.js';

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  const refreshToken = jwt.sign(
    // jti makes every refresh token unique, even when two are issued in the same second
    { id: user._id, jti: crypto.randomUUID() },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );

  return { accessToken, refreshToken };
};

/**
 * Issues a new token pair and stores the hashed refresh token on the user so it
 * can be revoked on logout. Keeps only the most recent sessions.
 */
export const issueSession = async (user) => {
  const tokens = generateTokens(user);
  user.refreshTokens = [...(user.refreshTokens || []), hashToken(tokens.refreshToken)].slice(-5);
  await user.save();
  return tokens;
};

export const publicUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  emailActivity: user.emailActivity !== false,
  hasPassword: user.passwordSet !== false,
  googleLinked: Boolean(user.googleId),
  createdAt: user.createdAt,
});
