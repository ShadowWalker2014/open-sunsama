/**
 * MCP configuration generation utilities
 * Extracted from mcp-settings.tsx for reuse in command palette
 */

const MCP_KEY_STORAGE_KEY = "opensunsama_mcp_key";

export type McpClient = "cursor" | "claude" | "vscode" | "windsurf";

/**
 * Generate MCP configuration JSON for a specific client
 */
export function generateMcpConfig(
  client: McpClient,
  apiKey: string,
  apiUrl: string = "https://api.opensunsama.com"
): string {
  const baseConfig = {
    command: "npx",
    args: ["-y", "@open-sunsama/mcp"],
    env: {
      OPENSUNSAMA_API_KEY: apiKey,
      ...(apiUrl !== "https://api.opensunsama.com" && { OPENSUNSAMA_API_URL: apiUrl }),
    },
  };

  // VS Code uses different format (array of servers)
  if (client === "vscode") {
    return JSON.stringify({
      mcpServers: [{ name: "open-sunsama", ...baseConfig }],
    }, null, 2);
  }

  // Cursor, Claude, Windsurf use object format
  return JSON.stringify({
    mcpServers: { "open-sunsama": baseConfig },
  }, null, 2);
}

/**
 * Get the stored MCP API key from localStorage
 */
export function getMcpApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(MCP_KEY_STORAGE_KEY);
}

/**
 * Store an MCP API key in localStorage
 */
export function setMcpApiKey(key: string): void {
  localStorage.setItem(MCP_KEY_STORAGE_KEY, key);
}

/**
 * Get display name for MCP client
 */
export function getMcpClientDisplayName(client: McpClient): string {
  const names: Record<McpClient, string> = {
    cursor: "Cursor",
    claude: "Claude Desktop",
    vscode: "VS Code",
    windsurf: "Windsurf",
  };
  return names[client];
}
