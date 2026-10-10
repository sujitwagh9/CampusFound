import { z } from 'zod';
import { ITEM_CATEGORIES, ITEM_TYPES } from './models/item.model.js';

const email = z.string().trim().toLowerCase().email('Enter a valid email address');
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');

const username = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[A-Za-z0-9_.-]+$/, 'Username can only contain letters, numbers, ".", "_" and "-"');

// Note: there is intentionally no `role` field. Unknown fields are stripped,
// so a client can never sign itself up as an admin.
export const signupSchema = z.object({
  username,
  email,
  password,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: password,
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const itemFields = {
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(1000),
  category: z.enum(ITEM_CATEGORIES, { errorMap: () => ({ message: 'Choose a valid category' }) }),
  location: z.string().trim().min(2, 'Location is required').max(120),
};

export const createItemSchema = z.object({
  type: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.enum(ITEM_TYPES, { errorMap: () => ({ message: 'Type must be "lost" or "found"' }) })),
  ...itemFields,
});

// Owners may edit the descriptive fields and mark their own item resolved.
// status changes beyond that are admin-only and checked in the controller.
export const updateItemSchema = z
  .object({
    ...itemFields,
    status: z.enum(['pending', 'resolved']),
    // public_ids of images to remove; multipart sends one value as a plain string
    removeImages: z
      .union([z.string(), z.array(z.string())])
      .transform((v) => (Array.isArray(v) ? v : [v])),
  })
  .partial();

export const claimSchema = z.object({
  message: z
    .string()
    .trim()
    .min(10, 'Describe something only the owner would know (at least 10 characters)')
    .max(1000),
  // Optional: which of the claimant's lost reports this found item is
  lostItemId: z.string().optional(),
});

export const claimDecisionSchema = z.object({
  action: z.enum(['approve', 'reject'], { errorMap: () => ({ message: 'Invalid action' }) }),
});

export const roleSchema = z.object({
  role: z.enum(['admin', 'user']),
});

export const updateProfileSchema = z
  .object({ username, emailActivity: z.boolean() })
  .partial()
  .refine((d) => Object.keys(d).length > 0, 'Nothing to update');

// currentPassword is checked in the controller: accounts created with Google
// don't have one yet and can set their first password without it
export const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: password,
});

export const googleLoginSchema = z.object({
  credential: z.string().min(20, 'Missing Google credential'),
});
