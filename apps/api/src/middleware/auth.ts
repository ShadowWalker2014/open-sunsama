/**
 * Authentication middleware for Chronoflow API
 * Supports both JWT and API key authentication
 */

import type { Context, MiddlewareHandler } from 'hono';
import { getDb, eq, and, apiKeys } from '@chronoflow/database';
import { AuthenticationError, verifyApiKey } from '@chronoflow/utils';
import { verifyToken } from '../lib/jwt.js';

/**
 * Extended context variables for authenticated requests
 */
export interface AuthVariables {
  userId: string;
  authMethod: 'jwt' | 'api-key';
  apiKeyId?: string;
  apiKeyScopes?: string[];
}

/**
 * Extract the Bearer token from Authorization header
 */
function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * Extract API key from X-API-Key header
 */
function extractApiKey(c: Context): string | null {
  return c.req.header('X-API-Key') || null;
}

/**
 * JWT authentication middleware
 * Verifies JWT tokens from the Authorization header
 */
export const jwtAuth: MiddlewareHandler<{ Variables: AuthVariables }> = async (c, next) => {
  const token = extractBearerToken(c.req.header('Authorization'));
  
  if (!token) {
    throw new AuthenticationError('Authorization header required');
  }

  try {
    const { userId } = verifyToken(token);
    c.set('userId', userId);
    c.set('authMethod', 'jwt');
    await next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new AuthenticationError('Invalid or expired token');
  }
};

/**
 * API key authentication middleware
 * Verifies API keys from the X-API-Key header
 */
export const apiKeyAuth: MiddlewareHandler<{ Variables: AuthVariables }> = async (c, next) => {
  const apiKey = extractApiKey(c);
  
  if (!apiKey) {
    throw new AuthenticationError('X-API-Key header required');
  }

  const db = getDb();
  
  // Find all active, non-expired API keys
  const keys = await db
    .select()
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.isActive, true)
      )
    );

  // Check each key against the provided API key
  let matchedKey = null;
  for (const key of keys) {
    if (verifyApiKey(apiKey, key.keyHash)) {
      // Check if key is expired
      if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
        continue;
      }
      matchedKey = key;
      break;
    }
  }

  if (!matchedKey) {
    throw new AuthenticationError('Invalid or expired API key');
  }

  // Update last used timestamp
  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, matchedKey.id));

  c.set('userId', matchedKey.userId);
  c.set('authMethod', 'api-key');
  c.set('apiKeyId', matchedKey.id);
  c.set('apiKeyScopes', matchedKey.scopes || []);
  
  await next();
};

/**
 * Combined authentication middleware
 * Supports both JWT (Bearer token) and API key authentication
 * Tries JWT first, then API key
 */
export const auth: MiddlewareHandler<{ Variables: AuthVariables }> = async (c, next) => {
  const bearerToken = extractBearerToken(c.req.header('Authorization'));
  const apiKey = extractApiKey(c);

  // Try JWT authentication first
  if (bearerToken) {
    try {
      const { userId } = verifyToken(bearerToken);
      c.set('userId', userId);
      c.set('authMethod', 'jwt');
      return next();
    } catch {
      // JWT failed, will try API key if present
      if (!apiKey) {
        throw new AuthenticationError('Invalid or expired token');
      }
    }
  }

  // Try API key authentication
  if (apiKey) {
    const db = getDb();
    
    const keys = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.isActive, true));

    for (const key of keys) {
      if (verifyApiKey(apiKey, key.keyHash)) {
        // Check if key is expired
        if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
          continue;
        }

        // Update last used timestamp
        await db
          .update(apiKeys)
          .set({ lastUsedAt: new Date() })
          .where(eq(apiKeys.id, key.id));

        c.set('userId', key.userId);
        c.set('authMethod', 'api-key');
        c.set('apiKeyId', key.id);
        c.set('apiKeyScopes', key.scopes || []);
        
        return next();
      }
    }

    throw new AuthenticationError('Invalid or expired API key');
  }

  throw new AuthenticationError('Authentication required');
};

/**
 * Scope check middleware factory
 * Creates middleware that checks if the authenticated request has required scopes
 * Only applies to API key authentication; JWT has full access
 */
export function requireScopes(...requiredScopes: string[]): MiddlewareHandler<{ Variables: AuthVariables }> {
  return async (c, next) => {
    const authMethod = c.get('authMethod');
    
    // JWT has full access
    if (authMethod === 'jwt') {
      return next();
    }

    const keyScopes = c.get('apiKeyScopes') || [];
    
    // Check if key has 'all' scope
    if (keyScopes.includes('all')) {
      return next();
    }

    // Check required scopes
    const hasAllScopes = requiredScopes.every(scope => keyScopes.includes(scope));
    
    if (!hasAllScopes) {
      throw new AuthenticationError(
        `Insufficient permissions. Required scopes: ${requiredScopes.join(', ')}`
      );
    }

    await next();
  };
}
