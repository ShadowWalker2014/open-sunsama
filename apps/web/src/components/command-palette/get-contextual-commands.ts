/**
 * Context-aware command filtering and prioritization
 * Shows only relevant commands based on user context
 */
import type { Command, CommandContext } from "./commands";

/** Maximum commands to show when no query is typed */
const MAX_DEFAULT_COMMANDS = 6;

/** Keywords that trigger MCP commands to surface */
const MCP_KEYWORDS = ["mcp", "ai", "cursor", "claude", "setup", "agent", "bot"];

/**
 * Get contextually relevant commands based on user state and query
 * 
 * Design philosophy:
 * 1. When task is hovered → show task actions first
 * 2. When searching for MCP/AI → show MCP commands first  
 * 3. Default → show view-specific + global commands, max 6
 * 4. Type to reveal more commands
 */
export function getContextualCommands(
  allCommands: Command[],
  context: CommandContext,
  query: string
): Command[] {
  const lowerQuery = query.toLowerCase().trim();
  
  // Step 1: Filter by query (if present)
  let filtered = lowerQuery
    ? allCommands.filter(cmd => 
        cmd.title.toLowerCase().includes(lowerQuery) ||
        cmd.keywords.some(k => k.toLowerCase().includes(lowerQuery))
      )
    : allCommands;
  
  // Step 2: Filter by context requirements
  filtered = filtered.filter(cmd => {
    // Check hoveredTask requirement
    if (cmd.requiresHoveredTask && !context.hoveredTask) {
      return false;
    }
    
    // Check view requirement (if specified)
    if (cmd.showInViews && cmd.showInViews.length > 0) {
      if (!cmd.showInViews.includes(context.currentView)) {
        return false;
      }
    }
    
    return true;
  });
  
  // Step 3: Sort by priority and context relevance
  const isMcpSearch = MCP_KEYWORDS.some(kw => lowerQuery.includes(kw));
  
  filtered.sort((a, b) => {
    // Task commands first when hovering a task
    if (context.hoveredTask) {
      const aIsTask = a.requiresHoveredTask;
      const bIsTask = b.requiresHoveredTask;
      if (aIsTask && !bIsTask) return -1;
      if (bIsTask && !aIsTask) return 1;
    }
    
    // MCP commands first when searching for MCP-related terms
    if (isMcpSearch) {
      const aIsMcp = a.id.startsWith("mcp-") || a.id === "copy-api-key";
      const bIsMcp = b.id.startsWith("mcp-") || b.id === "copy-api-key";
      if (aIsMcp && !bIsMcp) return -1;
      if (bIsMcp && !aIsMcp) return 1;
    }
    
    // Then by priority (lower is higher priority)
    return (a.priority ?? 50) - (b.priority ?? 50);
  });
  
  // Step 4: Limit default commands when no query
  if (!lowerQuery) {
    return filtered.slice(0, MAX_DEFAULT_COMMANDS);
  }
  
  return filtered;
}

/**
 * Check if MCP commands should be shown prominently
 */
export function shouldShowMcpCommands(query: string): boolean {
  const lowerQuery = query.toLowerCase().trim();
  return MCP_KEYWORDS.some(kw => lowerQuery.includes(kw));
}

/**
 * Check if the query is searching for MCP-related content
 */
export function isMcpQuery(query: string): boolean {
  return shouldShowMcpCommands(query);
}
