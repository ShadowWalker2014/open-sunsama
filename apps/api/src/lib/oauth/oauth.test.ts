/**
 * Unit tests for the MCP OAuth server's pure helpers: redirect URI rules,
 * CIMD client IDs, resource/scope normalization, PKCE, and the consent JWT.
 * The full flow is covered end to end by mcp/tests/oauth-e2e.ts.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { createHash } from "node:crypto";
import type * as ClientsModule from "./clients.js";
import type * as ConfigModule from "./config.js";
import type * as CryptoModule from "./crypto.js";
import type * as ConsentModule from "./consent.js";

process.env.API_URL = "https://api.example.com/";
process.env.JWT_SECRET = "test-secret-key-for-oauth-tests-min-32-chars";

let clients: typeof ClientsModule;
let config: typeof ConfigModule;
let crypto: typeof CryptoModule;
let consent: typeof ConsentModule;

beforeAll(async () => {
  clients = await import("./clients.js");
  config = await import("./config.js");
  crypto = await import("./crypto.js");
  consent = await import("./consent.js");
});

describe("isAllowedRedirectUri", () => {
  it.each([
    "https://claude.ai/api/mcp/auth_callback",
    "https://chatgpt.com/connector_platform_oauth_redirect",
    "http://localhost/callback",
    "http://127.0.0.1:33418/",
    "http://[::1]:8080/cb",
    "cursor://anysphere.cursor-retrieval/oauth/callback",
  ])("allows %s", (uri) => {
    expect(clients.isAllowedRedirectUri(uri)).toBe(true);
  });

  it.each([
    "http://evil.example/callback",
    "javascript:alert(1)",
    "data:text/html,hi",
    "file:///etc/passwd",
    "https://app.example/cb#fragment",
    "not a url",
  ])("rejects %s", (uri) => {
    expect(clients.isAllowedRedirectUri(uri)).toBe(false);
  });
});

describe("redirectUriMatches", () => {
  it("requires an exact match for https", () => {
    const registered = ["https://claude.ai/api/mcp/auth_callback"];
    expect(clients.redirectUriMatches(registered, "https://claude.ai/api/mcp/auth_callback")).toBe(true);
    expect(clients.redirectUriMatches(registered, "https://claude.ai/api/mcp/auth_callback/")).toBe(false);
    expect(clients.redirectUriMatches(registered, "https://claude.ai/api/mcp/auth_callback?x=1")).toBe(false);
  });

  it("ignores the port for loopback redirects (RFC 8252)", () => {
    const registered = ["http://localhost/callback", "http://127.0.0.1/callback"];
    expect(clients.redirectUriMatches(registered, "http://localhost:53172/callback")).toBe(true);
    expect(clients.redirectUriMatches(registered, "http://127.0.0.1:9000/callback")).toBe(true);
    expect(clients.redirectUriMatches(registered, "http://localhost:53172/other")).toBe(false);
    expect(clients.redirectUriMatches(["http://127.0.0.1/callback"], "http://localhost:1/callback")).toBe(false);
  });

  it("never port-matches non-loopback http", () => {
    expect(clients.redirectUriMatches(["http://example.com/cb"], "http://example.com:8080/cb")).toBe(false);
  });
});

describe("isCimdClientId", () => {
  it("accepts https URLs with a path", () => {
    expect(clients.isCimdClientId("https://claude.ai/oauth/mcp-oauth-client-metadata")).toBe(true);
    expect(clients.isCimdClientId("https://chatgpt.com/oauth/client.json")).toBe(true);
  });

  it("rejects DCR ids, bare origins, http, and fragments", () => {
    expect(clients.isCimdClientId("osc_abc123")).toBe(false);
    expect(clients.isCimdClientId("https://claude.ai/")).toBe(false);
    expect(clients.isCimdClientId("http://claude.ai/oauth/meta")).toBe(false);
    expect(clients.isCimdClientId("https://claude.ai/meta#x")).toBe(false);
  });
});

describe("config", () => {
  it("derives issuer and resource from API_URL without the trailing slash", () => {
    expect(config.getIssuer()).toBe("https://api.example.com");
    expect(config.getMcpResource()).toBe("https://api.example.com/mcp");
    expect(config.getProtectedResourceMetadataUrl()).toBe(
      "https://api.example.com/.well-known/oauth-protected-resource/mcp"
    );
  });

  it("normalizes the resource parameter", () => {
    expect(config.normalizeResource(undefined)).toBeNull();
    expect(config.normalizeResource("https://api.example.com/mcp")).toBe("https://api.example.com/mcp");
    expect(config.normalizeResource("https://api.example.com/mcp/")).toBe("https://api.example.com/mcp");
    expect(config.normalizeResource("https://api.example.com")).toBe("https://api.example.com/mcp");
    expect(config.normalizeResource("https://other.example.com/mcp")).toBeUndefined();
  });

  it("keeps known scopes and defaults to every resource scope", () => {
    expect(config.resolveRequestedScopes("tasks:read offline_access")).toEqual(["tasks:read", "offline_access"]);
    expect(config.resolveRequestedScopes("openid email")).toEqual([...config.RESOURCE_SCOPES]);
    expect(config.resolveRequestedScopes(undefined)).toEqual([...config.RESOURCE_SCOPES]);
    expect(config.resolveRequestedScopes("offline_access")).toEqual([...config.RESOURCE_SCOPES, "offline_access"]);
  });
});

describe("verifyPkceS256", () => {
  const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
  const challenge = createHash("sha256").update(verifier).digest("base64url");

  it("accepts the matching verifier", () => {
    expect(crypto.verifyPkceS256(verifier, challenge)).toBe(true);
  });

  it("rejects a different or malformed verifier", () => {
    expect(crypto.verifyPkceS256(verifier.replace("d", "e"), challenge)).toBe(false);
    expect(crypto.verifyPkceS256("too-short", challenge)).toBe(false);
  });
});

describe("consent request", () => {
  it("round-trips and rejects tampering", () => {
    const signed = consent.signConsentRequest({
      clientId: "osc_x",
      redirectUri: "https://claude.ai/api/mcp/auth_callback",
      codeChallenge: "c".repeat(43),
      scopes: ["tasks:read"],
      resource: "https://api.example.com/mcp",
      state: "s",
    });
    expect(consent.verifyConsentRequest(signed)?.clientId).toBe("osc_x");
    expect(consent.verifyConsentRequest(`${signed}x`)).toBeNull();
  });
});
