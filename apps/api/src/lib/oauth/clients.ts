/**
 * OAuth client registry: dynamic client registration (RFC 7591), Client ID
 * Metadata Documents (CIMD, used by Claude, Claude Code and ChatGPT),
 * redirect URI rules, and token-endpoint client authentication.
 */

import { isIP } from "node:net";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { getDb, eq, oauthClients, type OAuthClient } from "@open-sunsama/database";
import {
  CIMD_CACHE_SECONDS,
  CLIENT_ID_PREFIX,
  CLIENT_SECRET_PREFIX,
  getIssuer,
} from "./config.js";
import { randomToken, safeEqual, sha256Hex } from "./crypto.js";
import { OAuthError } from "./errors.js";

const DISALLOWED_REDIRECT_SCHEMES = new Set([
  "javascript:",
  "data:",
  "file:",
  "vbscript:",
  "about:",
  "blob:",
]);

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

const CIMD_MAX_BYTES = 64 * 1024;
const CIMD_FETCH_TIMEOUT_MS = 5000;

type TokenAuthMethod = "none" | "client_secret_basic" | "client_secret_post" | "private_key_jwt";

/**
 * A redirect URI is acceptable when it is HTTPS, an http loopback address
 * (native apps, RFC 8252 §7.3), or a private-use scheme like `cursor://`.
 */
export function isAllowedRedirectUri(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.hash) return false;
  if (DISALLOWED_REDIRECT_SCHEMES.has(url.protocol)) return false;
  if (url.protocol === "https:") return true;
  if (url.protocol === "http:") return LOOPBACK_HOSTS.has(url.hostname);
  return true;
}

/**
 * Exact string match, except loopback redirects ignore the port: Claude Code
 * and VS Code bind an ephemeral port per session and register the portless
 * URI (RFC 8252 §7.3).
 */
export function redirectUriMatches(registered: readonly string[], requested: string): boolean {
  if (registered.includes(requested)) return true;

  let req: URL;
  try {
    req = new URL(requested);
  } catch {
    return false;
  }
  if (req.protocol !== "http:" || !LOOPBACK_HOSTS.has(req.hostname)) return false;

  return registered.some((candidate) => {
    try {
      const reg = new URL(candidate);
      return (
        reg.protocol === "http:" &&
        reg.hostname === req.hostname &&
        reg.pathname === req.pathname &&
        reg.search === req.search
      );
    } catch {
      return false;
    }
  });
}

/** CIMD client IDs are HTTPS URLs with a path (MCP 2025-11-25 authorization spec). */
export function isCimdClientId(clientId: string): boolean {
  if (!clientId.startsWith("https://")) return false;
  try {
    const url = new URL(clientId);
    return url.pathname !== "/" && !url.hash && !url.username && !url.password;
  } catch {
    return false;
  }
}

/** Refuse to fetch metadata from hosts that could reach our private network. */
function isPublicHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (isIP(host)) return false;
  if (!host.includes(".")) return false;
  return !["localhost", ".local", ".localhost", ".internal", ".lan", ".home.arpa"].some(
    (suffix) => host === suffix || host.endsWith(suffix)
  );
}

interface ClientMetadataDocument {
  client_id: string;
  client_name?: string;
  client_uri?: string;
  logo_uri?: string;
  redirect_uris: string[];
  token_endpoint_auth_method?: string;
  jwks_uri?: string;
}

function optionalHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 1024) return null;
  try {
    return new URL(value).protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

function optionalName(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 255) : null;
}

async function fetchClientMetadataDocument(clientId: string): Promise<ClientMetadataDocument> {
  const url = new URL(clientId);
  if (!isPublicHostname(url.hostname)) {
    throw new OAuthError("invalid_client", "Client metadata host is not allowed");
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "OpenSunsama-OAuth/1.0" },
      redirect: "error",
      signal: AbortSignal.timeout(CIMD_FETCH_TIMEOUT_MS),
    });
  } catch {
    throw new OAuthError("invalid_client", "Could not fetch the client metadata document");
  }
  if (!response.ok) {
    throw new OAuthError("invalid_client", `Client metadata document returned ${response.status}`);
  }

  const declaredLength = Number(response.headers.get("content-length"));
  if (declaredLength > CIMD_MAX_BYTES) {
    throw new OAuthError("invalid_client", "Client metadata document is too large");
  }
  const text = await response.text();
  if (text.length > CIMD_MAX_BYTES) {
    throw new OAuthError("invalid_client", "Client metadata document is too large");
  }

  let doc: Partial<ClientMetadataDocument>;
  try {
    doc = JSON.parse(text) as Partial<ClientMetadataDocument>;
  } catch {
    throw new OAuthError("invalid_client", "Client metadata document is not valid JSON");
  }

  if (doc.client_id !== clientId) {
    throw new OAuthError("invalid_client", "client_id in the metadata document does not match");
  }
  if (
    !Array.isArray(doc.redirect_uris) ||
    doc.redirect_uris.length === 0 ||
    !doc.redirect_uris.every((u) => typeof u === "string" && isAllowedRedirectUri(u))
  ) {
    throw new OAuthError("invalid_client", "Client metadata document has invalid redirect_uris");
  }
  return doc as ClientMetadataDocument;
}

async function upsertCimdClient(clientId: string, doc: ClientMetadataDocument): Promise<OAuthClient> {
  const db = getDb();
  const method: TokenAuthMethod =
    doc.token_endpoint_auth_method === "private_key_jwt" ? "private_key_jwt" : "none";
  const values = {
    clientName: optionalName(doc.client_name) ?? new URL(clientId).hostname,
    clientUri: optionalHttpsUrl(doc.client_uri),
    logoUri: optionalHttpsUrl(doc.logo_uri),
    jwksUri: optionalHttpsUrl(doc.jwks_uri),
    redirectUris: doc.redirect_uris,
    tokenEndpointAuthMethod: method,
    metadataFetchedAt: new Date(),
    updatedAt: new Date(),
  };
  const [row] = await db
    .insert(oauthClients)
    .values({ clientId, registrationType: "cimd", ...values })
    .onConflictDoUpdate({ target: oauthClients.clientId, set: values })
    .returning();
  return row!;
}

/**
 * Look up a client by ID. CIMD clients are fetched on first sight and
 * refreshed daily; a stale cached copy is used if the refresh fails.
 */
export async function resolveClient(clientId: string): Promise<OAuthClient | null> {
  if (!clientId || clientId.length > 512) return null;

  const db = getDb();
  const [existing] = await db
    .select()
    .from(oauthClients)
    .where(eq(oauthClients.clientId, clientId))
    .limit(1);

  if (!isCimdClientId(clientId)) return existing ?? null;

  const fresh =
    existing?.metadataFetchedAt &&
    Date.now() - existing.metadataFetchedAt.getTime() < CIMD_CACHE_SECONDS * 1000;
  if (existing && fresh) return existing;

  try {
    return await upsertCimdClient(clientId, await fetchClientMetadataDocument(clientId));
  } catch (error) {
    if (existing) return existing;
    throw error;
  }
}

export interface RegistrationRequest {
  redirect_uris?: unknown;
  client_name?: unknown;
  client_uri?: unknown;
  logo_uri?: unknown;
  token_endpoint_auth_method?: unknown;
  grant_types?: unknown;
  response_types?: unknown;
  scope?: unknown;
}

/** RFC 7591 dynamic client registration. Returns the registration response body. */
export async function registerClient(body: RegistrationRequest): Promise<Record<string, unknown>> {
  const redirectUris = body.redirect_uris;
  if (
    !Array.isArray(redirectUris) ||
    redirectUris.length === 0 ||
    redirectUris.length > 10 ||
    !redirectUris.every((u) => typeof u === "string" && u.length <= 2048)
  ) {
    throw new OAuthError("invalid_redirect_uri", "redirect_uris must be a non-empty array of URLs");
  }
  const invalid = (redirectUris as string[]).find((u) => !isAllowedRedirectUri(u));
  if (invalid) {
    throw new OAuthError("invalid_redirect_uri", `Redirect URI not allowed: ${invalid}`);
  }

  const requestedMethod = body.token_endpoint_auth_method ?? "none";
  if (
    requestedMethod !== "none" &&
    requestedMethod !== "client_secret_basic" &&
    requestedMethod !== "client_secret_post"
  ) {
    throw new OAuthError(
      "invalid_client_metadata",
      "token_endpoint_auth_method must be none, client_secret_basic, or client_secret_post"
    );
  }
  const method = requestedMethod as TokenAuthMethod;

  const grantTypes = Array.isArray(body.grant_types)
    ? (body.grant_types as unknown[]).filter((g): g is string => typeof g === "string")
    : ["authorization_code", "refresh_token"];
  if (!grantTypes.includes("authorization_code")) {
    throw new OAuthError("invalid_client_metadata", "grant_types must include authorization_code");
  }

  const clientId = randomToken(CLIENT_ID_PREFIX, 16);
  const clientSecret = method === "none" ? null : randomToken(CLIENT_SECRET_PREFIX);
  const clientName = optionalName(body.client_name);

  const db = getDb();
  const [row] = await db
    .insert(oauthClients)
    .values({
      clientId,
      clientSecretHash: clientSecret ? sha256Hex(clientSecret) : null,
      clientName,
      clientUri: optionalHttpsUrl(body.client_uri),
      logoUri: optionalHttpsUrl(body.logo_uri),
      redirectUris: redirectUris as string[],
      tokenEndpointAuthMethod: method,
      registrationType: "dcr",
    })
    .returning();

  return {
    client_id: row!.clientId,
    ...(clientSecret ? { client_secret: clientSecret, client_secret_expires_at: 0 } : {}),
    client_id_issued_at: Math.floor(row!.createdAt.getTime() / 1000),
    redirect_uris: row!.redirectUris,
    token_endpoint_auth_method: method,
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    ...(clientName ? { client_name: clientName } : {}),
    ...(row!.clientUri ? { client_uri: row!.clientUri } : {}),
    ...(row!.logoUri ? { logo_uri: row!.logoUri } : {}),
  };
}

export interface TokenRequestCredentials {
  clientId: string | undefined;
  clientSecret: string | undefined;
  clientAssertion: string | undefined;
  clientAssertionType: string | undefined;
  usedBasicAuth: boolean;
}

/** Pull client credentials from `Authorization: Basic` or the form body. */
export function extractClientCredentials(
  authorizationHeader: string | undefined,
  form: Record<string, string>
): TokenRequestCredentials {
  let clientId = form.client_id;
  let clientSecret = form.client_secret;
  let usedBasicAuth = false;

  if (authorizationHeader?.toLowerCase().startsWith("basic ")) {
    try {
      const decoded = Buffer.from(authorizationHeader.slice(6).trim(), "base64").toString("utf8");
      const separator = decoded.indexOf(":");
      if (separator > 0) {
        clientId = decodeURIComponent(decoded.slice(0, separator));
        clientSecret = decodeURIComponent(decoded.slice(separator + 1));
        usedBasicAuth = true;
      }
    } catch {
      // Fall through to invalid_client below.
    }
  }

  return {
    clientId,
    clientSecret,
    clientAssertion: form.client_assertion,
    clientAssertionType: form.client_assertion_type,
    usedBasicAuth,
  };
}

const JWT_BEARER_ASSERTION = "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";
const remoteJwks = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

async function verifyClientAssertion(client: OAuthClient, assertion: string): Promise<boolean> {
  if (!client.jwksUri) return false;
  let jwks = remoteJwks.get(client.jwksUri);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(client.jwksUri), { timeoutDuration: 5000 });
    remoteJwks.set(client.jwksUri, jwks);
  }
  try {
    await jwtVerify(assertion, jwks, {
      issuer: client.clientId,
      subject: client.clientId,
      audience: [getIssuer(), `${getIssuer()}/oauth/token`],
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Authenticate the client at the token/revocation endpoint according to how
 * it registered. Public clients (DCR `none`, Claude's CIMD) only need their
 * client_id — PKCE binds the code to them. A client_assertion, when sent,
 * must verify even though ChatGPT also accepts running as a public client.
 */
export async function authenticateClient(creds: TokenRequestCredentials): Promise<OAuthClient> {
  if (!creds.clientId) {
    throw new OAuthError("invalid_client", "client_id is required");
  }

  const client = await resolveClient(creds.clientId).catch(() => null);
  if (!client) {
    throw new OAuthError("invalid_client", "Unknown client", { basicAuth: creds.usedBasicAuth });
  }

  if (creds.clientAssertion) {
    if (creds.clientAssertionType !== JWT_BEARER_ASSERTION) {
      throw new OAuthError("invalid_client", "Unsupported client_assertion_type");
    }
    if (!(await verifyClientAssertion(client, creds.clientAssertion))) {
      throw new OAuthError("invalid_client", "client_assertion could not be verified");
    }
    return client;
  }

  if (client.clientSecretHash) {
    if (!creds.clientSecret || !safeEqual(sha256Hex(creds.clientSecret), client.clientSecretHash)) {
      throw new OAuthError("invalid_client", "Invalid client credentials", {
        basicAuth: creds.usedBasicAuth,
      });
    }
  }

  return client;
}

/** How the consent screen describes a client. */
export function describeClient(client: OAuthClient): {
  name: string;
  uri: string | null;
  logoUri: string | null;
  verifiedDomain: string | null;
} {
  // A CIMD client proved control of its client_id's domain by hosting the
  // document there; a DCR client_name is self-asserted.
  const verifiedDomain = client.registrationType === "cimd" ? new URL(client.clientId).hostname : null;
  return {
    name: client.clientName || verifiedDomain || "An application",
    uri: client.clientUri,
    logoUri: client.logoUri,
    verifiedDomain,
  };
}
