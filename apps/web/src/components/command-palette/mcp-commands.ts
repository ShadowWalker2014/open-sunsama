/**
 * MCP (Model Context Protocol) commands for the command palette
 * These help users quickly set up AI agent integrations
 */
import type { Command } from "./commands";

export const MCP_COMMANDS: Command[] = [
  {
    id: "mcp-cursor",
    title: "Setup MCP for Cursor",
    category: "settings",
    keywords: ["mcp", "cursor", "ai", "setup", "config", "agent", "assistant"],
    icon: "Terminal",
    priority: 10,
    action: (ctx) => {
      ctx.copyMcpConfig("cursor");
      ctx.closeSearch();
    },
  },
  {
    id: "mcp-claude",
    title: "Setup MCP for Claude Desktop",
    category: "settings",
    keywords: ["mcp", "claude", "ai", "setup", "config", "anthropic", "agent"],
    icon: "Bot",
    priority: 11,
    action: (ctx) => {
      ctx.copyMcpConfig("claude");
      ctx.closeSearch();
    },
  },
  {
    id: "mcp-vscode",
    title: "Setup MCP for VS Code",
    category: "settings",
    keywords: ["mcp", "vscode", "ai", "setup", "config", "continue", "copilot"],
    icon: "Code",
    priority: 12,
    action: (ctx) => {
      ctx.copyMcpConfig("vscode");
      ctx.closeSearch();
    },
  },
  {
    id: "mcp-windsurf",
    title: "Setup MCP for Windsurf",
    category: "settings",
    keywords: ["mcp", "windsurf", "ai", "setup", "config", "codeium"],
    icon: "Waves",
    priority: 13,
    action: (ctx) => {
      ctx.copyMcpConfig("windsurf");
      ctx.closeSearch();
    },
  },
  {
    id: "copy-api-key",
    title: "Copy MCP API Key",
    category: "settings",
    keywords: ["api", "key", "copy", "mcp", "token", "credential"],
    icon: "Key",
    priority: 14,
    action: (ctx) => {
      ctx.copyApiKey();
      ctx.closeSearch();
    },
  },
  {
    id: "mcp-settings",
    title: "View MCP Settings",
    category: "settings",
    keywords: ["mcp", "settings", "api", "configure", "setup"],
    icon: "Settings",
    priority: 15,
    action: (ctx) => {
      ctx.navigate({ to: "/app/settings", search: { tab: "mcp" } });
      ctx.closeSearch();
    },
  },
];
