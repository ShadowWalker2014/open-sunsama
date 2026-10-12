/**
 * Tests for the API client, focused on the 401 -> token-refresh -> retry
 * interceptor that keeps a session alive when the access token lapses.
 *
 * POST is used for the counting tests so the assertions aren't affected by
 * ky's method-based retrying of idempotent (GET) requests.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { createServer, type Server } from "node:http";
import { createOpenSunsamaClient } from "./client.js";
import { createAuthApi } from "./auth.js";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("createOpenSunsamaClient — 401 auto-refresh", () => {
  it("refreshes the token and retries once on 401, then succeeds", async () => {
    const seen: Array<string | null> = [];

    const customFetch = vi.fn(async (input: RequestInfo | URL) => {
      const req = input as Request;
      const auth = req.headers.get("Authorization");
      seen.push(auth);
      if (auth === "Bearer old-token") {
        return jsonResponse(401, { success: false });
      }
      return jsonResponse(200, { success: true, data: { ok: true } });
    }) as unknown as typeof fetch;

    let currentToken = "old-token";
    const onUnauthorized = vi.fn(async () => {
      currentToken = "fresh-token";
      return currentToken;
    });

    const client = createOpenSunsamaClient({
      baseUrl: "https://api.test",
      getToken: () => currentToken,
      onUnauthorized,
      customFetch,
    });

    const result = await client.post<{ data: { ok: boolean } }>("things", {
      hello: "world",
    });

    expect(result.data.ok).toBe(true);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    // First attempt with the stale token, retry with the refreshed one.
    expect(seen[0]).toBe("Bearer old-token");
    expect(seen[1]).toBe("Bearer fresh-token");
  });

  it("does not loop forever when refresh yields a token that still 401s", async () => {
    const customFetch = vi.fn(async () =>
      jsonResponse(401, { success: false })
    ) as unknown as typeof fetch;

    const onUnauthorized = vi.fn(async () => "still-bad-token");

    const client = createOpenSunsamaClient({
      baseUrl: "https://api.test",
      getToken: () => "old-token",
      onUnauthorized,
      customFetch,
    });

    await expect(client.post("things", {})).rejects.toBeDefined();
    // Refresh attempted exactly once; the retryCount guard prevents another.
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(customFetch).toHaveBeenCalledTimes(2);
  });

  it("does not refresh when no onUnauthorized handler is provided", async () => {
    const customFetch = vi.fn(async () =>
      jsonResponse(401, { success: false })
    ) as unknown as typeof fetch;

    const client = createOpenSunsamaClient({
      baseUrl: "https://api.test",
      token: "old-token",
      customFetch,
    });

    await expect(client.post("things", {})).rejects.toBeDefined();
    expect(customFetch).toHaveBeenCalledTimes(1);
  });
});

describe("createAuthApi — profile updates", () => {
  it("sends preference updates through the configured fetch transport", async () => {
    const customFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = new Request(input, init);
      expect(request.method).toBe("PATCH");
      expect(request.url).toBe("https://api.test/auth/me");
      expect(request.headers.get("Authorization")).toBe("Bearer token");
      expect(await request.json()).toEqual({
        preferences: {
          themeMode: "dark",
          colorTheme: "default",
          fontFamily: "geist",
        },
      });
      return jsonResponse(200, {
        success: true,
        data: { id: "user-1", preferences: { themeMode: "dark" } },
      });
    }) as unknown as typeof fetch;

    const client = createOpenSunsamaClient({
      baseUrl: "https://api.test",
      token: "token",
      customFetch,
    });

    const user = await createAuthApi(client).updateMe({
      preferences: {
        themeMode: "dark",
        colorTheme: "default",
        fontFamily: "geist",
      },
    });

    expect(user.preferences).toEqual({ themeMode: "dark" });
    expect(customFetch).toHaveBeenCalledTimes(1);
  });
});

// A real HTTP server is the only reliable way to prove that the *body* of a
// POST survives the forced retry — this guards against a consumed-body
// regression (replaying an already-sent Request would lose the body).
describe("createOpenSunsamaClient — 401 retry preserves request body", () => {
  let server: Server;

  afterEach(() => {
    server?.close();
  });

  it("resends the JSON body and the refreshed token on the retried POST", async () => {
    const received: Array<{ auth: string | null; body: string }> = [];

    server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (c) => chunks.push(c as Buffer));
      req.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        const auth = req.headers["authorization"] ?? null;
        received.push({ auth, body });
        if (auth === "Bearer old-token") {
          res.writeHead(401, { "content-type": "application/json" });
          res.end(JSON.stringify({ success: false }));
          return;
        }
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ success: true, data: { echoed: body } }));
      });
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    const baseUrl =
      typeof address === "object" && address
        ? `http://127.0.0.1:${address.port}`
        : "";

    let token = "old-token";
    const client = createOpenSunsamaClient({
      baseUrl,
      getToken: () => token,
      onUnauthorized: async () => {
        token = "new-token";
        return token;
      },
    });

    const payload = { name: "hello", count: 42 };
    const result = await client.post<{ data: { echoed: string } }>(
      "things",
      payload
    );

    // Two hits: the 401 with the stale token, then the retry with the fresh one.
    expect(received).toHaveLength(2);
    expect(received[0]?.auth).toBe("Bearer old-token");
    expect(received[1]?.auth).toBe("Bearer new-token");
    // The retried request carried the full body, not an empty/consumed stream.
    expect(JSON.parse(received[1]!.body)).toEqual(payload);
    expect(JSON.parse(result.data.echoed)).toEqual(payload);
  });
});
