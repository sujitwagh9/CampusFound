// Promotes an existing account to admin. Signup can never create admins, so
// use this to bootstrap the first one; later admins can be promoted from the
// Users page.
//
// Usage: npm run make-admin -- someone@college.edu
import mongoose from 'mongoose';
import { config } from '../src/config.js';
import { User } from '../src/models/user.model.js';

const email = process.argv[2];
if (!email) {
  console.error('Usage: npm run make-admin -- <email>');
  process.exit(1);
}

await mongoose.connect(config.mongoUrl);
const user = await User.findOneAndUpdate(
  { email },
  { role: 'admin', refreshTokens: [] },
  { new: true }
).collation({ locale: 'en', strength: 2 });
await mongoose.disconnect();

if (!user) {
  console.error(`No account found for ${email}. Sign up first, then run this again.`);
  process.exit(1);
}
console.log(`${user.username} <${user.email}> is now an admin. They need to sign in again.`);
