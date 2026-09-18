#!/usr/bin/env node

/**
 * Open Sunsama MCP Server
 *
 * A Model Context Protocol server that enables AI agents to manage tasks,
 * time blocks, and calendars through the Open Sunsama API.
 *
 * Most users should connect the hosted server instead — no API key needed:
 *   https://api.opensunsama.com/mcp  (OAuth; see https://opensunsama.com/docs/mcp/overview)
 *
 * Usage:
 *   OPENSUNSAMA_API_KEY=os_xxx open-sunsama-mcp
 *   OPENSUNSAMA_API_KEY=os_xxx OPENSUNSAMA_API_URL=http://localhost:3001 open-sunsama-mcp (for self-hosted/local)
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createOpenSunsamaMcpServer } from "./server.js";

// Configuration from environment variables
const API_KEY = process.env.OPENSUNSAMA_API_KEY;
const API_URL = process.env.OPENSUNSAMA_API_URL || "https://api.opensunsama.com";

// Validate required configuration
if (!API_KEY) {
  console.error("Error: OPENSUNSAMA_API_KEY environment variable is required");
  console.error("");
  console.error("Usage:");
  console.error("  OPENSUNSAMA_API_KEY=os_xxx open-sunsama-mcp");
  console.error("");
  console.error("You can get an API key from the Open Sunsama web app:");
  console.error("  Settings → API Keys → Generate New Key");
  process.exit(1);
}

const server = createOpenSunsamaMcpServer({
  baseUrl: API_URL,
  apiKey: API_KEY,
});

// Log to stderr (safe for stdio transport)
console.error(`Open Sunsama MCP Server starting...`);
console.error(`API URL: ${API_URL}`);
console.error(`API Key: ${API_KEY.substring(0, 10)}...`);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Open Sunsama MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.error("Shutting down...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.error("Shutting down...");
  process.exit(0);
});
