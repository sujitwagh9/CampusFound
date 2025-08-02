import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { generateTokens } from "../utils/jwt.utils.js";
import { sendEmail } from "../utils/forgotMail.utils.js";
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
// Login function
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);  
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    // Generate tokens using utility
    const { accessToken, refreshToken } = generateTokens(user);

    // Optionally, save refreshToken to DB or send as HTTP-only cookie
    // user.refreshTokens.push(refreshToken);
    // await user.save();

    // Send response with tokens and user info
    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,

      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Signup function
export const signUp = async (req, res) => {
  const { username, email, role, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      role: role || "user",
      password: hashedPassword,
    });

    await user.save();

    // Generate tokens for the new user
    const { accessToken, refreshToken } = generateTokens(user);

    res.status(201).json({
      message: "User registered successfully",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}


export const logout = async (req, res) => {
  const { userId, refreshToken } = req.body;

  try {
    // Remove the refresh token from the user's record
    await User.findByIdAndUpdate(
      userId,
      { $pull: { refreshTokens: refreshToken } },
      { new: true }
    );

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}


export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Ideally store hashed token in DB with expiry, but for quick use:
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    // Generate reset link
    const resetLink = `http://localhost:5173/reset-password/${resetToken}`;

    // Send Email
    await sendEmail({
      to: email,
      subject: 'Password Reset - CampusFound',
      text: `You requested a password reset. Click the link: ${resetLink}`,
      html: `<p>You requested a password reset.</p><p>Click here: <a href="${resetLink}">${resetLink}</a></p>`
    });

    res.status(200).json({ message: "Password reset link sent to your email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = undefined; // Clear reset token
    user.resetTokenExpiry = undefined; // Clear expiry
    await user.save();
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}


export const refreshTokenController = async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token provided' });
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    return res.json({
      accessToken,
      refreshToken: newRefreshToken
    });

  } catch (err) {
    console.error('Refresh token error:', err);
    return res.status(403).json({ message: 'Invalid or expired refresh token' });
  }
};
