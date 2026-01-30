/**
 * MCP (Model Context Protocol) commands for the command palette
 * Single command to access MCP settings - detailed setup is on that page
 */
import type { Command } from "./commands";

export const MCP_COMMANDS: Command[] = [
  {
    id: "mcp-settings",
    title: "MCP Settings",
    category: "settings",
    keywords: ["mcp", "ai", "agent", "cursor", "claude", "api", "setup", "integration"],
    icon: "Cpu",
    priority: 15,
    action: (ctx) => {
      ctx.navigate({ to: "/app/settings", search: { tab: "mcp" } });
      ctx.closeSearch();
    },
  },
];
