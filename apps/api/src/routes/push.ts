/**
 * Push notification routes for Open Sunsama API
 * Handles web push subscription management
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getDb, eq, and, pushSubscriptions } from '@open-sunsama/database';
import { ValidationError, InternalError } from '@open-sunsama/utils';
import { auth, type AuthVariables } from '../middleware/auth.js';
import { getVapidPublicKey, isWebPushConfigured } from '../lib/web-push.js';

const pushRouter = new Hono<{ Variables: AuthVariables }>();

// Validation schema for push subscription
const subscribeSchema = z.object({
  endpoint: z.string().url('Invalid endpoint URL'),
  keys: z.object({
    p256dh: z.string().min(1, 'p256dh key is required'),
    auth: z.string().min(1, 'Auth key is required'),
  }),
  expirationTime: z.number().nullable().optional(),
});

/**
 * GET /push/vapid-public-key
 * Get the public VAPID key for client-side push subscription
 * This endpoint does NOT require authentication
 */
pushRouter.get('/vapid-public-key', (c) => {
  const publicKey = getVapidPublicKey();
  
  if (!publicKey) {
    return c.json({
      success: false,
      error: {
        code: 'PUSH_NOT_CONFIGURED',
        message: 'Push notifications are not configured on this server',
        statusCode: 503,
      },
    }, 503);
  }

  return c.json({
    success: true,
    data: {
      publicKey,
      configured: isWebPushConfigured(),
    },
  });
});

// All remaining routes require authentication
pushRouter.use('/*', auth);

/**
 * POST /push/subscribe
 * Store a new push subscription for the authenticated user
 */
pushRouter.post('/subscribe', zValidator('json', subscribeSchema), async (c) => {
  const userId = c.get('userId');
  const data = c.req.valid('json');
  const db = getDb();

  // Get user agent for debugging purposes
  const userAgent = c.req.header('User-Agent') || null;

  // Check if this endpoint already exists (upsert behavior)
  const [existing] = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, data.endpoint))
    .limit(1);

  if (existing) {
    // Update existing subscription if it belongs to the same user
    if (existing.userId !== userId) {
      // Different user - this subscription was re-registered by another account
      // Update ownership to current user
      const [updated] = await db
        .update(pushSubscriptions)
        .set({
          userId,
          p256dhKey: data.keys.p256dh,
          authKey: data.keys.auth,
          expirationTime: data.expirationTime ?? null,
          userAgent,
        })
        .where(eq(pushSubscriptions.id, existing.id))
        .returning();

      if (!updated) {
        throw new InternalError('Failed to update push subscription');
      }

      return c.json({
        success: true,
        data: {
          id: updated.id,
          message: 'Subscription updated (ownership transferred)',
        },
      });
    }

    // Same user - just update the keys in case they changed
    const [updatedSameUser] = await db
      .update(pushSubscriptions)
      .set({
        p256dhKey: data.keys.p256dh,
        authKey: data.keys.auth,
        expirationTime: data.expirationTime ?? null,
        userAgent,
      })
      .where(eq(pushSubscriptions.id, existing.id))
      .returning();

    if (!updatedSameUser) {
      throw new InternalError('Failed to update push subscription');
    }

    return c.json({
      success: true,
      data: {
        id: updatedSameUser.id,
        message: 'Subscription updated',
      },
    });
  }

  // Create new subscription
  try {
    const [created] = await db
      .insert(pushSubscriptions)
      .values({
        userId,
        endpoint: data.endpoint,
        p256dhKey: data.keys.p256dh,
        authKey: data.keys.auth,
        expirationTime: data.expirationTime ?? null,
        userAgent,
      })
      .returning();

    if (!created) {
      throw new InternalError('Failed to create push subscription');
    }

    return c.json({
      success: true,
      data: {
        id: created.id,
        message: 'Subscription created',
      },
    }, 201);
  } catch (error) {
    // Handle unique constraint violation (race condition)
    if (error instanceof Error && 'code' in error && (error as { code: string }).code === '23505') {
      // Subscription was created by another request, fetch and return it
      const [existing] = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, data.endpoint))
        .limit(1);

      if (existing) {
        return c.json({
          success: true,
          data: {
            id: existing.id,
            message: 'Subscription already exists',
          },
        });
      }
    }

    throw error;
  }
});

/**
 * DELETE /push/subscribe
 * Remove a push subscription for the authenticated user
 */
pushRouter.delete('/subscribe', zValidator('json', z.object({
  endpoint: z.string().url('Invalid endpoint URL'),
})), async (c) => {
  const userId = c.get('userId');
  const { endpoint } = c.req.valid('json');
  const db = getDb();

  // Delete the subscription if it belongs to this user
  const deleted = await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, endpoint)
      )
    )
    .returning();

  if (deleted.length === 0) {
    return c.json({
      success: true,
      data: {
        message: 'Subscription not found or already removed',
      },
    });
  }

  return c.json({
    success: true,
    data: {
      message: 'Subscription removed',
    },
  });
});

/**
 * GET /push/subscriptions
 * List all push subscriptions for the authenticated user
 */
pushRouter.get('/subscriptions', async (c) => {
  const userId = c.get('userId');
  const db = getDb();

  const subscriptions = await db
    .select({
      id: pushSubscriptions.id,
      endpoint: pushSubscriptions.endpoint,
      userAgent: pushSubscriptions.userAgent,
      createdAt: pushSubscriptions.createdAt,
    })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  return c.json({
    success: true,
    data: subscriptions,
  });
});

export { pushRouter };
