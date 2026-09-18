/**
 * Authorization codes and access/refresh tokens for the MCP OAuth server.
 * Every secret is an opaque random string; only SHA-256 hashes are stored.
 */

import {
  getDb,
  eq,
  and,
  isNull,
  gt,
  desc,
  inArray,
  oauthAuthorizationCodes,
  oauthClients,
  oauthTokens,
} from "@open-sunsama/database";
import {
  ACCESS_TOKEN_PREFIX,
  ACCESS_TOKEN_TTL_SECONDS,
  AUTH_CODE_PREFIX,
  AUTHORIZATION_CODE_TTL_SECONDS,
  REFRESH_REUSE_GRACE_SECONDS,
  REFRESH_TOKEN_PREFIX,
  REFRESH_TOKEN_TTL_SECONDS,
  RESOURCE_SCOPES,
  getMcpResource,
  normalizeResource,
} from "./config.js";
import { randomToken, sha256Hex, verifyPkceS256 } from "./crypto.js";
import { OAuthError } from "./errors.js";

export interface TokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface AccessTokenInfo {
  tokenId: string;
  userId: string;
  clientId: string;
  /** Resource scopes only (no offline_access), in API-key scope format. */
  scopes: string[];
}

const secondsFromNow = (seconds: number) => new Date(Date.now() + seconds * 1000);

export async function createAuthorizationCode(input: {
  clientId: string;
  userId: string;
  redirectUri: string;
  codeChallenge: string;
  scopes: string[];
  resource: string | null;
}): Promise<string> {
  const code = randomToken(AUTH_CODE_PREFIX);
  await getDb()
    .insert(oauthAuthorizationCodes)
    .values({
      codeHash: sha256Hex(code),
      clientId: input.clientId,
      userId: input.userId,
      redirectUri: input.redirectUri,
      codeChallenge: input.codeChallenge,
      scopes: input.scopes,
      resource: input.resource,
      expiresAt: secondsFromNow(AUTHORIZATION_CODE_TTL_SECONDS),
    });
  return code;
}

async function issueTokenPair(input: {
  familyId: string;
  userId: string;
  clientId: string;
  scopes: string[];
  resource: string | null;
}): Promise<TokenResponse> {
  const accessToken = randomToken(ACCESS_TOKEN_PREFIX);
  const refreshToken = randomToken(REFRESH_TOKEN_PREFIX);
  await getDb()
    .insert(oauthTokens)
    .values({
      familyId: input.familyId,
      userId: input.userId,
      clientId: input.clientId,
      accessTokenHash: sha256Hex(accessToken),
      refreshTokenHash: sha256Hex(refreshToken),
      scopes: input.scopes,
      resource: input.resource,
      accessTokenExpiresAt: secondsFromNow(ACCESS_TOKEN_TTL_SECONDS),
      refreshTokenExpiresAt: secondsFromNow(REFRESH_TOKEN_TTL_SECONDS),
    });
  return {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
    refresh_token: refreshToken,
    scope: input.scopes.join(" "),
  };
}

async function revokeFamily(familyId: string): Promise<void> {
  await getDb()
    .update(oauthTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(oauthTokens.familyId, familyId), isNull(oauthTokens.revokedAt)));
}

function checkResource(requested: string | undefined, granted: string | null): void {
  if (!requested) return;
  const normalized = normalizeResource(requested);
  if (normalized === undefined || (granted !== null && normalized !== granted)) {
    throw new OAuthError("invalid_target", "The requested resource does not match this grant");
  }
}

export async function exchangeAuthorizationCode(input: {
  code: string | undefined;
  clientId: string;
  redirectUri: string | undefined;
  codeVerifier: string | undefined;
  resource: string | undefined;
}): Promise<TokenResponse> {
  if (!input.code || !input.codeVerifier) {
    throw new OAuthError("invalid_request", "code and code_verifier are required");
  }

  const db = getDb();
  const [row] = await db
    .select()
    .from(oauthAuthorizationCodes)
    .where(eq(oauthAuthorizationCodes.codeHash, sha256Hex(input.code)))
    .limit(1);

  if (!row || row.clientId !== input.clientId) {
    throw new OAuthError("invalid_grant", "Invalid authorization code");
  }
  if (row.consumedAt) {
    // A replayed code means it leaked: kill anything it produced.
    await revokeFamily(row.id);
    throw new OAuthError("invalid_grant", "Authorization code has already been used");
  }
  if (row.expiresAt.getTime() < Date.now()) {
    throw new OAuthError("invalid_grant", "Authorization code has expired");
  }
  if (input.redirectUri !== undefined && input.redirectUri !== row.redirectUri) {
    throw new OAuthError("invalid_grant", "redirect_uri does not match the authorization request");
  }
  if (!verifyPkceS256(input.codeVerifier, row.codeChallenge)) {
    throw new OAuthError("invalid_grant", "PKCE verification failed");
  }
  checkResource(input.resource, row.resource);

  const claimed = await db
    .update(oauthAuthorizationCodes)
    .set({ consumedAt: new Date() })
    .where(and(eq(oauthAuthorizationCodes.id, row.id), isNull(oauthAuthorizationCodes.consumedAt)))
    .returning({ id: oauthAuthorizationCodes.id });
  if (claimed.length === 0) {
    throw new OAuthError("invalid_grant", "Authorization code has already been used");
  }

  return issueTokenPair({
    familyId: row.id,
    userId: row.userId,
    clientId: row.clientId,
    scopes: row.scopes,
    resource: row.resource ?? getMcpResource(),
  });
}

export async function refreshAccessToken(input: {
  refreshToken: string | undefined;
  clientId: string;
  scope: string | undefined;
  resource: string | undefined;
}): Promise<TokenResponse> {
  if (!input.refreshToken) {
    throw new OAuthError("invalid_request", "refresh_token is required");
  }

  const db = getDb();
  const [row] = await db
    .select()
    .from(oauthTokens)
    .where(eq(oauthTokens.refreshTokenHash, sha256Hex(input.refreshToken)))
    .limit(1);

  if (!row || row.clientId !== input.clientId || row.revokedAt) {
    throw new OAuthError("invalid_grant", "Invalid refresh token");
  }
  if (row.rotatedAt) {
    const sinceRotation = Date.now() - row.rotatedAt.getTime();
    if (sinceRotation > REFRESH_REUSE_GRACE_SECONDS * 1000) {
      await revokeFamily(row.familyId);
    }
    throw new OAuthError("invalid_grant", "Refresh token has already been used");
  }
  if (!row.refreshTokenExpiresAt || row.refreshTokenExpiresAt.getTime() < Date.now()) {
    throw new OAuthError("invalid_grant", "Refresh token has expired");
  }
  checkResource(input.resource, row.resource);

  let scopes = row.scopes;
  if (input.scope) {
    const requested = input.scope.split(/\s+/).filter(Boolean);
    if (!requested.every((s) => row.scopes.includes(s))) {
      throw new OAuthError("invalid_scope", "Requested scope exceeds the original grant");
    }
    scopes = requested;
  }

  const claimed = await db
    .update(oauthTokens)
    .set({ rotatedAt: new Date() })
    .where(and(eq(oauthTokens.id, row.id), isNull(oauthTokens.rotatedAt)))
    .returning({ id: oauthTokens.id });
  if (claimed.length === 0) {
    throw new OAuthError("invalid_grant", "Refresh token has already been used");
  }

  return issueTokenPair({
    familyId: row.familyId,
    userId: row.userId,
    clientId: row.clientId,
    scopes,
    resource: row.resource,
  });
}

/** Validate a bearer access token. Returns null when missing, expired, or revoked. */
export async function validateAccessToken(token: string): Promise<AccessTokenInfo | null> {
  if (!token.startsWith(ACCESS_TOKEN_PREFIX)) return null;

  const db = getDb();
  const [row] = await db
    .select()
    .from(oauthTokens)
    .where(
      and(
        eq(oauthTokens.accessTokenHash, sha256Hex(token)),
        isNull(oauthTokens.revokedAt),
        gt(oauthTokens.accessTokenExpiresAt, new Date())
      )
    )
    .limit(1);
  if (!row) return null;

  // Token audience check (RFC 8707): only tokens minted for our MCP resource.
  if (row.resource && row.resource !== getMcpResource()) return null;

  // Throttle the bookkeeping write to once a minute per token.
  if (!row.lastUsedAt || Date.now() - row.lastUsedAt.getTime() > 60_000) {
    await db.update(oauthTokens).set({ lastUsedAt: new Date() }).where(eq(oauthTokens.id, row.id));
  }

  return {
    tokenId: row.id,
    userId: row.userId,
    clientId: row.clientId,
    scopes: row.scopes.filter((s) => RESOURCE_SCOPES.includes(s)),
  };
}

/** RFC 7009: revoking either token of a pair revokes the whole grant. */
export async function revokeToken(token: string, clientId: string): Promise<void> {
  const hash = sha256Hex(token);
  const column = token.startsWith(REFRESH_TOKEN_PREFIX)
    ? oauthTokens.refreshTokenHash
    : oauthTokens.accessTokenHash;
  const [row] = await getDb().select().from(oauthTokens).where(eq(column, hash)).limit(1);
  if (row && row.clientId === clientId) {
    await revokeFamily(row.familyId);
  }
}

export interface OAuthConnection {
  clientId: string;
  clientName: string;
  clientUri: string | null;
  logoUri: string | null;
  verifiedDomain: string | null;
  scopes: string[];
  connectedAt: string;
  lastUsedAt: string | null;
}

/** Apps the user has authorized that still hold a usable grant. */
export async function listConnections(userId: string): Promise<OAuthConnection[]> {
  const rows = await getDb()
    .select({ token: oauthTokens, client: oauthClients })
    .from(oauthTokens)
    .innerJoin(oauthClients, eq(oauthTokens.clientId, oauthClients.clientId))
    .where(
      and(
        eq(oauthTokens.userId, userId),
        isNull(oauthTokens.revokedAt),
        isNull(oauthTokens.rotatedAt),
        gt(oauthTokens.refreshTokenExpiresAt, new Date())
      )
    )
    .orderBy(desc(oauthTokens.createdAt));

  const byClient = new Map<string, OAuthConnection>();
  for (const { token, client } of rows) {
    const existing = byClient.get(client.clientId);
    const lastUsed = token.lastUsedAt?.toISOString() ?? null;
    if (existing) {
      if (lastUsed && (!existing.lastUsedAt || lastUsed > existing.lastUsedAt)) {
        existing.lastUsedAt = lastUsed;
      }
      if (token.createdAt.toISOString() < existing.connectedAt) {
        existing.connectedAt = token.createdAt.toISOString();
      }
      continue;
    }
    const verifiedDomain =
      client.registrationType === "cimd" ? new URL(client.clientId).hostname : null;
    byClient.set(client.clientId, {
      clientId: client.clientId,
      clientName: client.clientName || verifiedDomain || "Unnamed app",
      clientUri: client.clientUri,
      logoUri: client.logoUri,
      verifiedDomain,
      scopes: token.scopes.filter((s) => RESOURCE_SCOPES.includes(s)),
      connectedAt: token.createdAt.toISOString(),
      lastUsedAt: lastUsed,
    });
  }
  return [...byClient.values()];
}

/** Disconnect an app: revoke every token the user granted it. */
export async function revokeConnection(userId: string, clientId: string): Promise<number> {
  const db = getDb();
  const families = await db
    .selectDistinct({ familyId: oauthTokens.familyId })
    .from(oauthTokens)
    .where(and(eq(oauthTokens.userId, userId), eq(oauthTokens.clientId, clientId)));
  if (families.length === 0) return 0;
  const revoked = await db
    .update(oauthTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(
        inArray(
          oauthTokens.familyId,
          families.map((f) => f.familyId)
        ),
        isNull(oauthTokens.revokedAt)
      )
    )
    .returning({ id: oauthTokens.id });
  return revoked.length;
}
