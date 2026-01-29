/**
 * API key routes for Chronoflow API
 * Handles CRUD operations for API keys
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getDb, eq, and, apiKeys, API_KEY_SCOPES } from '@chronoflow/database';
import { NotFoundError, uuidSchema, generateApiKey } from '@chronoflow/utils';
import type { CreateApiKeyResponse } from '@chronoflow/types';
import { auth, type AuthVariables } from '../middleware/auth.js';

const apiKeysRouter = new Hono<{ Variables: AuthVariables }>();

// Apply JWT authentication only (API keys shouldn't be able to manage API keys)
apiKeysRouter.use('*', auth);

// Validation schemas
const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  scopes: z.array(z.enum(API_KEY_SCOPES)).default(['tasks:read', 'time-blocks:read']),
  expiresAt: z.string().datetime().optional().nullable(),
});

/**
 * Format API key for response (exclude sensitive hash)
 */
function formatApiKey(key: typeof apiKeys.$inferSelect) {
  return {
    id: key.id,
    userId: key.userId,
    name: key.name,
    keyPrefix: key.keyPrefix,
    scopes: key.scopes || [],
    lastUsedAt: key.lastUsedAt,
    expiresAt: key.expiresAt,
    isActive: key.isActive,
    createdAt: key.createdAt,
    updatedAt: key.updatedAt,
  };
}

/**
 * GET /api-keys
 * List user's API keys
 */
apiKeysRouter.get('/', async (c) => {
  const userId = c.get('userId');
  const authMethod = c.get('authMethod');

  // Only allow JWT auth to list API keys
  if (authMethod !== 'jwt') {
    return c.json(
      {
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'API keys cannot be used to manage API keys',
          statusCode: 403,
        },
      },
      403
    );
  }

  const db = getDb();

  const keys = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.userId, userId))
    .orderBy(apiKeys.createdAt);

  return c.json({
    success: true,
    data: keys.map(formatApiKey),
  });
});

/**
 * POST /api-keys
 * Generate a new API key
 */
apiKeysRouter.post('/', zValidator('json', createApiKeySchema), async (c) => {
  const userId = c.get('userId');
  const authMethod = c.get('authMethod');
  const data = c.req.valid('json');

  // Only allow JWT auth to create API keys
  if (authMethod !== 'jwt') {
    return c.json(
      {
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'API keys cannot be used to create API keys',
          statusCode: 403,
        },
      },
      403
    );
  }

  const db = getDb();

  // Generate new API key
  const { key, hash, prefix } = generateApiKey();

  const [newApiKey] = await db
    .insert(apiKeys)
    .values({
      userId,
      name: data.name,
      keyHash: hash,
      keyPrefix: prefix,
      scopes: data.scopes,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      isActive: true,
    })
    .returning();

  if (!newApiKey) {
    throw new Error('Failed to create API key');
  }

  const response: CreateApiKeyResponse = {
    apiKey: formatApiKey(newApiKey) as any,
    key, // Only time the full key is shown
  };

  return c.json({
    success: true,
    data: response,
    message: 'API key created successfully. Save this key - it will not be shown again.',
  }, 201);
});

/**
 * GET /api-keys/:id
 * Get a single API key by ID
 */
apiKeysRouter.get(
  '/:id',
  zValidator('param', z.object({ id: uuidSchema })),
  async (c) => {
    const userId = c.get('userId');
    const authMethod = c.get('authMethod');
    const { id } = c.req.valid('param');

    // Only allow JWT auth
    if (authMethod !== 'jwt') {
      return c.json(
        {
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'API keys cannot be used to view API key details',
            statusCode: 403,
          },
        },
        403
      );
    }

    const db = getDb();

    const [key] = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)))
      .limit(1);

    if (!key) {
      throw new NotFoundError('API key', id);
    }

    return c.json({
      success: true,
      data: formatApiKey(key),
    });
  }
);

/**
 * DELETE /api-keys/:id
 * Revoke (delete) an API key
 */
apiKeysRouter.delete(
  '/:id',
  zValidator('param', z.object({ id: uuidSchema })),
  async (c) => {
    const userId = c.get('userId');
    const authMethod = c.get('authMethod');
    const { id } = c.req.valid('param');

    // Only allow JWT auth to delete API keys
    if (authMethod !== 'jwt') {
      return c.json(
        {
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'API keys cannot be used to revoke API keys',
            statusCode: 403,
          },
        },
        403
      );
    }

    const db = getDb();

    // Check if key exists and belongs to user
    const [existing] = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('API key', id);
    }

    await db
      .delete(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)));

    return c.json({
      success: true,
      message: 'API key revoked successfully',
    });
  }
);

/**
 * PATCH /api-keys/:id
 * Update an API key (name, scopes, active status)
 */
apiKeysRouter.patch(
  '/:id',
  zValidator('param', z.object({ id: uuidSchema })),
  zValidator('json', z.object({
    name: z.string().min(1).max(255).optional(),
    scopes: z.array(z.enum(API_KEY_SCOPES)).optional(),
    isActive: z.boolean().optional(),
    expiresAt: z.string().datetime().optional().nullable(),
  })),
  async (c) => {
    const userId = c.get('userId');
    const authMethod = c.get('authMethod');
    const { id } = c.req.valid('param');
    const updates = c.req.valid('json');

    // Only allow JWT auth to update API keys
    if (authMethod !== 'jwt') {
      return c.json(
        {
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'API keys cannot be used to update API keys',
            statusCode: 403,
          },
        },
        403
      );
    }

    const db = getDb();

    // Check if key exists and belongs to user
    const [existing] = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('API key', id);
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (updates.name !== undefined) {
      updateData.name = updates.name;
    }
    if (updates.scopes !== undefined) {
      updateData.scopes = updates.scopes;
    }
    if (updates.isActive !== undefined) {
      updateData.isActive = updates.isActive;
    }
    if (updates.expiresAt !== undefined) {
      updateData.expiresAt = updates.expiresAt ? new Date(updates.expiresAt) : null;
    }

    const [updatedKey] = await db
      .update(apiKeys)
      .set(updateData)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)))
      .returning();

    return c.json({
      success: true,
      data: formatApiKey(updatedKey!),
    });
  }
);

export { apiKeysRouter };
