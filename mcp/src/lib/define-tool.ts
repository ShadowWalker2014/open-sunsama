/**
 * Registers a tool with the metadata Claude and ChatGPT expect on every
 * tool: a human title, behavior annotations, and the OAuth scopes it needs.
 * Keeping the table in one place means the tool files only carry the
 * description, schema, and handler.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { z, ZodRawShape } from "zod";

type ToolScope =
  | "tasks:read"
  | "tasks:write"
  | "time-blocks:read"
  | "time-blocks:write"
  | "calendar:read"
  | "ideas:read"
  | "ideas:write"
  | "user:read"
  | "user:write";

interface ToolMetadata {
  title: string;
  scopes: ToolScope[];
  readOnly?: boolean;
  destructive?: boolean;
  idempotent?: boolean;
}

type ToolHandler<Shape extends ZodRawShape> = (
  input: { [Key in keyof Shape]: z.infer<Shape[Key]> }
) => unknown | Promise<unknown>;

type ToolRegistrar = {
  registerTool(name: string, config: object, handler: unknown): void;
};

const TOOL_METADATA: Record<string, ToolMetadata> = {
  // Tasks
  list_tasks: { title: "List tasks", scopes: ["tasks:read"], readOnly: true },
  get_task: { title: "Get task", scopes: ["tasks:read"], readOnly: true },
  create_task: { title: "Create task", scopes: ["tasks:write"] },
  update_task: { title: "Update task", scopes: ["tasks:write"], idempotent: true },
  complete_task: { title: "Complete task", scopes: ["tasks:write"], idempotent: true },
  uncomplete_task: { title: "Reopen task", scopes: ["tasks:write"], idempotent: true },
  delete_task: { title: "Delete task", scopes: ["tasks:write"], destructive: true, idempotent: true },
  schedule_task: { title: "Schedule task", scopes: ["tasks:write"], idempotent: true },
  reorder_tasks: { title: "Reorder tasks", scopes: ["tasks:write"], idempotent: true },

  // Subtasks
  list_subtasks: { title: "List subtasks", scopes: ["tasks:read"], readOnly: true },
  create_subtask: { title: "Create subtask", scopes: ["tasks:write"] },
  toggle_subtask: { title: "Toggle subtask", scopes: ["tasks:write"] },
  update_subtask: { title: "Update subtask", scopes: ["tasks:write"], idempotent: true },
  delete_subtask: { title: "Delete subtask", scopes: ["tasks:write"], destructive: true, idempotent: true },

  // Time blocks
  list_time_blocks: { title: "List time blocks", scopes: ["time-blocks:read"], readOnly: true },
  get_time_block: { title: "Get time block", scopes: ["time-blocks:read"], readOnly: true },
  create_time_block: { title: "Create time block", scopes: ["time-blocks:write"] },
  update_time_block: { title: "Update time block", scopes: ["time-blocks:write"], idempotent: true },
  delete_time_block: {
    title: "Delete time block",
    scopes: ["time-blocks:write"],
    destructive: true,
    idempotent: true,
  },
  link_task_to_time_block: {
    title: "Link task to time block",
    scopes: ["time-blocks:write"],
    idempotent: true,
  },
  get_schedule_for_day: {
    title: "Get schedule for a day",
    scopes: ["time-blocks:read", "calendar:read"],
    readOnly: true,
  },

  // Calendar events (synced from Google, Outlook, iCloud)
  list_calendar_events: { title: "List calendar events", scopes: ["calendar:read"], readOnly: true },

  // Ideas
  bulk_ideas: { title: "Bulk manage Ideas", scopes: ["ideas:write"], destructive: true },
  get_idea: { title: "Get idea", scopes: ["ideas:read"], readOnly: true },
  list_idea_boards: { title: "List idea boards", scopes: ["ideas:read"], readOnly: true },
  create_idea_board: { title: "Create idea board", scopes: ["ideas:write"] },
  update_idea_board: { title: "Update idea board", scopes: ["ideas:write"], idempotent: true },
  delete_idea_board: { title: "Delete idea board", scopes: ["ideas:write"], destructive: true, idempotent: true },
  reorder_idea_boards: { title: "Reorder idea boards", scopes: ["ideas:write"], idempotent: true },
  list_idea_columns: { title: "List idea columns", scopes: ["ideas:read"], readOnly: true },
  create_idea_column: { title: "Create idea column", scopes: ["ideas:write"] },
  update_idea_column: { title: "Update idea column", scopes: ["ideas:write"], idempotent: true },
  delete_idea_column: { title: "Delete idea column", scopes: ["ideas:write"], destructive: true, idempotent: true },
  reorder_idea_columns: { title: "Reorder idea columns", scopes: ["ideas:write"], idempotent: true },
  list_ideas: { title: "List ideas", scopes: ["ideas:read"], readOnly: true },
  create_idea: { title: "Create idea", scopes: ["ideas:write"] },
  update_idea: { title: "Update idea", scopes: ["ideas:write"], idempotent: true },
  delete_idea: { title: "Delete idea", scopes: ["ideas:write"], destructive: true, idempotent: true },
  reorder_ideas: { title: "Reorder ideas", scopes: ["ideas:write"], idempotent: true },
  promote_idea: { title: "Promote idea to task", scopes: ["ideas:write", "tasks:write"] },
  list_idea_subtasks: { title: "List idea subtasks", scopes: ["ideas:read"], readOnly: true },
  create_idea_subtask: { title: "Create idea subtask", scopes: ["ideas:write"] },
  update_idea_subtask: { title: "Update idea subtask", scopes: ["ideas:write"], idempotent: true },
  delete_idea_subtask: { title: "Delete idea subtask", scopes: ["ideas:write"], destructive: true, idempotent: true },
  reorder_idea_subtasks: { title: "Reorder idea subtasks", scopes: ["ideas:write"], idempotent: true },

  // User
  get_user_profile: { title: "Get profile", scopes: ["user:read"], readOnly: true },
  update_user_profile: { title: "Update profile", scopes: ["user:write"], idempotent: true },
};

/** Union of every scope any tool needs — what an MCP client should request. */
export const MCP_TOOL_SCOPES: ToolScope[] = [
  ...new Set(Object.values(TOOL_METADATA).flatMap((m) => m.scopes)),
];

export function defineTool<Shape extends ZodRawShape>(
  server: McpServer,
  name: string,
  description: string,
  inputSchema: Shape,
  handler: ToolHandler<Shape>
): void {
  const meta = TOOL_METADATA[name];
  if (!meta) {
    throw new Error(`Missing TOOL_METADATA entry for MCP tool "${name}"`);
  }

  const securitySchemes = [{ type: "oauth2", scopes: meta.scopes }];

  // The SDK's callback generic recursively expands each Zod schema, which can
  // exceed TypeScript's heap for this server's complete tool set.
  (server as unknown as ToolRegistrar).registerTool(
    name,
    {
      title: meta.title,
      description,
      inputSchema,
      annotations: {
        title: meta.title,
        readOnlyHint: meta.readOnly ?? false,
        destructiveHint: meta.destructive ?? false,
        idempotentHint: meta.idempotent ?? meta.readOnly ?? false,
        // Tools only touch the user's own Open Sunsama account.
        openWorldHint: false,
      },
      // ChatGPT reads securitySchemes to know the tool needs a linked account.
      _meta: { securitySchemes },
    },
    handler
  );
}
