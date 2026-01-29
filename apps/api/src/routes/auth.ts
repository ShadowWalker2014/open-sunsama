/**
 * Authentication routes for Open Sunsama API
 * Handles user registration, login, and profile management
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import crypto from 'crypto';
import { getDb, eq, users } from '@open-sunsama/database';
import { AuthenticationError, ConflictError, ValidationError } from '@open-sunsama/utils';
import type { User, AuthResponse } from '@open-sunsama/types';
import { hashPassword, comparePassword } from '../lib/password.js';
import { signToken } from '../lib/jwt.js';
import { auth, type AuthVariables } from '../middleware/auth.js';
import {
  registerSchema, loginSchema, updateProfileSchema, changePasswordSchema,
  requestPasswordResetSchema, resetPasswordSchema,
} from '../validation/auth.js';

const authRouter = new Hono<{ Variables: AuthVariables }>();

/** Format user data for API response (exclude sensitive fields) */
function formatUser(user: typeof users.$inferSelect): Omit<User, 'passwordHash'> {
  return {
    id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl,
    timezone: user.timezone || 'UTC', createdAt: user.createdAt, updatedAt: user.updatedAt,
  };
}

/** POST /auth/register - Create a new user account */
authRouter.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password, name } = c.req.valid('json');
  const db = getDb();

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) throw new ConflictError('An account with this email already exists', 'email');

  const passwordHash = await hashPassword(password);
  const [newUser] = await db.insert(users).values({ email, passwordHash, name: name || null }).returning();
  if (!newUser) throw new Error('Failed to create user');

  const token = signToken(newUser.id);
  return c.json({ success: true, data: { user: formatUser(newUser) as User, token } as AuthResponse }, 201);
});

/** POST /auth/login - Authenticate a user and return a JWT token */
authRouter.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');
  const db = getDb();

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) throw new AuthenticationError('Invalid email or password');

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) throw new AuthenticationError('Invalid email or password');

  const token = signToken(user.id);
  return c.json({ success: true, data: { user: formatUser(user) as User, token } as AuthResponse });
});

/** POST /auth/logout - Logout (stateless - just returns success) */
authRouter.post('/logout', auth, async (c) => {
  return c.json({ success: true, message: 'Logged out successfully' });
});

/** GET /auth/me - Get the current authenticated user's profile */
authRouter.get('/me', auth, async (c) => {
  const userId = c.get('userId');
  const db = getDb();

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new AuthenticationError('User not found');

  return c.json({ success: true, data: formatUser(user) });
});

/** PATCH /auth/me - Update the current authenticated user's profile */
authRouter.patch('/me', auth, zValidator('json', updateProfileSchema), async (c) => {
  const userId = c.get('userId');
  const updates = c.req.valid('json');
  const db = getDb();

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.avatarUrl !== undefined) updateData.avatarUrl = updates.avatarUrl;
  if (updates.timezone !== undefined) updateData.timezone = updates.timezone;

  const [updatedUser] = await db.update(users).set(updateData).where(eq(users.id, userId)).returning();
  if (!updatedUser) throw new AuthenticationError('User not found');

  return c.json({ success: true, data: formatUser(updatedUser) });
});

/** POST /auth/change-password - Change the current user's password */
authRouter.post('/change-password', auth, zValidator('json', changePasswordSchema), async (c) => {
  const userId = c.get('userId');
  const { currentPassword, newPassword } = c.req.valid('json');
  const db = getDb();

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new AuthenticationError('User not found');

  const isValid = await comparePassword(currentPassword, user.passwordHash);
  if (!isValid) throw new ValidationError('Current password is incorrect', { currentPassword: ['Current password is incorrect'] });

  const newPasswordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash: newPasswordHash, updatedAt: new Date() }).where(eq(users.id, userId));

  return c.json({ success: true, message: 'Password changed successfully' });
});

/** POST /auth/request-password-reset - Request a password reset email */
authRouter.post('/request-password-reset', zValidator('json', requestPasswordResetSchema), async (c) => {
  const { email } = c.req.valid('json');
  const db = getDb();

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (user) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await db.update(users).set({ passwordResetToken: resetTokenHash, passwordResetExpires: expires, updatedAt: new Date() }).where(eq(users.id, user.id));
    console.log(`[Password Reset] Token for ${email}: ${resetToken}`);
  }

  return c.json({ success: true, message: 'If an account exists with that email, a password reset link has been sent.' });
});

/** POST /auth/reset-password - Reset password using a valid reset token */
authRouter.post('/reset-password', zValidator('json', resetPasswordSchema), async (c) => {
  const { token, newPassword } = c.req.valid('json');
  const db = getDb();

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const [user] = await db.select().from(users).where(eq(users.passwordResetToken, tokenHash)).limit(1);

  if (!user) throw new ValidationError('Invalid or expired reset token', { token: ['Invalid or expired reset token'] });
  if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
    throw new ValidationError('Reset token has expired', { token: ['Reset token has expired. Please request a new one.'] });
  }

  const newPasswordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash: newPasswordHash, passwordResetToken: null, passwordResetExpires: null, updatedAt: new Date() }).where(eq(users.id, user.id));

  return c.json({ success: true, message: 'Password has been reset successfully. You can now log in with your new password.' });
});

export { authRouter };
