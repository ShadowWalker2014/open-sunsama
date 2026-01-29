/**
 * Authentication routes for Chronoflow API
 * Handles user registration, login, and profile management
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getDb, eq, users } from '@chronoflow/database';
import {
  AuthenticationError,
  ConflictError,
  emailSchema,
  passwordSchema,
} from '@chronoflow/utils';
import type { User, AuthResponse } from '@chronoflow/types';
import { hashPassword, comparePassword } from '../lib/password.js';
import { signToken } from '../lib/jwt.js';
import { auth, type AuthVariables } from '../middleware/auth.js';

const authRouter = new Hono<{ Variables: AuthVariables }>();

// Validation schemas
const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1).max(255).optional(),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional().nullable(),
  avatarUrl: z.string().url().max(500).optional().nullable(),
  timezone: z.string().max(50).optional(),
});

/**
 * Format user data for API response (exclude sensitive fields)
 */
function formatUser(user: typeof users.$inferSelect): Omit<User, 'passwordHash'> {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    timezone: user.timezone || 'UTC',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * POST /auth/register
 * Create a new user account
 */
authRouter.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password, name } = c.req.valid('json');
  const db = getDb();

  // Check if email already exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    throw new ConflictError('An account with this email already exists', 'email');
  }

  // Hash password and create user
  const passwordHash = await hashPassword(password);
  
  const [newUser] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      name: name || null,
    })
    .returning();

  if (!newUser) {
    throw new Error('Failed to create user');
  }

  // Generate token
  const token = signToken(newUser.id);

  const response: AuthResponse = {
    user: formatUser(newUser) as User,
    token,
  };

  return c.json({ success: true, data: response }, 201);
});

/**
 * POST /auth/login
 * Authenticate a user and return a JWT token
 */
authRouter.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');
  const db = getDb();

  // Find user by email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Verify password
  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Generate token
  const token = signToken(user.id);

  const response: AuthResponse = {
    user: formatUser(user) as User,
    token,
  };

  return c.json({ success: true, data: response });
});

/**
 * POST /auth/logout
 * Logout (stateless - just returns success)
 * Client should discard the token
 */
authRouter.post('/logout', auth, async (c) => {
  // Since JWT is stateless, we don't need to do anything server-side
  // The client should simply discard the token
  return c.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * GET /auth/me
 * Get the current authenticated user's profile
 */
authRouter.get('/me', auth, async (c) => {
  const userId = c.get('userId');
  const db = getDb();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  return c.json({
    success: true,
    data: formatUser(user),
  });
});

/**
 * PATCH /auth/me
 * Update the current authenticated user's profile
 */
authRouter.patch('/me', auth, zValidator('json', updateProfileSchema), async (c) => {
  const userId = c.get('userId');
  const updates = c.req.valid('json');
  const db = getDb();

  // Build update object, only including provided fields
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (updates.name !== undefined) {
    updateData.name = updates.name;
  }
  if (updates.avatarUrl !== undefined) {
    updateData.avatarUrl = updates.avatarUrl;
  }
  if (updates.timezone !== undefined) {
    updateData.timezone = updates.timezone;
  }

  const [updatedUser] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, userId))
    .returning();

  if (!updatedUser) {
    throw new AuthenticationError('User not found');
  }

  return c.json({
    success: true,
    data: formatUser(updatedUser),
  });
});

export { authRouter };
