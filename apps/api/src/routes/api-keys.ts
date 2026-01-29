/**
 * API key routes for Chronoflow API
 * Handles CRUD operations for API keys
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getDb, eq, and, apiKeys } from '@chronoflow/database';
import { NotFoundError, uuidSchema, generateApiKey } from '@chronoflow/utils';
import type { CreateApiKeyResponse } from '@chronoflow/types';
import { auth, type AuthVariables } from '../middleware/auth.js';
import { createApiKeySchema, updateApiKeySchema } from '../validation/api-keys.js';

const apiKeysRouter = new Hono<{ Variables: AuthVariables }>();

// Apply JWT authentication only (API keys shouldn't be able to manage API keys)
apiKeysRouter.use('*', auth);

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
 * Helper to check JWT auth and return error response if not
 */
function requireJwtAuth(c: any): Response | null {
  const authMethod = c.get('authMethod');
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
  return null;
}

/**
 * GET /api-keys
 * List user's API keys
 */
apiKeysRouter.get('/', async (c) => {
  const authError = requireJwtAuth(c);
  if (authError) return authError;

  const userId = c.get('userId');
  const db = getDb();

  const keys = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.userId, userId))
    .orderBy(apiKeys.createdAt);

  return c.json({ success: true, data: keys.map(formatApiKey) });
});

/**
 * POST /api-keys
 * Generate a new API key
 */
apiKeysRouter.post('/', zValidator('json', createApiKeySchema), async (c) => {
  const authError = requireJwtAuth(c);
  if (authError) return authError;

  const userId = c.get('userId');
  const data = c.req.valid('json');
  const db = getDb();

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
    key,
  };

  return c.json(
    {
      success: true,
      data: response,
      message: 'API key created successfully. Save this key - it will not be shown again.',
    },
    201
  );
});

/**
 * GET /api-keys/:id
 * Get a single API key by ID
 */
apiKeysRouter.get(
  '/:id',
  zValidator('param', z.object({ id: uuidSchema })),
  async (c) => {
    const authError = requireJwtAuth(c);
    if (authError) return authError;

    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const db = getDb();

    const [key] = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)))
      .limit(1);

    if (!key) {
      throw new NotFoundError('API key', id);
    }

    return c.json({ success: true, data: formatApiKey(key) });
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
    const authError = requireJwtAuth(c);
    if (authError) return authError;

    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const db = getDb();

    const [existing] = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('API key', id);
    }

    await db.delete(apiKeys).where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)));

    return c.json({ success: true, message: 'API key revoked successfully' });
  }
);

/**
 * PATCH /api-keys/:id
 * Update an API key (name, scopes, active status)
 */
apiKeysRouter.patch(
  '/:id',
  zValidator('param', z.object({ id: uuidSchema })),
  zValidator('json', updateApiKeySchema),
  async (c) => {
    const authError = requireJwtAuth(c);
    if (authError) return authError;

    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const updates = c.req.valid('json');
    const db = getDb();

    const [existing] = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('API key', id);
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.scopes !== undefined) updateData.scopes = updates.scopes;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
    if (updates.expiresAt !== undefined) {
      updateData.expiresAt = updates.expiresAt ? new Date(updates.expiresAt) : null;
    }

    const [updatedKey] = await db
      .update(apiKeys)
      .set(updateData)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)))
      .returning();

    return c.json({ success: true, data: formatApiKey(updatedKey!) });
  }
);

export { apiKeysRouter };
