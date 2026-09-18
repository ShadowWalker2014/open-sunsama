/**
 * End-to-end test of the remote MCP server's OAuth flow, driven by the
 * official MCP SDK client (the same code path Claude Code and Cursor use).
 *
 * Covers: discovery, dynamic client registration, PKCE authorize → consent →
 * token, tool listing + calls, refresh rotation and replay detection,
 * revocation, CIMD clients (Claude, Claude Code, ChatGPT), and API keys.
 *
 * Needs a running API that can issue sessions for a throwaway account, so run
 * it against a local stack, never production:
 *   MCP_E2E_API_URL=http://localhost:3101 bun run tests/oauth-e2e.ts
 */

import { createHash, randomBytes } from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { UnauthorizedError } from "@modelcontextprotocol/sdk/client/auth.js";
import type { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import type {
  OAuthClientInformationMixed,
  OAuthClientMetadata,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";

const API = (process.env.MCP_E2E_API_URL ?? "http://localhost:3101").replace(/\/$/, "");
const MCP_URL = new URL(`${API}/mcp`);
const REDIRECT = "http://127.0.0.1:8976/callback";

let passed = 0;
let failed = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  if (ok) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}`, detail ?? "");
  }
}

async function json(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// ---------------------------------------------------------------------------
// Test account + consent helper (stands in for the user clicking "Allow")
// ---------------------------------------------------------------------------

async function createSession(): Promise<string> {
  const email = `mcp-e2e-${Date.now()}@example.com`;
  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "Correct-Horse-9", name: "MCP E2E" }),
  });
  const body = await json(res);
  if (!body?.data?.token) throw new Error(`register failed: ${JSON.stringify(body)}`);
  return body.data.token as string;
}

/** Follow /oauth/authorize to the consent hand-off, then approve or deny as the user. */
async function consent(
  authorizationUrl: URL,
  session: string,
  decision: "allow" | "deny" = "allow"
): Promise<URL> {
  const res = await fetch(authorizationUrl, { redirect: "manual" });
  const location = res.headers.get("location");
  if (res.status !== 302 || !location) {
    throw new Error(`authorize did not redirect: ${res.status} ${await res.text()}`);
  }
  const consentUrl = new URL(location);
  const request = consentUrl.searchParams.get("request");
  if (!request) throw new Error(`no consent request in ${location}`);

  const details = await json(await fetch(`${API}/oauth/consent?request=${encodeURIComponent(request)}`));
  if (!details?.client?.name) throw new Error(`consent details failed: ${JSON.stringify(details)}`);

  const approve = await fetch(`${API}/oauth/consent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session}` },
    body: JSON.stringify({ request, decision }),
  });
  const body = await json(approve);
  if (!body?.redirectTo) throw new Error(`consent failed: ${JSON.stringify(body)}`);
  return new URL(body.redirectTo);
}

function pkce() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

async function tokenRequest(params: Record<string, string>, headers: Record<string, string> = {}) {
  const res = await fetch(`${API}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", ...headers },
    body: new URLSearchParams(params),
  });
  return { status: res.status, body: await json(res), headers: res.headers };
}

async function mcpCall(token: string, method: string, params: unknown = {}, id = 1) {
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${token}`,
      "Mcp-Protocol-Version": "2025-06-18",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });
  return { status: res.status, body: await json(res), headers: res.headers };
}

// ---------------------------------------------------------------------------
// In-memory OAuth client provider for the SDK
// ---------------------------------------------------------------------------

class MemoryProvider implements OAuthClientProvider {
  info?: OAuthClientInformationMixed;
  savedTokens?: OAuthTokens;
  verifier?: string;
  lastAuthorizationUrl?: URL;

  get redirectUrl() {
    return REDIRECT;
  }
  get clientMetadata(): OAuthClientMetadata {
    return {
      client_name: "Open Sunsama E2E",
      redirect_uris: [REDIRECT],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    };
  }
  clientInformation() {
    return this.info;
  }
  saveClientInformation(info: OAuthClientInformationMixed) {
    this.info = info;
  }
  tokens() {
    return this.savedTokens;
  }
  saveTokens(tokens: OAuthTokens) {
    this.savedTokens = tokens;
  }
  redirectToAuthorization(url: URL) {
    this.lastAuthorizationUrl = url;
  }
  saveCodeVerifier(v: string) {
    this.verifier = v;
  }
  codeVerifier() {
    if (!this.verifier) throw new Error("no verifier");
    return this.verifier;
  }
}

// ---------------------------------------------------------------------------

async function main() {
  console.log(`Remote MCP OAuth e2e against ${API}\n`);
  const session = await createSession();

  console.log("Discovery");
  const unauth = await fetch(MCP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }),
  });
  const challenge = unauth.headers.get("www-authenticate") ?? "";
  check("unauthenticated /mcp returns 401", unauth.status === 401, unauth.status);
  check(
    "WWW-Authenticate points at protected resource metadata",
    challenge.includes(`resource_metadata="${API}/.well-known/oauth-protected-resource/mcp"`),
    challenge
  );
  const prm = await json(await fetch(`${API}/.well-known/oauth-protected-resource/mcp`));
  check("PRM resource is the MCP URL", prm.resource === MCP_URL.toString(), prm.resource);
  check("PRM root path serves the same document", (await json(await fetch(`${API}/.well-known/oauth-protected-resource`))).resource === prm.resource);
  const asm = await json(await fetch(`${API}/.well-known/oauth-authorization-server`));
  check("issuer matches PRM authorization_servers[0]", asm.issuer === prm.authorization_servers[0]);
  check("S256 PKCE advertised", asm.code_challenge_methods_supported?.includes("S256"));
  check("CIMD advertised with none auth", asm.client_id_metadata_document_supported === true && asm.token_endpoint_auth_methods_supported.includes("none"));
  check("RFC 9207 iss advertised", asm.authorization_response_iss_parameter_supported === true);
  check("offline_access advertised", asm.scopes_supported.includes("offline_access"));

  console.log("\nSDK client: DCR + authorization code + PKCE");
  const provider = new MemoryProvider();
  let transport = new StreamableHTTPClientTransport(MCP_URL, { authProvider: provider });
  let client = new Client({ name: "oauth-e2e", version: "1.0.0" });
  let threw: unknown;
  try {
    await client.connect(transport);
  } catch (error) {
    threw = error;
  }
  check("first connect asks for authorization", threw instanceof UnauthorizedError, threw);
  check("client registered dynamically", typeof provider.info?.client_id === "string" && provider.info.client_id.startsWith("osc_"), provider.info);
  const authUrl = provider.lastAuthorizationUrl!;
  check("authorize URL carries resource param", authUrl.searchParams.get("resource") === MCP_URL.toString(), authUrl.toString());

  const callback = await consent(authUrl, session);
  check("callback has code", !!callback.searchParams.get("code"));
  check("callback has iss (RFC 9207)", callback.searchParams.get("iss") === asm.issuer);
  check("callback echoes state", callback.searchParams.get("state") === authUrl.searchParams.get("state"));
  await transport.finishAuth(callback.searchParams.get("code")!);
  check("tokens saved", !!provider.savedTokens?.access_token?.startsWith("osat_"));
  check("refresh token issued", !!provider.savedTokens?.refresh_token?.startsWith("osrt_"));

  transport = new StreamableHTTPClientTransport(MCP_URL, { authProvider: provider });
  client = new Client({ name: "oauth-e2e", version: "1.0.0" });
  await client.connect(transport);
  check("connected after auth", client.getServerVersion()?.name === "open-sunsama", client.getServerVersion());

  const { tools } = await client.listTools();
  check("lists all 23 tools", tools.length === 23, tools.length);
  const createTask = tools.find((t) => t.name === "create_task");
  check("tools carry titles", tools.every((t) => typeof t.title === "string" && t.title.length > 0));
  check(
    "tools carry required annotations",
    tools.every(
      (t) =>
        typeof t.annotations?.readOnlyHint === "boolean" &&
        typeof t.annotations?.destructiveHint === "boolean" &&
        typeof t.annotations?.openWorldHint === "boolean"
    )
  );
  check("delete_task is destructive", tools.find((t) => t.name === "delete_task")?.annotations?.destructiveHint === true);
  check("list_tasks is read-only", tools.find((t) => t.name === "list_tasks")?.annotations?.readOnlyHint === true);
  check(
    "securitySchemes in _meta",
    JSON.stringify(createTask?._meta?.securitySchemes) === JSON.stringify([{ type: "oauth2", scopes: ["tasks:write"] }]),
    createTask?._meta
  );

  const today = new Date().toISOString().slice(0, 10);
  const created = await client.callTool({
    name: "create_task",
    arguments: { title: "Ship OAuth MCP connector", scheduledDate: today, priority: "P1" },
  });
  const createdText = (created.content as Array<{ text: string }>)[0]?.text ?? "";
  const taskId = createdText.match(/ID: ([0-9a-f-]{36})/)?.[1];
  check("create_task works through OAuth", !created.isError && !!taskId, createdText);

  const listed = await client.callTool({ name: "list_tasks", arguments: { date: today } });
  check("list_tasks sees the new task", JSON.stringify(listed.content).includes("Ship OAuth MCP connector"));
  const done = await client.callTool({ name: "complete_task", arguments: { id: taskId } });
  check("complete_task works", !done.isError, done.content);
  const profile = await client.callTool({ name: "get_user_profile", arguments: {} });
  check("get_user_profile works", JSON.stringify(profile.content).includes("mcp-e2e-"), profile.content);
  await client.close();

  console.log("\nRefresh rotation");
  const clientId = provider.info!.client_id;
  const firstRefresh = provider.savedTokens!.refresh_token!;
  const refreshed = await tokenRequest({ grant_type: "refresh_token", refresh_token: firstRefresh, client_id: clientId });
  check("refresh returns new pair", refreshed.status === 200 && refreshed.body.refresh_token !== firstRefresh, refreshed.body);
  check("token response is no-store", refreshed.headers.get("cache-control") === "no-store");
  const newAccess = refreshed.body.access_token as string;
  check("new access token works on /mcp", (await mcpCall(newAccess, "tools/list")).status === 200);
  const replay = await tokenRequest({ grant_type: "refresh_token", refresh_token: firstRefresh, client_id: clientId });
  check("replayed refresh token → invalid_grant", replay.status === 400 && replay.body.error === "invalid_grant", replay.body);
  check("benign race keeps the grant alive", (await mcpCall(newAccess, "tools/list")).status === 200);
  const wrongClient = await tokenRequest({ grant_type: "refresh_token", refresh_token: refreshed.body.refresh_token, client_id: "osc_nope" });
  check("refresh with unknown client → invalid_client", wrongClient.status === 401 && wrongClient.body.error === "invalid_client", wrongClient.body);

  console.log("\nREST API accepts the OAuth token with its scopes");
  const rest = await fetch(`${API}/tasks?date=${today}`, { headers: { Authorization: `Bearer ${newAccess}` } });
  check("GET /tasks with OAuth token", rest.status === 200, rest.status);
  const apiKeys = await fetch(`${API}/api-keys`, { headers: { Authorization: `Bearer ${newAccess}` } });
  check("OAuth token cannot manage API keys", apiKeys.status === 401 || apiKeys.status === 403, apiKeys.status);
  const approveWithOauth = await fetch(`${API}/oauth/consent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${newAccess}` },
    body: JSON.stringify({ request: "x", decision: "allow" }),
  });
  check("OAuth token cannot approve new grants", approveWithOauth.status === 401, approveWithOauth.status);
  for (const path of ["/notifications/preferences", "/calendar/accounts", "/attachments", "/ideas/boards"]) {
    const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${newAccess}` } });
    check(`OAuth token refused on ${path}`, res.status === 403, res.status);
  }
  const profilePatch = await fetch(`${API}/auth/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${newAccess}` },
    body: JSON.stringify({ timezone: "America/New_York" }),
  });
  check("OAuth token with user:write can update profile", profilePatch.status === 200, profilePatch.status);

  console.log("\nConnected apps + revocation");
  const connections = await json(await fetch(`${API}/oauth/connections`, { headers: { Authorization: `Bearer ${session}` } }));
  check("connection listed in settings", connections.data?.some((c: { clientId: string }) => c.clientId === clientId), connections);
  const revoked = await json(
    await fetch(`${API}/oauth/connections/${encodeURIComponent(clientId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session}` },
    })
  );
  check("disconnect revokes tokens", revoked.data?.revoked >= 1, revoked);
  const afterRevoke = await mcpCall(newAccess, "tools/list");
  check("revoked token → 401 invalid_token", afterRevoke.status === 401 && (afterRevoke.headers.get("www-authenticate") ?? "").includes('error="invalid_token"'));
  const refreshAfterRevoke = await tokenRequest({ grant_type: "refresh_token", refresh_token: refreshed.body.refresh_token, client_id: clientId });
  check("revoked refresh token → invalid_grant", refreshAfterRevoke.body.error === "invalid_grant", refreshAfterRevoke.body);

  console.log("\nAuthorization code protections");
  const reg = await json(
    await fetch(`${API}/oauth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_name: "Manual test", redirect_uris: [REDIRECT] }),
    })
  );
  const manualId = reg.client_id as string;
  const { verifier, challenge: codeChallenge } = pkce();
  const authorize = (extra: Record<string, string> = {}) => {
    const url = new URL(`${API}/oauth/authorize`);
    const params: Record<string, string> = {
      response_type: "code",
      client_id: manualId,
      redirect_uri: REDIRECT,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state: "xyz",
      resource: MCP_URL.toString(),
      ...extra,
    };
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    return url;
  };

  const badRedirect = await fetch(authorize({ redirect_uri: "https://evil.example/cb" }), { redirect: "manual" });
  const badRedirectLocation = badRedirect.headers.get("location") ?? "";
  check("unregistered redirect_uri is not redirected to", !badRedirectLocation.startsWith("https://evil.example"), badRedirectLocation);
  const noPkce = await fetch(authorize({ code_challenge_method: "plain" }), { redirect: "manual" });
  check("plain PKCE rejected back to client", (noPkce.headers.get("location") ?? "").includes("error=invalid_request"));
  const badResource = await fetch(authorize({ resource: "https://other.example/mcp" }), { redirect: "manual" });
  check("foreign resource → invalid_target", (badResource.headers.get("location") ?? "").includes("error=invalid_target"));

  const denied = await consent(authorize(), session, "deny");
  check("deny → access_denied with state + iss", denied.searchParams.get("error") === "access_denied" && denied.searchParams.get("state") === "xyz" && !!denied.searchParams.get("iss"));

  const approved = await consent(authorize(), session);
  const code = approved.searchParams.get("code")!;
  const wrongVerifier = await tokenRequest({ grant_type: "authorization_code", code, client_id: manualId, redirect_uri: REDIRECT, code_verifier: pkce().verifier });
  check("wrong PKCE verifier → invalid_grant", wrongVerifier.body.error === "invalid_grant", wrongVerifier.body);
  const good = await tokenRequest({ grant_type: "authorization_code", code, client_id: manualId, redirect_uri: REDIRECT, code_verifier: verifier, resource: MCP_URL.toString() });
  // The failed attempt above did not consume the code; this exchange must succeed.
  check("correct verifier exchanges code", good.status === 200 && !!good.body.access_token, good.body);
  const reused = await tokenRequest({ grant_type: "authorization_code", code, client_id: manualId, redirect_uri: REDIRECT, code_verifier: verifier });
  check("code reuse → invalid_grant", reused.body.error === "invalid_grant", reused.body);
  check("code reuse revokes tokens it minted", (await mcpCall(good.body.access_token, "tools/list")).status === 401);

  console.log("\nConfidential DCR client (client_secret_basic)");
  const conf = await json(
    await fetch(`${API}/oauth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_name: "Confidential", redirect_uris: ["https://app.example/cb"], token_endpoint_auth_method: "client_secret_basic" }),
    })
  );
  check("secret issued", typeof conf.client_secret === "string");
  const p2 = pkce();
  const confAuth = new URL(`${API}/oauth/authorize`);
  Object.entries({ response_type: "code", client_id: conf.client_id, redirect_uri: "https://app.example/cb", code_challenge: p2.challenge, code_challenge_method: "S256" }).forEach(([k, v]) => confAuth.searchParams.set(k, v));
  const confCode = (await consent(confAuth, session)).searchParams.get("code")!;
  const noSecret = await tokenRequest({ grant_type: "authorization_code", code: confCode, client_id: conf.client_id, redirect_uri: "https://app.example/cb", code_verifier: p2.verifier });
  check("missing secret → invalid_client", noSecret.status === 401 && noSecret.body.error === "invalid_client", noSecret.body);
  const basic = Buffer.from(`${conf.client_id}:${conf.client_secret}`).toString("base64");
  const withSecret = await tokenRequest(
    { grant_type: "authorization_code", code: confCode, redirect_uri: "https://app.example/cb", code_verifier: p2.verifier },
    { Authorization: `Basic ${basic}` }
  );
  check("basic auth exchanges code", withSecret.status === 200, withSecret.body);

  console.log("\nCIMD clients (real metadata documents)");
  const cimdCases = [
    { name: "Claude (claude.ai)", clientId: "https://claude.ai/oauth/mcp-oauth-client-metadata", redirect: "https://claude.ai/api/mcp/auth_callback", sendAs: "none" },
    { name: "Claude Code (loopback, any port)", clientId: "https://claude.ai/oauth/claude-code-client-metadata", redirect: "http://localhost:53172/callback", sendAs: "none" },
    { name: "ChatGPT (public client fallback)", clientId: "https://chatgpt.com/oauth/client.json", redirect: "https://chatgpt.com/connector_platform_oauth_redirect", sendAs: "none" },
  ];
  for (const cimd of cimdCases) {
    const p = pkce();
    const url = new URL(`${API}/oauth/authorize`);
    Object.entries({ response_type: "code", client_id: cimd.clientId, redirect_uri: cimd.redirect, code_challenge: p.challenge, code_challenge_method: "S256", state: "s1", resource: MCP_URL.toString(), scope: "tasks:read tasks:write offline_access" }).forEach(([k, v]) => url.searchParams.set(k, v));
    try {
      const cb = await consent(url, session);
      check(`${cimd.name}: redirected to its callback`, cb.toString().startsWith(cimd.redirect), cb.toString());
      const t = await tokenRequest({ grant_type: "authorization_code", code: cb.searchParams.get("code")!, client_id: cimd.clientId, redirect_uri: cimd.redirect, code_verifier: p.verifier, resource: MCP_URL.toString() });
      check(`${cimd.name}: token exchange`, t.status === 200 && t.body.scope === "tasks:read tasks:write offline_access", t.body);
      const list = await mcpCall(t.body.access_token, "tools/call", { name: "list_tasks", arguments: { date: today } });
      check(`${cimd.name}: tool call with granted scope`, list.status === 200 && !list.body.result?.isError, list.body);
      const noScope = await mcpCall(t.body.access_token, "tools/call", { name: "list_time_blocks", arguments: { date: today } });
      check(`${cimd.name}: tool outside granted scope is refused`, noScope.body.result?.isError === true && JSON.stringify(noScope.body).includes("Insufficient permissions"), noScope.body);
      const restWrite = await fetch(`${API}/time-blocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t.body.access_token}` },
        body: JSON.stringify({ title: "x", date: today, startTime: "09:00", endTime: "10:00" }),
      });
      check(`${cimd.name}: REST write outside scope → 403`, restWrite.status === 403, restWrite.status);
    } catch (error) {
      check(`${cimd.name}: flow`, false, error);
    }
  }
  const forgedAssertion = await tokenRequest({
    grant_type: "refresh_token",
    refresh_token: "osrt_x",
    client_id: "https://chatgpt.com/oauth/client.json",
    client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion: "eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJ4In0.sig",
  });
  check("forged private_key_jwt assertion → invalid_client", forgedAssertion.body.error === "invalid_client", forgedAssertion.body);

  console.log("\nAPI key on the remote endpoint (traditional clients)");
  const keyRes = await json(
    await fetch(`${API}/api-keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session}` },
      body: JSON.stringify({ name: "MCP e2e", scopes: ["tasks:read", "tasks:write", "time-blocks:read", "time-blocks:write", "user:read", "user:write"] }),
    })
  );
  const apiKey = keyRes.data?.key as string;
  check("API key created", typeof apiKey === "string" && apiKey.startsWith("os_"), keyRes);
  const viaHeader = await fetch(MCP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", "X-API-Key": apiKey },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "list_tasks", arguments: { date: today } } }),
  });
  check("X-API-Key works on /mcp", viaHeader.status === 200 && !(await json(viaHeader)).result?.isError);
  check("Bearer os_ API key works on /mcp", (await mcpCall(apiKey, "tools/list")).status === 200);
  check("bad bearer → 401", (await mcpCall("osat_bogus", "tools/list")).status === 401);
  check("GET /mcp → 405", (await fetch(MCP_URL)).status === 405);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
