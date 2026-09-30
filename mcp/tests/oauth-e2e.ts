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
 *
 * Set MCP_E2E_DATABASE_URL to that stack's database to also seed synced
 * calendar events and check list_calendar_events / get_schedule_for_day
 * against them (there is no API to create synced events without a provider).
 */

import { createHash, randomBytes } from "node:crypto";
import { Client, StreamableHTTPClientTransport, UnauthorizedError } from "@modelcontextprotocol/client";
import type { OAuthClientProvider } from "@modelcontextprotocol/client";
import type {
  OAuthClientInformationMixed,
  OAuthClientMetadata,
  OAuthDiscoveryState,
  OAuthTokens,
} from "@modelcontextprotocol/client";

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

function toolText(result: { content?: unknown }): string {
  return ((result.content as Array<{ text?: string }>) ?? []).map((c) => c.text ?? "").join("\n");
}

// ---------------------------------------------------------------------------
// Calendar fixtures: a Tokyo user (UTC+9) with a Work and a Personal calendar
// ---------------------------------------------------------------------------

const CAL_DAY = "2030-01-15";

async function seedCalendar(session: string): Promise<boolean> {
  const dbUrl = process.env.MCP_E2E_DATABASE_URL;
  if (!dbUrl) return false;
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${session}` };
  await fetch(`${API}/auth/me`, { method: "PATCH", headers, body: JSON.stringify({ timezone: "Asia/Tokyo" }) });
  const me = await json(await fetch(`${API}/auth/me`, { headers }));
  const userId = me.data.id as string;

  const { SQL } = await import("bun");
  const db = new SQL(dbUrl);
  const [account] = await db`
    INSERT INTO calendar_accounts (user_id, provider, provider_account_id, email)
    VALUES (${userId}, 'google', ${"e2e-" + userId}, 'e2e@example.com') RETURNING id`;
  const calendar = async (name: string, enabled: boolean) =>
    (
      await db`
        INSERT INTO calendars (account_id, user_id, external_id, name, is_enabled)
        VALUES (${account.id}, ${userId}, ${name}, ${name}, ${enabled}) RETURNING id`
    )[0].id as string;
  const work = await calendar("Work", true);
  const personal = await calendar("Personal", true);
  const hidden = await calendar("Hidden", false);

  const event = (
    calendarId: string,
    title: string,
    start: string,
    end: string,
    extra: { allDay?: boolean; location?: string; description?: string; status?: string; response?: string } = {}
  ) => db`
    INSERT INTO calendar_events (calendar_id, user_id, external_id, title, description, location, start_time, end_time, is_all_day, status, response_status)
    VALUES (${calendarId}, ${userId}, ${title}, ${title}, ${extra.description ?? null}, ${extra.location ?? null},
            ${new Date(start)}, ${new Date(end)}, ${extra.allDay ?? false}, ${extra.status ?? "confirmed"}, ${extra.response ?? null})`;

  // 10:00-11:00 Tokyo on CAL_DAY.
  await event(work, "Design review", "2030-01-15T01:00:00Z", "2030-01-15T02:00:00Z", { location: "Room 4", description: "SECRET-DESCRIPTION" });
  await event(work, "Company offsite", "2030-01-15T00:00:00Z", "2030-01-16T00:00:00Z", { allDay: true });
  await event(work, "Skipped sync", "2030-01-15T06:00:00Z", "2030-01-15T06:30:00Z", { response: "declined" });
  await event(personal, "Dentist", "2030-01-15T08:00:00Z", "2030-01-15T09:00:00Z");
  await event(work, "Cancelled meeting", "2030-01-15T03:00:00Z", "2030-01-15T04:00:00Z", { status: "cancelled" });
  await event(hidden, "Hidden calendar event", "2030-01-15T02:00:00Z", "2030-01-15T03:00:00Z");
  // The day before in Tokyo: an all-day event, and 23:00-23:30 Tokyo (14:00Z).
  await event(work, "Yesterday holiday", "2030-01-14T00:00:00Z", "2030-01-15T00:00:00Z", { allDay: true });
  await event(work, "Late call", "2030-01-14T14:00:00Z", "2030-01-14T14:30:00Z");
  await db.close();
  return true;
}

// ---------------------------------------------------------------------------
// In-memory OAuth client provider for the SDK
// ---------------------------------------------------------------------------

class MemoryProvider implements OAuthClientProvider {
  info?: OAuthClientInformationMixed;
  savedTokens?: OAuthTokens;
  verifier?: string;
  savedDiscoveryState?: OAuthDiscoveryState;
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
  saveDiscoveryState(state: OAuthDiscoveryState) {
    this.savedDiscoveryState = state;
  }
  discoveryState() {
    return this.savedDiscoveryState;
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
  check("SDK saved discovery state for the callback", provider.savedDiscoveryState?.authorizationServerUrl === asm.issuer);
  await transport.finishAuth(callback.searchParams);
  check("tokens saved", !!provider.savedTokens?.access_token?.startsWith("osat_"));
  check("refresh token issued", !!provider.savedTokens?.refresh_token?.startsWith("osrt_"));

  transport = new StreamableHTTPClientTransport(MCP_URL, { authProvider: provider });
  client = new Client({ name: "oauth-e2e", version: "1.0.0" });
  await client.connect(transport);
  check("connected after auth", client.getServerVersion()?.name === "open-sunsama", client.getServerVersion());

  const { tools } = await client.listTools();
  check("lists all 47 tools", tools.length === 47, tools.length);
  check("OAuth grant includes ideas scopes", ["ideas:read", "ideas:write"].every((s) => provider.savedTokens?.scope?.split(" ").includes(s)), provider.savedTokens?.scope);
  check("every Ideas tool declares its OAuth scope", tools.filter((t) => t.name.includes("idea")).length === 23 && tools.filter((t) => t.name.includes("idea")).every((t) => JSON.stringify(t._meta?.securitySchemes).includes("ideas:")));
  check("delete_idea_board is destructive", tools.find((t) => t.name === "delete_idea_board")?.annotations?.destructiveHint === true);
  const calendarTool = tools.find((t) => t.name === "list_calendar_events");
  check("list_calendar_events is read-only", calendarTool?.annotations?.readOnlyHint === true, calendarTool?.annotations);
  check(
    "list_calendar_events needs calendar:read",
    JSON.stringify(calendarTool?._meta?.securitySchemes) === JSON.stringify([{ type: "oauth2", scopes: ["calendar:read"] }]),
    calendarTool?._meta
  );
  check("OAuth grant includes calendar:read", provider.savedTokens?.scope?.split(" ").includes("calendar:read") === true, provider.savedTokens?.scope);
  const createTask = tools.find((t) => t.name === "create_task");
  check(
    "create_task exposes a JSON Schema with a required string title",
    createTask?.inputSchema.type === "object" &&
      createTask.inputSchema.properties?.title?.type === "string" &&
      createTask.inputSchema.required?.includes("title") === true,
    createTask?.inputSchema
  );
  const invalidTask = await client.callTool({ name: "create_task", arguments: { title: 42 } });
  check("invalid tool arguments are rejected by the MCP server", invalidTask.isError === true, invalidTask);
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

  console.log("\nIdeas through the authenticated MCP client");
  async function ideaTool<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
    const response = await client.callTool({ name, arguments: args });
    if (response.isError) throw new Error(`${name}: ${toolText(response)}`);
    return JSON.parse(toolText(response)) as T;
  }
  type Board = { id: string; name: string; columns?: Array<{ id: string }> };
  type Column = { id: string; name: string; boardId: string };
  type Idea = { id: string; boardId: string; columnId: string; title: string; completedAt: string | null; promotedTaskId: string | null; subtaskCount?: number; subtaskDoneCount?: number };
  type Subtask = { id: string; title: string; completed: boolean };
  const board = await ideaTool<Board>("create_idea_board", { name: "MCP ideas E2E" });
  const board2 = await ideaTool<Board>("create_idea_board", { name: "MCP ideas second board" });
  check("create_idea_board seeds a column", !!board.id && board.columns?.length === 1, board);
  check("list_idea_boards returns both boards", (await ideaTool<Board[]>("list_idea_boards")).some((b) => b.id === board2.id));
  check("update_idea_board edits name and color", (await ideaTool<Board>("update_idea_board", { id: board.id, name: "MCP edited board", color: "#123ABC" })).name === "MCP edited board");
  check("reorder_idea_boards changes order", (await ideaTool<Board[]>("reorder_idea_boards", { boardIds: [board2.id, board.id] }))[0]?.id === board2.id);
  const firstColumn = board.columns![0]!.id;
  const column = await ideaTool<Column>("create_idea_column", { boardId: board.id, name: "Next" });
  check("create_idea_column places column on board", column.boardId === board.id);
  check("list_idea_columns returns both columns", (await ideaTool<Column[]>("list_idea_columns", { boardId: board.id })).length === 2);
  check("update_idea_column renames column", (await ideaTool<Column>("update_idea_column", { id: column.id, name: "Later" })).name === "Later");
  check("reorder_idea_columns changes order", (await ideaTool<Column[]>("reorder_idea_columns", { boardId: board.id, columnIds: [column.id, firstColumn] }))[0]?.id === column.id);
  const wrongColumnOrder = await client.callTool({ name: "reorder_idea_columns", arguments: { boardId: board.id, columnIds: [board2.columns![0]!.id, firstColumn] } });
  check("reorder_idea_columns rejects another board's column", wrongColumnOrder.isError === true && (await ideaTool<Column[]>("list_idea_columns", { boardId: board.id }))[0]?.id === column.id);
  const duplicateBoardOrder = await client.callTool({ name: "reorder_idea_boards", arguments: { boardIds: [board.id, board.id] } });
  check("reorder_idea_boards rejects duplicate IDs", duplicateBoardOrder.isError === true);
  const idea = await ideaTool<Idea>("create_idea", { boardId: board.id, columnId: firstColumn, title: "MCP card", notes: "Try the full flow", priority: "P1" });
  const idea2 = await ideaTool<Idea>("create_idea", { boardId: board.id, columnId: column.id, title: "Second card" });
  check("create_idea returns board and column", idea.boardId === board.id && idea.columnId === firstColumn);
  const otherSession = await createSession();
  const otherBoards = await mcpCall(otherSession, "tools/call", { name: "list_idea_boards", arguments: {} });
  check("another account cannot see the board", !JSON.stringify(otherBoards.body).includes(board.id), otherBoards.body);
  const otherEdit = await mcpCall(otherSession, "tools/call", { name: "update_idea_board", arguments: { id: board.id, name: "Unauthorized" } });
  check("another account cannot edit the board", otherEdit.body.result?.isError === true, otherEdit.body);
  const wrongBoard = await client.callTool({ name: "create_idea", arguments: { boardId: board2.id, columnId: firstColumn, title: "Wrong board" } });
  check("create_idea rejects a column from another board", wrongBoard.isError === true);
  check("list_ideas filters by column", (await ideaTool<Idea[]>("list_ideas", { columnId: firstColumn })).some((i) => i.id === idea.id));
  check("update_idea moves and edits card", (await ideaTool<Idea>("update_idea", { id: idea.id, title: "Edited MCP card", columnId: column.id })).columnId === column.id);
  check("reorder_ideas sets destination order", (await ideaTool<Idea[]>("reorder_ideas", { columnId: column.id, ideaIds: [idea2.id, idea.id] })).slice(0, 2).map((i) => i.id).join() === [idea2.id, idea.id].join());
  const missingIdea = await client.callTool({ name: "reorder_ideas", arguments: { columnId: column.id, ideaIds: [idea.id] } });
  check("reorder_ideas rejects an incomplete destination order", missingIdea.isError === true);
  check("update_idea completes card", !!(await ideaTool<Idea>("update_idea", { id: idea.id, completedAt: new Date().toISOString() })).completedAt);
  check("list_ideas filters completed cards", (await ideaTool<Idea[]>("list_ideas", { boardId: board.id, completed: true })).some((i) => i.id === idea.id));
  check("update_idea reopens card", (await ideaTool<Idea>("update_idea", { id: idea.id, completedAt: null })).completedAt === null);
  const subtask = await ideaTool<Subtask>("create_idea_subtask", { ideaId: idea.id, title: "First step" });
  const subtask2 = await ideaTool<Subtask>("create_idea_subtask", { ideaId: idea.id, title: "Second step" });
  check("create_idea_subtask returns ID", !!subtask.id);
  check("list_idea_subtasks returns both items", (await ideaTool<Subtask[]>("list_idea_subtasks", { ideaId: idea.id })).length === 2);
  check("update_idea_subtask completes item", (await ideaTool<Subtask>("update_idea_subtask", { ideaId: idea.id, id: subtask.id, completed: true })).completed);
  check("reorder_idea_subtasks changes order", (await ideaTool<Subtask[]>("reorder_idea_subtasks", { ideaId: idea.id, subtaskIds: [subtask2.id, subtask.id] }))[0]?.id === subtask2.id);
  const missingSubtask = await client.callTool({ name: "reorder_idea_subtasks", arguments: { ideaId: idea.id, subtaskIds: [subtask.id] } });
  check("reorder_idea_subtasks rejects an incomplete order", missingSubtask.isError === true);
  check("list_ideas includes checklist counts", (await ideaTool<Idea[]>("list_ideas", { boardId: board.id })).find((i) => i.id === idea.id)?.subtaskDoneCount === 1);
  check("get_idea returns its checklist", (await ideaTool<{ subtasks: Subtask[] }>("get_idea", { id: idea.id })).subtasks.length === 2);
  type Bulk = { results: Array<{ success: boolean; data?: { id: string; columns?: Array<{ id: string }> } }> };
  const bulkBoards = await ideaTool<Bulk>("bulk_ideas", { operations: [{ action: "create_board", data: { name: "Bulk board" } }, { action: "create_board", data: { name: "Bulk board two" } }] });
  check("bulk creates boards", bulkBoards.results.every((r) => r.success) && bulkBoards.results.length === 2);
  const bulkBoard = bulkBoards.results[0]!.data!;
  const bulkCards = await ideaTool<Bulk>("bulk_ideas", { operations: [
    { action: "create_idea", data: { boardId: bulkBoard.id, columnId: bulkBoard.columns![0]!.id, title: "Bulk card" } },
    { action: "create_column", data: { boardId: bulkBoard.id, name: "Bulk column" } },
  ] });
  check("bulk creates cards and columns", bulkCards.results.every((r) => r.success));
  const bulkCardId = bulkCards.results[0]!.data!.id;
  const bulkColumnId = bulkCards.results[1]!.data!.id;
  const bulkSubtask = await ideaTool<Bulk>("bulk_ideas", { operations: [
    { action: "update_board", id: bulkBoard.id, data: { name: "Updated bulk board" } },
    { action: "update_column", id: bulkColumnId, data: { name: "Updated bulk column" } },
    { action: "update_idea", id: bulkCardId, data: { columnId: bulkColumnId, priority: "P0" } },
    { action: "create_subtask", ideaId: bulkCardId, data: { title: "Bulk checklist" } },
  ] });
  check("bulk edits and moves cards", bulkSubtask.results.every((r) => r.success));
  const bulkSubtaskId = bulkSubtask.results[3]!.data!.id;
  const bulkEdit = await ideaTool<Bulk>("bulk_ideas", { operations: [{ action: "update_subtask", ideaId: bulkCardId, id: bulkSubtaskId, data: { completed: true } }] });
  check("bulk edits checklist", bulkEdit.results[0]?.success === true);
  const partial = await client.callTool({ name: "bulk_ideas", arguments: { operations: [
    { action: "update_idea", id: "00000000-0000-0000-0000-000000000000", data: { title: "Missing" } },
    { action: "update_idea", id: bulkCardId, data: { title: "Survives a partial failure" } },
  ] } });
  const partialData = JSON.parse((partial.content as Array<{ text: string }>)[0]!.text) as Bulk;
  check("bulk reports per-item failure and preserves successes", partial.isError === true && !partialData.results[0]?.success && partialData.results[1]?.success === true);
  const deniedBulk = await mcpCall(otherSession, "tools/call", { name: "bulk_ideas", arguments: { operations: [{ action: "delete_board", id: bulkBoard.id }] } });
  check("bulk respects account ownership", deniedBulk.body.result?.isError === true);
  const bulkDelete = await ideaTool<Bulk>("bulk_ideas", { operations: [
    { action: "delete_subtask", ideaId: bulkCardId, id: bulkSubtaskId },
    { action: "delete_idea", id: bulkCardId },
    { action: "delete_column", id: bulkColumnId },
    ...bulkBoards.results.map((r) => ({ action: "delete_board", id: r.data!.id })),
  ] });
  check("bulk deletes every entity type", bulkDelete.results.every((r) => r.success));
  const promoted = await ideaTool<{ idea: Idea; task: { id: string; title: string } }>("promote_idea", { id: idea.id });
  const again = await ideaTool<{ task: { id: string } }>("promote_idea", { id: idea.id });
  check("promotion retries return the same task", again.task.id === promoted.task.id);
  check("promote_idea creates a task and links it", promoted.idea.promotedTaskId === promoted.task.id && promoted.task.title === "Edited MCP card");
  check("delete_idea_subtask removes item", (await ideaTool<string>("delete_idea_subtask", { ideaId: idea.id, id: subtask.id })) === "Subtask deleted successfully");
  check("delete_idea removes card", (await ideaTool<string>("delete_idea", { id: idea2.id })) === "Idea deleted successfully");
  check("delete_idea_column removes column and its card", (await ideaTool<string>("delete_idea_column", { id: column.id })) === "Column deleted successfully" && !(await ideaTool<Idea[]>("list_ideas", { boardId: board.id })).some((i) => i.id === idea.id));
  check("delete_idea_board removes board", (await ideaTool<string>("delete_idea_board", { id: board.id })) === "Board deleted successfully");
  await ideaTool<string>("delete_idea_board", { id: board2.id });
  const promotedTask = await client.callTool({ name: "get_task", arguments: { id: promoted.task.id } });
  check("deleting the idea keeps its promoted task", !promotedTask.isError);
  await client.callTool({ name: "delete_task", arguments: { id: promoted.task.id } });

  console.log("\nCalendar events");
  const seeded = await seedCalendar(session);
  if (!seeded) {
    const empty = toolText(await client.callTool({ name: "list_calendar_events", arguments: { date: CAL_DAY } }));
    check("list_calendar_events with no calendars", empty.startsWith("No calendar events"), empty);
    const day = toolText(await client.callTool({ name: "get_schedule_for_day", arguments: { date: CAL_DAY } }));
    check("get_schedule_for_day has both sections", day.includes("CALENDAR EVENTS") && day.includes("No calendar events.") && day.includes("TIME BLOCKS"), day);
    console.log("  (set MCP_E2E_DATABASE_URL to seed events and run the full calendar checks)");
  } else {
    const dayResult = await client.callTool({ name: "list_calendar_events", arguments: { date: CAL_DAY } });
    const day = toolText(dayResult);
    check("list_calendar_events succeeds", !dayResult.isError, day);
    check("times are in the user's timezone", day.includes("(times in Asia/Tokyo)") && day.includes("10:00 - 11:00: Design review [Work] @ Room 4"), day);
    check("all-day event on the day is listed first", day.split("\n")[1] === "All day: Company offsite [Work]", day);
    check("declined event is marked", day.includes("Skipped sync [Work] (declined)"), day);
    check("events from every enabled calendar", day.includes("17:00 - 18:00: Dentist [Personal]"), day);
    check("previous local day's events are excluded", !day.includes("Yesterday holiday") && !day.includes("Late call"), day);
    check("cancelled events are excluded", !day.includes("Cancelled meeting"), day);
    check("disabled calendars are excluded", !day.includes("Hidden calendar event"), day);
    check("descriptions are never returned", !day.includes("SECRET-DESCRIPTION"), day);

    const range = toolText(await client.callTool({ name: "list_calendar_events", arguments: { from: "2030-01-14", to: CAL_DAY } }));
    check(
      "range groups events by local day",
      range.includes("2030-01-14:\n  All day: Yesterday holiday [Work]\n  23:00 - 23:30: Late call [Work]") && range.includes(`${CAL_DAY}:`),
      range
    );
    const personalOnly = toolText(await client.callTool({ name: "list_calendar_events", arguments: { date: CAL_DAY, calendars: ["personal"] } }));
    check("calendar filter by name", personalOnly.includes("Dentist") && !personalOnly.includes("Design review"), personalOnly);
    const tooLong = await client.callTool({ name: "list_calendar_events", arguments: { from: "2030-01-01", to: "2030-03-01" } });
    check("ranges over 31 days are refused", tooLong.isError === true, tooLong.content);

    await client.callTool({
      name: "create_time_block",
      arguments: { title: "Deep work", date: CAL_DAY, startTime: "13:00", endTime: "15:00" },
    });
    const schedule = toolText(await client.callTool({ name: "get_schedule_for_day", arguments: { date: CAL_DAY } }));
    const eventsAt = schedule.indexOf("CALENDAR EVENTS");
    const blocksAt = schedule.indexOf("TIME BLOCKS");
    check(
      "get_schedule_for_day shows events and time blocks in separate sections",
      eventsAt >= 0 && blocksAt > eventsAt &&
        schedule.slice(eventsAt, blocksAt).includes("10:00 - 11:00: Design review") &&
        schedule.slice(blocksAt).includes("13:00 - 15:00: Deep work"),
      schedule
    );

    const rest = await fetch(`${API}/calendar-events?date=${CAL_DAY}`, { headers: { Authorization: `Bearer ${provider.savedTokens!.access_token}` } });
    const restBody = await json(rest);
    check("REST GET /calendar-events?date= uses local days", rest.status === 200 && restBody.data?.length === 5 && restBody.meta?.timezone === "Asia/Tokyo", restBody);
    const writeEvent = await fetch(`${API}/calendar-events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${provider.savedTokens!.access_token}` },
      body: JSON.stringify({ calendarId: "x", title: "x" }),
    });
    check("OAuth token cannot write calendar events", writeEvent.status === 403, writeEvent.status);
  }
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
  for (const path of ["/notifications/preferences", "/calendar/accounts", "/attachments"]) {
    const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${newAccess}` } });
    check(`OAuth token refused on ${path}`, res.status === 403, res.status);
  }
  const ideasRest = await fetch(`${API}/ideas/boards`, { headers: { Authorization: `Bearer ${newAccess}` } });
  check("OAuth token can read Ideas through REST", ideasRest.status === 200, ideasRest.status);
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

  console.log("\nIdeas scope isolation");
  async function scopedToken(scope: string): Promise<string> {
    const p = pkce();
    const url = new URL(`${API}/oauth/authorize`);
    Object.entries({ response_type: "code", client_id: manualId, redirect_uri: REDIRECT, code_challenge: p.challenge, code_challenge_method: "S256", state: "ideas", resource: MCP_URL.toString(), scope }).forEach(([k, v]) => url.searchParams.set(k, v));
    const callback = await consent(url, session);
    const token = await tokenRequest({ grant_type: "authorization_code", code: callback.searchParams.get("code")!, client_id: manualId, redirect_uri: REDIRECT, code_verifier: p.verifier, resource: MCP_URL.toString() });
    if (token.status !== 200) throw new Error(`scoped token failed: ${JSON.stringify(token.body)}`);
    return token.body.access_token as string;
  }
  const ideasRead = await scopedToken("ideas:read");
  const scopedList = await mcpCall(ideasRead, "tools/call", { name: "list_idea_boards", arguments: {} });
  check("ideas:read token can list boards", scopedList.body.result?.isError !== true && scopedList.status === 200, scopedList.body);
  const scopedCreate = await mcpCall(ideasRead, "tools/call", { name: "create_idea_board", arguments: { name: "Should fail" } });
  check("ideas:read token cannot create boards", scopedCreate.body.result?.isError === true, scopedCreate.body);
  const ideasWrite = await scopedToken("ideas:write");
  const writeCreate = await mcpCall(ideasWrite, "tools/call", { name: "create_idea_board", arguments: { name: "Ideas write scope" } });
  const writeBoard = JSON.parse(writeCreate.body.result?.content?.[0]?.text ?? "null") as Board | null;
  check("ideas:write token can create boards", !!writeBoard?.id, writeCreate.body);
  const writeList = await mcpCall(ideasWrite, "tools/call", { name: "list_idea_boards", arguments: {} });
  check("ideas:write token cannot list boards", writeList.body.result?.isError === true, writeList.body);
  const writeIdea = await mcpCall(ideasWrite, "tools/call", { name: "create_idea", arguments: { boardId: writeBoard!.id, columnId: writeBoard!.columns![0]!.id, title: "Promotion scope" } });
  const promoteIdeaId = JSON.parse(writeIdea.body.result?.content?.[0]?.text ?? "null")?.id as string;
  const forbiddenPromotion = await mcpCall(ideasWrite, "tools/call", { name: "promote_idea", arguments: { id: promoteIdeaId } });
  check("promote_idea requires tasks:write as well", forbiddenPromotion.body.result?.isError === true && !JSON.stringify(forbiddenPromotion.body).includes("taskId"), forbiddenPromotion.body);
  const removeScopedBoard = await mcpCall(ideasWrite, "tools/call", { name: "delete_idea_board", arguments: { id: writeBoard!.id } });
  check("ideas:write token can delete boards", removeScopedBoard.body.result?.isError !== true, removeScopedBoard.body);

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
      const noCalendar = await mcpCall(t.body.access_token, "tools/call", { name: "list_calendar_events", arguments: { date: today } });
      check(`${cimd.name}: calendar tool without calendar:read explains how to reconnect`, noCalendar.body.result?.isError === true && JSON.stringify(noCalendar.body).includes("connect it again"), noCalendar.body);
      const noIdeas = await mcpCall(t.body.access_token, "tools/call", { name: "list_idea_boards", arguments: {} });
      check(`${cimd.name}: Ideas tool outside granted scope is refused`, noIdeas.body.result?.isError === true && JSON.stringify(noIdeas.body).includes("Insufficient permissions"), noIdeas.body);
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
      body: JSON.stringify({ name: "MCP e2e", scopes: ["tasks:read", "tasks:write", "time-blocks:read", "time-blocks:write", "ideas:read", "ideas:write", "user:read", "user:write"] }),
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
  // A second, independent SDK client exercises the deployed HTTP transport
  // with the traditional API-key header (as in a configured desktop agent).
  const keyClient = new Client({ name: "api-key-e2e", version: "1.0.0" });
  try {
    await keyClient.connect(new StreamableHTTPClientTransport(MCP_URL, {
      requestInit: { headers: { "X-API-Key": apiKey } },
    }));
    const keyTools = (await keyClient.listTools()).tools;
    check(
      "API-key SDK client lists the same tools as OAuth",
      JSON.stringify(keyTools.map((t) => t.name).sort()) === JSON.stringify(tools.map((t) => t.name).sort()),
      keyTools.length
    );
    const keyTasks = await keyClient.callTool({ name: "list_tasks", arguments: { date: today } });
    check("API-key SDK client lists tasks", !keyTasks.isError, keyTasks.content);
    const keyProfile = await keyClient.callTool({ name: "get_user_profile", arguments: {} });
    check("API-key SDK client reads profile", !keyProfile.isError && toolText(keyProfile).includes("mcp-e2e-"), keyProfile.content);
    const keyBoard = await keyClient.callTool({ name: "create_idea_board", arguments: { name: "SDK API key board" } });
    const boardId = JSON.parse(toolText(keyBoard))?.id as string | undefined;
    check("API-key SDK client creates Ideas board", !keyBoard.isError && !!boardId, keyBoard.content);
    const keyBoards = await keyClient.callTool({ name: "list_idea_boards", arguments: {} });
    check("API-key SDK client lists Ideas board", !keyBoards.isError && toolText(keyBoards).includes(boardId!), keyBoards.content);
    const keyDelete = await keyClient.callTool({ name: "delete_idea_board", arguments: { id: boardId } });
    check("API-key SDK client deletes Ideas board", !keyDelete.isError, keyDelete.content);
  } finally {
    await keyClient.close();
  }
  const keyBoardResult = await mcpCall(apiKey, "tools/call", { name: "create_idea_board", arguments: { name: "API key board" } });
  const keyBoard = JSON.parse(keyBoardResult.body.result?.content?.[0]?.text ?? "null") as { id: string } | null;
  check("API key can create Ideas board", !!keyBoard?.id, keyBoardResult.body);
  const keyBoardList = await mcpCall(apiKey, "tools/call", { name: "list_idea_boards", arguments: {} });
  check("API key can list Ideas boards", JSON.stringify(keyBoardList.body).includes(keyBoard!.id), keyBoardList.body);
  const keyBoardDelete = await mcpCall(apiKey, "tools/call", { name: "delete_idea_board", arguments: { id: keyBoard!.id } });
  check("API key can delete Ideas board", keyBoardDelete.body.result?.isError !== true, keyBoardDelete.body);
  check("bad bearer → 401", (await mcpCall("osat_bogus", "tools/list")).status === 401);

  console.log("\nGrants from before calendar:read existed");
  {
    const cimdClaude = { clientId: "https://claude.ai/oauth/mcp-oauth-client-metadata", redirect: "https://claude.ai/api/mcp/auth_callback" };
    const p = pkce();
    const url = new URL(`${API}/oauth/authorize`);
    Object.entries({ response_type: "code", client_id: cimdClaude.clientId, redirect_uri: cimdClaude.redirect, code_challenge: p.challenge, code_challenge_method: "S256", state: "s2", resource: MCP_URL.toString(), scope: "time-blocks:read tasks:read" }).forEach(([k, v]) => url.searchParams.set(k, v));
    const cb = await consent(url, session);
    const t = await tokenRequest({ grant_type: "authorization_code", code: cb.searchParams.get("code")!, client_id: cimdClaude.clientId, redirect_uri: cimdClaude.redirect, code_verifier: p.verifier, resource: MCP_URL.toString() });
    const schedule = await mcpCall(t.body.access_token, "tools/call", { name: "get_schedule_for_day", arguments: { date: CAL_DAY } });
    const text = JSON.stringify(schedule.body);
    check("get_schedule_for_day still works without calendar:read", schedule.body.result?.isError !== true && text.includes("TIME BLOCKS"), schedule.body);
    check("…and says how to add calendar access", text.includes("Not included") && text.includes("calendar:read"), schedule.body);
    const restNoScope = await fetch(`${API}/calendar-events?date=${CAL_DAY}`, { headers: { Authorization: `Bearer ${t.body.access_token}` } });
    check("REST GET /calendar-events without calendar:read → 403", restNoScope.status === 403, restNoScope.status);
  }

  console.log("\nAPI keys and calendar:read");
  for (const [label, scopes, expected] of [
    ["calendar:read key reads events", ["calendar:read"], 200],
    ["legacy user:read key still reads events", ["user:read"], 200],
    ["tasks-only key is refused", ["tasks:read"], 401],
  ] as const) {
    const key = (await json(
      await fetch(`${API}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session}` },
        body: JSON.stringify({ name: label, scopes }),
      })
    )).data?.key as string;
    const res = await fetch(`${API}/calendar-events?date=${CAL_DAY}`, { headers: { "X-API-Key": key } });
    check(label, res.status === expected, res.status);
  }
  check("GET /mcp → 405", (await fetch(MCP_URL)).status === 405);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
