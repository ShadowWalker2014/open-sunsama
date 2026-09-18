/**
 * OAuth 2.1 authorization server for the remote MCP endpoint.
 *
 *   GET  /oauth/authorize          → validates, then hands off to the web app's consent screen
 *   GET  /oauth/consent            → consent screen reads what is being requested (public)
 *   POST /oauth/consent            → signed-in user approves/denies (JWT session only)
 *   POST /oauth/token              → authorization_code + refresh_token grants
 *   POST /oauth/register           → RFC 7591 dynamic client registration
 *   POST /oauth/revoke             → RFC 7009 token revocation
 *   GET/DELETE /oauth/connections  → "Connected apps" in Settings
 */

import { Hono, type Context } from "hono";
import { jwtAuth, type AuthVariables } from "../middleware/auth.js";
import {
  getIssuer,
  getWebAppUrl,
  normalizeResource,
  resolveRequestedScopes,
  RESOURCE_SCOPES,
} from "../lib/oauth/config.js";
import {
  authenticateClient,
  describeClient,
  extractClientCredentials,
  redirectUriMatches,
  registerClient,
  resolveClient,
  type RegistrationRequest,
} from "../lib/oauth/clients.js";
import { signConsentRequest, verifyConsentRequest } from "../lib/oauth/consent.js";
import { OAuthError } from "../lib/oauth/errors.js";
import {
  createAuthorizationCode,
  exchangeAuthorizationCode,
  listConnections,
  refreshAccessToken,
  revokeConnection,
  revokeToken,
} from "../lib/oauth/tokens.js";

export const oauthRouter = new Hono<{ Variables: AuthVariables }>();

const NO_STORE = { "Cache-Control": "no-store", Pragma: "no-cache" };

function oauthErrorResponse(c: Context, error: unknown): Response {
  if (error instanceof OAuthError) {
    const headers: Record<string, string> = { ...NO_STORE };
    if (error.status === 401 && error.basicAuth) {
      headers["WWW-Authenticate"] = 'Basic realm="Open Sunsama"';
    }
    return c.json(error.toJSON(), error.status as 400 | 401, headers);
  }
  console.error("[OAuth] Unexpected error:", error);
  return c.json(
    { error: "server_error", error_description: "Unexpected error" },
    500,
    NO_STORE
  );
}

/** Token and revocation requests are form-encoded (RFC 6749 §4.1.3); tolerate JSON too. */
async function readForm(c: Context): Promise<Record<string, string>> {
  const contentType = c.req.header("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(body).filter((entry): entry is [string, string] => typeof entry[1] === "string")
    );
  }
  const text = await c.req.text();
  return Object.fromEntries(new URLSearchParams(text));
}

/** Redirect back to the client with RFC 9207 `iss` on every response. */
function buildClientRedirect(
  redirectUri: string,
  params: Record<string, string | null | undefined>
): string {
  const url = new URL(redirectUri);
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) url.searchParams.set(key, value);
  }
  url.searchParams.set("iss", getIssuer());
  return url.toString();
}

/** Errors we must not redirect (unknown client / bad redirect_uri) render on the consent page. */
function consentErrorRedirect(c: Context, error: string, description: string): Response {
  const url = new URL(`${getWebAppUrl()}/oauth/consent`);
  url.searchParams.set("error", error);
  url.searchParams.set("error_description", description);
  return c.redirect(url.toString(), 302);
}

// ---------------------------------------------------------------------------
// Authorization endpoint
// ---------------------------------------------------------------------------

oauthRouter.get("/authorize", async (c) => {
  const q = c.req.query();
  const clientId = q.client_id;
  if (!clientId) {
    return consentErrorRedirect(c, "invalid_request", "The app did not identify itself (missing client_id).");
  }

  let client;
  try {
    client = await resolveClient(clientId);
  } catch (error) {
    const description = error instanceof OAuthError ? error.message : "Could not load the app's details.";
    return consentErrorRedirect(c, "invalid_client", description);
  }
  if (!client) {
    return consentErrorRedirect(
      c,
      "invalid_client",
      "This app isn't registered with Open Sunsama. Remove the connector and add it again."
    );
  }

  const redirectUri =
    q.redirect_uri ?? (client.redirectUris.length === 1 ? client.redirectUris[0] : undefined);
  if (!redirectUri || !redirectUriMatches(client.redirectUris, redirectUri)) {
    return consentErrorRedirect(
      c,
      "invalid_request",
      "The app's redirect address doesn't match its registration."
    );
  }

  // From here on, errors go back to the client (RFC 6749 §4.1.2.1).
  const state = q.state ?? null;
  const fail = (error: string, description: string) =>
    c.redirect(buildClientRedirect(redirectUri, { error, error_description: description, state }), 302);

  if (q.response_type !== "code") {
    return fail("unsupported_response_type", "Only response_type=code is supported");
  }
  if (!q.code_challenge || q.code_challenge_method !== "S256") {
    return fail("invalid_request", "PKCE with code_challenge_method=S256 is required");
  }
  if (!/^[A-Za-z0-9\-._~]{43,128}$/.test(q.code_challenge)) {
    return fail("invalid_request", "Malformed code_challenge");
  }
  const resource = normalizeResource(q.resource);
  if (resource === undefined) {
    return fail("invalid_target", `Unknown resource. Use ${getIssuer()}/mcp`);
  }

  const request = signConsentRequest({
    clientId: client.clientId,
    redirectUri,
    codeChallenge: q.code_challenge,
    scopes: resolveRequestedScopes(q.scope),
    resource,
    state,
  });
  return c.redirect(`${getWebAppUrl()}/oauth/consent?request=${encodeURIComponent(request)}`, 302);
});

// ---------------------------------------------------------------------------
// Consent (called by the web app)
// ---------------------------------------------------------------------------

oauthRouter.get("/consent", async (c) => {
  const request = verifyConsentRequest(c.req.query("request") ?? "");
  if (!request) {
    return c.json(
      { error: "invalid_request", error_description: "This authorization link has expired. Start connecting again from the app." },
      400
    );
  }
  const client = await resolveClient(request.clientId).catch(() => null);
  if (!client) {
    return c.json({ error: "invalid_client", error_description: "Unknown app" }, 400);
  }
  return c.json({
    client: describeClient(client),
    redirectHost: new URL(request.redirectUri).host || new URL(request.redirectUri).protocol,
    scopes: request.scopes.filter((s) => RESOURCE_SCOPES.includes(s)),
    offlineAccess: true,
  });
});

oauthRouter.post("/consent", jwtAuth, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { request?: string; decision?: string };
  const request = verifyConsentRequest(body.request ?? "");
  if (!request) {
    return c.json(
      { error: "invalid_request", error_description: "This authorization link has expired. Start connecting again from the app." },
      400
    );
  }

  // Re-check: the client could have changed since the request was signed.
  const client = await resolveClient(request.clientId).catch(() => null);
  if (!client || !redirectUriMatches(client.redirectUris, request.redirectUri)) {
    return c.json({ error: "invalid_client", error_description: "Unknown app" }, 400);
  }

  if (body.decision !== "allow") {
    return c.json({
      redirectTo: buildClientRedirect(request.redirectUri, {
        error: "access_denied",
        error_description: "The user denied access",
        state: request.state,
      }),
    });
  }

  const code = await createAuthorizationCode({
    clientId: client.clientId,
    userId: c.get("userId"),
    redirectUri: request.redirectUri,
    codeChallenge: request.codeChallenge,
    scopes: request.scopes,
    resource: request.resource,
  });
  return c.json({
    redirectTo: buildClientRedirect(request.redirectUri, { code, state: request.state }),
  });
});

// ---------------------------------------------------------------------------
// Token endpoint
// ---------------------------------------------------------------------------

oauthRouter.post("/token", async (c) => {
  try {
    const form = await readForm(c);
    const client = await authenticateClient(
      extractClientCredentials(c.req.header("authorization"), form)
    );

    let tokens;
    if (form.grant_type === "authorization_code") {
      tokens = await exchangeAuthorizationCode({
        code: form.code,
        clientId: client.clientId,
        redirectUri: form.redirect_uri,
        codeVerifier: form.code_verifier,
        resource: form.resource,
      });
    } else if (form.grant_type === "refresh_token") {
      tokens = await refreshAccessToken({
        refreshToken: form.refresh_token,
        clientId: client.clientId,
        scope: form.scope,
        resource: form.resource,
      });
    } else {
      throw new OAuthError("unsupported_grant_type", "Supported grants: authorization_code, refresh_token");
    }
    return c.json(tokens, 200, NO_STORE);
  } catch (error) {
    return oauthErrorResponse(c, error);
  }
});

// ---------------------------------------------------------------------------
// Dynamic client registration
// ---------------------------------------------------------------------------

// Registration is unauthenticated by design (RFC 7591), so cap how many
// clients one IP can create. Real MCP clients register once per connection.
const REGISTRATIONS_PER_HOUR = 30;
const registrationLog = new Map<string, number[]>();

function allowRegistration(ip: string): boolean {
  const cutoff = Date.now() - 60 * 60 * 1000;
  const recent = (registrationLog.get(ip) ?? []).filter((t) => t > cutoff);
  if (recent.length >= REGISTRATIONS_PER_HOUR) {
    registrationLog.set(ip, recent);
    return false;
  }
  recent.push(Date.now());
  registrationLog.set(ip, recent);
  if (registrationLog.size > 10_000) {
    for (const [key, times] of registrationLog) {
      if (times.every((t) => t <= cutoff)) registrationLog.delete(key);
    }
  }
  return true;
}

oauthRouter.post("/register", async (c) => {
  const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || c.req.header("x-real-ip") || "unknown";
  if (!allowRegistration(ip)) {
    return c.json(
      { error: "slow_down", error_description: "Too many client registrations. Try again later." },
      429,
      NO_STORE
    );
  }
  try {
    const body = (await c.req.json().catch(() => null)) as RegistrationRequest | null;
    if (!body || typeof body !== "object") {
      throw new OAuthError("invalid_client_metadata", "Request body must be a JSON object");
    }
    return c.json(await registerClient(body), 201, NO_STORE);
  } catch (error) {
    return oauthErrorResponse(c, error);
  }
});

// ---------------------------------------------------------------------------
// Revocation
// ---------------------------------------------------------------------------

oauthRouter.post("/revoke", async (c) => {
  try {
    const form = await readForm(c);
    const client = await authenticateClient(
      extractClientCredentials(c.req.header("authorization"), form)
    );
    if (form.token) await revokeToken(form.token, client.clientId);
    // RFC 7009 §2.2: respond 200 even for unknown tokens.
    return c.body(null, 200, NO_STORE);
  } catch (error) {
    return oauthErrorResponse(c, error);
  }
});

// ---------------------------------------------------------------------------
// Connected apps (Settings)
// ---------------------------------------------------------------------------

oauthRouter.get("/connections", jwtAuth, async (c) => {
  return c.json({ success: true, data: await listConnections(c.get("userId")) });
});

oauthRouter.delete("/connections/:clientId", jwtAuth, async (c) => {
  const revoked = await revokeConnection(c.get("userId"), c.req.param("clientId"));
  return c.json({ success: true, data: { revoked } });
});
