import dotenv from 'dotenv';
dotenv.config();

const required = ['MONGODB_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length && process.env.NODE_ENV !== 'test') {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const list = (value) =>
  (value || '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

export const config = {
  port: process.env.PORT || 8080,
  mongoUrl: process.env.MONGODB_URL,
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, ''),
  // Comma separated list of origins allowed by CORS (defaults to FRONTEND_URL)
  corsOrigins: list(process.env.CORS_ORIGINS).length
    ? list(process.env.CORS_ORIGINS)
    : [(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')],
  // Optional: restrict signups to campus email domains, e.g. "college.edu,student.college.edu"
  allowedEmailDomains: list(process.env.ALLOWED_EMAIL_DOMAINS),
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRE_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE_IN || '7d',
  },
  mail: {
    // Tests and demo runs must never email real people, even when .env has credentials
    disabled: process.env.NODE_ENV === 'test' || process.env.MAIL_DISABLED === 'true',
    user: process.env.EMAIL_USER,
    // Gmail shows app passwords as "abcd efgh ijkl mnop"; the spaces are not part of it
    pass: process.env.EMAIL_PASS?.replace(/\s/g, ''),
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
};

export const cloudinaryEnabled = Boolean(
  config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret
);
