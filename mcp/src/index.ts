#!/usr/bin/env node

/**
 * Open Sunsama MCP Server
 *
 * A Model Context Protocol server that enables AI agents to manage tasks,
 * time blocks, and calendars through the Open Sunsama API.
 *
 * Usage:
 *   OPENSUNSAMA_API_KEY=cf_xxx open-sunsama-mcp
 *   OPENSUNSAMA_API_KEY=cf_xxx OPENSUNSAMA_API_URL=http://localhost:3001 open-sunsama-mcp
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ApiClient } from "./lib/api-client.js";
import { registerTaskTools } from "./tools/tasks.js";
import { registerTimeBlockTools } from "./tools/time-blocks.js";
import { registerSubtaskTools } from "./tools/subtasks.js";
import { registerUserTools } from "./tools/user.js";

// Configuration from environment variables
const API_KEY = process.env.OPENSUNSAMA_API_KEY;
const API_URL = process.env.OPENSUNSAMA_API_URL || "http://localhost:3001";

// Validate required configuration
if (!API_KEY) {
  console.error("Error: OPENSUNSAMA_API_KEY environment variable is required");
  console.error("");
  console.error("Usage:");
  console.error("  OPENSUNSAMA_API_KEY=cf_xxx open-sunsama-mcp");
  console.error("");
  console.error("You can get an API key from the Open Sunsama web app:");
  console.error("  Settings → API Keys → Generate New Key");
  process.exit(1);
}

// Create the MCP server
const server = new McpServer({
  name: "open-sunsama",
  version: "1.0.0",
});

// Create the API client
const apiClient = new ApiClient({
  baseUrl: API_URL,
  apiKey: API_KEY,
});

// Register all tools
registerTaskTools(server, apiClient);
registerTimeBlockTools(server, apiClient);
registerSubtaskTools(server, apiClient);
registerUserTools(server, apiClient);

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
