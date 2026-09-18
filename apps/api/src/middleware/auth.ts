/**
 * Authentication middleware for Open Sunsama API
 * Supports both JWT and API key authentication
 */

import type { Context, MiddlewareHandler } from 'hono';
import { getDb, eq, and, apiKeys } from '@open-sunsama/database';
import {
  AuthenticationError,
  AuthorizationError,
  verifyApiKey,
  API_KEY_PREFIX,
  LEGACY_API_KEY_PREFIX,
} from '@open-sunsama/utils';
import { verifyToken } from '../lib/jwt.js';
import { validateAccessToken } from '../lib/oauth/tokens.js';
import { ACCESS_TOKEN_PREFIX } from '../lib/oauth/config.js';

/**
 * Extended context variables for authenticated requests
 */
export interface AuthVariables {
  userId: string;
  authMethod: 'jwt' | 'api-key' | 'oauth';
  apiKeyId?: string;
  /** Scopes for API keys and OAuth tokens; JWT sessions have full access. */
  apiKeyScopes?: string[];
}

/** Who a request authenticated as, independent of Hono context. */
export interface Principal {
  userId: string;
  authMethod: AuthVariables['authMethod'];
  apiKeyId?: string;
  scopes?: string[];
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

function isApiKey(value: string): boolean {
  return value.startsWith(API_KEY_PREFIX) || value.startsWith(LEGACY_API_KEY_PREFIX);
}

async function authenticateApiKey(apiKey: string): Promise<Principal> {
  const db = getDb();
  const keys = await db.select().from(apiKeys).where(eq(apiKeys.isActive, true));

  for (const key of keys) {
    if (verifyApiKey(apiKey, key.keyHash)) {
      if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
        continue;
      }
      await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, key.id));
      return {
        userId: key.userId,
        authMethod: 'api-key',
        apiKeyId: key.id,
        scopes: key.scopes || [],
      };
    }
  }
  throw new AuthenticationError('Invalid or expired API key');
}

/**
 * Resolve the caller from its credentials. Accepts, in order:
 * - OAuth access token (`Bearer osat_...`) from the MCP connector flow
 * - API key sent as a bearer token (`Bearer os_...`), for MCP clients that
 *   only let you set an Authorization header
 * - JWT session token (`Bearer <jwt>`), falling back to `X-API-Key` if invalid
 * - API key (`X-API-Key: os_...`)
 * Returns null when no credential is present; throws on a bad one.
 */
export async function authenticateRequest(
  authorizationHeader: string | undefined,
  apiKeyHeader: string | undefined
): Promise<Principal | null> {
  const bearerToken = extractBearerToken(authorizationHeader);
  const apiKey = apiKeyHeader || null;

  if (bearerToken?.startsWith(ACCESS_TOKEN_PREFIX)) {
    const token = await validateAccessToken(bearerToken);
    if (!token) {
      throw new AuthenticationError('Invalid or expired access token');
    }
    return { userId: token.userId, authMethod: 'oauth', scopes: token.scopes };
  }

  if (bearerToken && isApiKey(bearerToken)) {
    return authenticateApiKey(bearerToken);
  }

  if (bearerToken) {
    try {
      const { userId } = verifyToken(bearerToken);
      return { userId, authMethod: 'jwt' };
    } catch {
      if (!apiKey) {
        throw new AuthenticationError('Invalid or expired token');
      }
    }
  }

  if (apiKey) {
    return authenticateApiKey(apiKey);
  }

  return null;
}

/**
 * OAuth tokens come from third-party MCP connectors, so they only reach the
 * routes the MCP tools call, each gated by the matching read/write scope.
 * Everything else (uploads, calendars, notifications, ...) stays off-limits.
 */
const OAUTH_ROUTE_SCOPES: Array<{ path: RegExp; read: string; write: string }> = [
  { path: /^\/tasks(\/|$)/, read: 'tasks:read', write: 'tasks:write' },
  { path: /^\/time-blocks(\/|$)/, read: 'time-blocks:read', write: 'time-blocks:write' },
  { path: /^\/auth\/me$/, read: 'user:read', write: 'user:write' },
];

function assertOAuthRouteAllowed(method: string, path: string, scopes: string[]): void {
  const rule = OAUTH_ROUTE_SCOPES.find((r) => r.path.test(path));
  if (!rule) {
    throw new AuthorizationError('This connector token can only be used through the MCP server');
  }
  const needed = method === 'GET' || method === 'HEAD' ? rule.read : rule.write;
  if (!scopes.includes(needed)) {
    throw new AuthorizationError(`Insufficient permissions. Required scopes: ${needed}`);
  }
}

/**
 * Combined authentication middleware
 * Supports JWT sessions, API keys, and OAuth access tokens
 */
export const auth: MiddlewareHandler<{ Variables: AuthVariables }> = async (c, next) => {
  const principal = await authenticateRequest(c.req.header('Authorization'), extractApiKey(c) ?? undefined);
  if (!principal) {
    throw new AuthenticationError('Authentication required');
  }
  if (principal.authMethod === 'oauth') {
    assertOAuthRouteAllowed(c.req.method, c.req.path, principal.scopes ?? []);
  }

  c.set('userId', principal.userId);
  c.set('authMethod', principal.authMethod);
  if (principal.apiKeyId) c.set('apiKeyId', principal.apiKeyId);
  if (principal.scopes) c.set('apiKeyScopes', principal.scopes);
  return next();
};

/**
 * Scope check middleware factory
 * Creates middleware that checks if the authenticated request has required scopes
 * Applies to API keys and OAuth tokens; JWT has full access
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
