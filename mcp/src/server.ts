/**
 * Builds the Open Sunsama MCP server with every tool registered.
 *
 * Shared by the stdio CLI (`src/index.ts`, API-key auth) and the API's remote
 * Streamable HTTP endpoint (`/mcp`, OAuth auth). The caller decides how the
 * ApiClient authenticates and which transport to connect.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ApiClient, type ApiClientConfig } from "./lib/api-client.js";
import { registerTaskTools } from "./tools/tasks.js";
import { registerTimeBlockTools } from "./tools/time-blocks.js";
import { registerSubtaskTools } from "./tools/subtasks.js";
import { registerUserTools } from "./tools/user.js";

export { ApiClient, type ApiClientConfig } from "./lib/api-client.js";
export { MCP_TOOL_SCOPES } from "./lib/define-tool.js";

export const MCP_SERVER_INFO = {
  name: "open-sunsama",
  title: "Open Sunsama",
  version: "1.1.0",
  websiteUrl: "https://opensunsama.com",
} as const;

const INSTRUCTIONS = `Open Sunsama is the user's daily planner: tasks scheduled on dates (or in the backlog), subtasks, and time blocks on a calendar.
- Dates are YYYY-MM-DD in the user's timezone; call get_user_profile if you need the timezone.
- Use get_schedule_for_day to see a whole day at once before planning it.
- Prefer schedule_task to move work between days and link_task_to_time_block to put a task on the calendar.`;

export function createOpenSunsamaMcpServer(
  client: ApiClient | ApiClientConfig
): McpServer {
  const apiClient = client instanceof ApiClient ? client : new ApiClient(client);
  const server = new McpServer(MCP_SERVER_INFO, { instructions: INSTRUCTIONS });

  registerTaskTools(server, apiClient);
  registerTimeBlockTools(server, apiClient);
  registerSubtaskTools(server, apiClient);
  registerUserTools(server, apiClient);

  return server;
}
