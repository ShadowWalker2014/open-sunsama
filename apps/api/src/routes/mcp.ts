/**
 * Remote MCP endpoint (Streamable HTTP, stateless): https://api.opensunsama.com/mcp
 *
 * Accepts an OAuth access token (Claude, ChatGPT, Cursor, ... via the
 * /oauth flow) or an API key (`X-API-Key` / `Bearer os_...`) for clients
 * configured the traditional way. Tool calls go through the same REST routes
 * as every other client, in-process, carrying the caller's own credential.
 */

import { Hono } from "hono";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createOpenSunsamaMcpServer } from "@open-sunsama/mcp/server";
import { authenticateRequest } from "../middleware/auth.js";
import { RESOURCE_SCOPES, getProtectedResourceMetadataUrl } from "../lib/oauth/config.js";

type InProcessFetch = (request: Request) => Response | Promise<Response>;

function unauthorized(error?: { code: string; description: string }): Response {
  const params = [
    `resource_metadata="${getProtectedResourceMetadataUrl()}"`,
    `scope="${RESOURCE_SCOPES.join(" ")}"`,
  ];
  if (error) {
    params.push(`error="${error.code}"`, `error_description="${error.description}"`);
  }
  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32001, message: error?.description ?? "Authentication required" },
      id: null,
    }),
    {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": `Bearer ${params.join(", ")}`,
      },
    }
  );
}

export function createMcpRouter(appFetch: InProcessFetch): Hono {
  const router = new Hono();

  router.post("/", async (c) => {
    const authorization = c.req.header("authorization");
    const apiKey = c.req.header("x-api-key");
    if (!authorization && !apiKey) return unauthorized();

    const principal = await authenticateRequest(authorization, apiKey).catch(() => null);
    if (!principal) {
      return unauthorized({ code: "invalid_token", description: "The access token is invalid or expired" });
    }

    const server = createOpenSunsamaMcpServer({
      baseUrl: "http://open-sunsama.internal",
      headers: {
        ...(authorization ? { Authorization: authorization } : {}),
        ...(apiKey ? { "X-API-Key": apiKey } : {}),
      },
      fetch: async (input, init) => appFetch(new Request(input, init)),
    });

    // Stateless: a fresh server + transport per request, JSON responses, no
    // session affinity needed across Railway replicas.
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    await server.connect(transport);
    try {
      return await transport.handleRequest(c.req.raw);
    } finally {
      void server.close();
    }
  });

  // No standalone SSE stream or sessions in stateless mode.
  const methodNotAllowed = () =>
    new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Method not allowed. Send JSON-RPC requests with POST." },
        id: null,
      }),
      { status: 405, headers: { "Content-Type": "application/json", Allow: "POST" } }
    );
  router.get("/", methodNotAllowed);
  router.delete("/", methodNotAllowed);

  return router;
}
