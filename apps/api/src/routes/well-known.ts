/**
 * OAuth discovery documents for the remote MCP endpoint.
 *
 * - RFC 9728 protected resource metadata, served both at the path-suffixed
 *   location for /mcp and at the root, so every client's probe order works.
 * - RFC 8414 authorization server metadata (issuer has no path).
 */

import { Hono } from "hono";
import {
  MCP_DOCS_URL,
  RESOURCE_SCOPES,
  SUPPORTED_SCOPES,
  getIssuer,
  getMcpResource,
} from "../lib/oauth/config.js";

export const wellKnownRouter = new Hono();

const CACHE = { "Cache-Control": "public, max-age=300" };

function protectedResourceMetadata() {
  return {
    resource: getMcpResource(),
    authorization_servers: [getIssuer()],
    scopes_supported: RESOURCE_SCOPES,
    bearer_methods_supported: ["header"],
    resource_name: "Open Sunsama",
    resource_documentation: MCP_DOCS_URL,
  };
}

wellKnownRouter.get("/oauth-protected-resource", (c) => c.json(protectedResourceMetadata(), 200, CACHE));
wellKnownRouter.get("/oauth-protected-resource/mcp", (c) =>
  c.json(protectedResourceMetadata(), 200, CACHE)
);

wellKnownRouter.get("/oauth-authorization-server", (c) => {
  const issuer = getIssuer();
  const authMethods = ["none", "client_secret_basic", "client_secret_post", "private_key_jwt"];
  return c.json(
    {
      issuer,
      authorization_endpoint: `${issuer}/oauth/authorize`,
      token_endpoint: `${issuer}/oauth/token`,
      registration_endpoint: `${issuer}/oauth/register`,
      revocation_endpoint: `${issuer}/oauth/revoke`,
      response_types_supported: ["code"],
      response_modes_supported: ["query"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: authMethods,
      token_endpoint_auth_signing_alg_values_supported: ["RS256", "ES256", "PS256", "EdDSA"],
      revocation_endpoint_auth_methods_supported: authMethods,
      scopes_supported: SUPPORTED_SCOPES,
      client_id_metadata_document_supported: true,
      authorization_response_iss_parameter_supported: true,
      service_documentation: MCP_DOCS_URL,
    },
    200,
    CACHE
  );
});
