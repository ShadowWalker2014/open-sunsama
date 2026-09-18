/**
 * Configuration for Open Sunsama's OAuth 2.1 authorization server and the
 * remote MCP resource it protects.
 *
 * The issuer and resource URLs come from env, never from the incoming
 * request: behind Railway's proxy the request URL is plain http, and both
 * Claude and ChatGPT compare these strings byte-for-byte.
 */

import { MCP_TOOL_SCOPES } from "@open-sunsama/mcp/server";

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/** e.g. https://api.opensunsama.com */
export function getIssuer(): string {
  return trimTrailingSlash(
    process.env.OAUTH_ISSUER || process.env.API_URL || "http://localhost:3001"
  );
}

/** The MCP endpoint users paste into Claude/ChatGPT: e.g. https://api.opensunsama.com/mcp */
export function getMcpResource(): string {
  return `${getIssuer()}/mcp`;
}

export function getProtectedResourceMetadataUrl(): string {
  return `${getIssuer()}/.well-known/oauth-protected-resource/mcp`;
}

/** Where the consent screen lives (the web app). */
export function getWebAppUrl(): string {
  return trimTrailingSlash(
    process.env.WEB_APP_URL || process.env.FRONTEND_URL || "http://localhost:3000"
  );
}

export const MCP_DOCS_URL = "https://opensunsama.com/docs/mcp/overview";

/** Scopes an MCP token can carry; mirrors the API key scopes the tools need. */
export const RESOURCE_SCOPES: readonly string[] = MCP_TOOL_SCOPES;

/** `offline_access` tells Claude to ask for a refresh token. */
export const SUPPORTED_SCOPES: readonly string[] = [...RESOURCE_SCOPES, "offline_access"];

export const AUTHORIZATION_CODE_TTL_SECONDS = 10 * 60;
export const CONSENT_REQUEST_TTL_SECONDS = 15 * 60;
export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 90 * 24 * 60 * 60;
/**
 * A rotated refresh token replayed within this window is treated as a benign
 * race (two concurrent refreshes) and only rejected; after it, replay means
 * the token leaked and the whole grant is revoked.
 */
export const REFRESH_REUSE_GRACE_SECONDS = 30;
/** Re-fetch a Client ID Metadata Document after this long. */
export const CIMD_CACHE_SECONDS = 24 * 60 * 60;

/** Opaque token prefixes, so the auth middleware can route without a DB hit. */
export const ACCESS_TOKEN_PREFIX = "osat_";
export const REFRESH_TOKEN_PREFIX = "osrt_";
export const AUTH_CODE_PREFIX = "osac_";
export const CLIENT_ID_PREFIX = "osc_";
export const CLIENT_SECRET_PREFIX = "oscs_";

/**
 * Normalize a `resource` parameter (RFC 8707) to our canonical MCP resource.
 * Returns null when absent, undefined when it names some other resource.
 */
export function normalizeResource(resource: string | undefined | null): string | null | undefined {
  if (!resource) return null;
  const canonical = getMcpResource();
  const issuer = getIssuer();
  const trimmed = trimTrailingSlash(resource);
  if (trimmed === canonical || trimmed === issuer) return canonical;
  return undefined;
}

/**
 * Parse a space-delimited scope string, keep only scopes we support, and fall
 * back to every resource scope when the client asked for none we know.
 */
export function resolveRequestedScopes(scope: string | undefined | null): string[] {
  const requested = (scope ?? "").split(/\s+/).filter(Boolean);
  const known = requested.filter((s) => SUPPORTED_SCOPES.includes(s));
  const resourceScopes = known.filter((s) => RESOURCE_SCOPES.includes(s));
  if (resourceScopes.length === 0) {
    return [...RESOURCE_SCOPES, ...known.filter((s) => s === "offline_access")];
  }
  return [...new Set(known)];
}
