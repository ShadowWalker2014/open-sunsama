/**
 * MCP tools for subtask management
 * Provides tools for listing, creating, updating, toggling, and deleting subtasks
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient, Subtask } from "../lib/api-client.js";

/**
 * Format a subtask for display
 */
function formatSubtask(subtask: Subtask): string {
  const checkbox = subtask.completed ? "[x]" : "[ ]";
  return `${checkbox} ${subtask.title} (id: ${subtask.id}, position: ${subtask.position})`;
}

/**
 * Format an array of subtasks for display
 */
function formatSubtaskList(subtasks: Subtask[]): string {
  if (subtasks.length === 0) {
    return "No subtasks found.";
  }
  return subtasks.map(formatSubtask).join("\n");
}

/**
 * Register all subtask-related tools with the MCP server
 */
export function registerSubtaskTools(
  server: McpServer,
  apiClient: ApiClient
): void {
  // List subtasks for a task
  server.tool(
    "list_subtasks",
    {
      description:
        "List all subtasks for a specific task. Subtasks are checklist items within a task that help break down work into smaller actionable steps. Returns all subtasks with their completion status, title, and position.",
      inputSchema: {
        taskId: z
          .string()
          .describe(
            "The unique identifier (UUID) of the parent task to list subtasks for"
          ),
      },
    },
    async (input) => {
      const response = await apiClient.listSubtasks(input.taskId);

      if (!response.success) {
        return {
          content: [
            {
              type: "text",
              text: `Error listing subtasks: ${response.error?.message || "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }

      const subtasks = response.data || [];
      const formattedList = formatSubtaskList(subtasks);

      return {
        content: [
          {
            type: "text",
            text: `Subtasks for task ${input.taskId}:\n\n${formattedList}\n\nTotal: ${subtasks.length} subtask(s)`,
          },
        ],
      };
    }
  );

  // Create a subtask
  server.tool(
    "create_subtask",
    {
      description:
        "Create a new subtask within a task. Subtasks are smaller actionable items that help break down a task into manageable steps. Each subtask has a title and can optionally be positioned at a specific order within the task's subtask list.",
      inputSchema: {
        taskId: z
          .string()
          .describe(
            "The unique identifier (UUID) of the parent task to add the subtask to"
          ),
        title: z
          .string()
          .describe(
            "The title/description of the subtask. Should be a clear, actionable item (e.g., 'Review PR comments', 'Update documentation')"
          ),
        position: z
          .number()
          .optional()
          .describe(
            "Optional position in the subtask list (0-indexed). If not provided, the subtask will be added at the end"
          ),
      },
    },
    async (input) => {
      const response = await apiClient.createSubtask(input.taskId, {
        title: input.title,
        position: input.position,
      });

      if (!response.success) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating subtask: ${response.error?.message || "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }

      const subtask = response.data!;
      return {
        content: [
          {
            type: "text",
            text: `Successfully created subtask:\n\n${formatSubtask(subtask)}\n\nSubtask ID: ${subtask.id}`,
          },
        ],
      };
    }
  );

  // Toggle subtask completion
  server.tool(
    "toggle_subtask",
    {
      description:
        "Toggle a subtask's completed status. If the subtask is incomplete, it will be marked as complete. If it's already complete, it will be marked as incomplete. This is useful for quickly checking off items in a checklist.",
      inputSchema: {
        taskId: z
          .string()
          .describe(
            "The unique identifier (UUID) of the parent task containing the subtask"
          ),
        subtaskId: z
          .string()
          .describe(
            "The unique identifier (UUID) of the subtask to toggle"
          ),
      },
    },
    async (input) => {
      // First, get the current subtask state
      const listResponse = await apiClient.listSubtasks(input.taskId);

      if (!listResponse.success) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching subtask: ${listResponse.error?.message || "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }

      const subtasks = listResponse.data || [];
      const currentSubtask = subtasks.find((s) => s.id === input.subtaskId);

      if (!currentSubtask) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Subtask with ID ${input.subtaskId} not found in task ${input.taskId}`,
            },
          ],
          isError: true,
        };
      }

      // Toggle the completed status
      const newCompletedStatus = !currentSubtask.completed;
      const response = await apiClient.updateSubtask(
        input.taskId,
        input.subtaskId,
        { completed: newCompletedStatus }
      );

      if (!response.success) {
        return {
          content: [
            {
              type: "text",
              text: `Error toggling subtask: ${response.error?.message || "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }

      const subtask = response.data!;
      const statusText = subtask.completed ? "completed" : "incomplete";

      return {
        content: [
          {
            type: "text",
            text: `Successfully toggled subtask to ${statusText}:\n\n${formatSubtask(subtask)}`,
          },
        ],
      };
    }
  );

  // Update a subtask
  server.tool(
    "update_subtask",
    {
      description:
        "Update a subtask's title, completion status, or position. Use this to rename a subtask, manually set its completion status, or reorder it within the task's subtask list. At least one field (title, completed, or position) must be provided.",
      inputSchema: {
        taskId: z
          .string()
          .describe(
            "The unique identifier (UUID) of the parent task containing the subtask"
          ),
        subtaskId: z
          .string()
          .describe("The unique identifier (UUID) of the subtask to update"),
        title: z
          .string()
          .optional()
          .describe("New title for the subtask. If not provided, title remains unchanged"),
        completed: z
          .boolean()
          .optional()
          .describe(
            "Set the completion status directly. true = completed, false = incomplete. Use toggle_subtask for simple toggling"
          ),
        position: z
          .number()
          .optional()
          .describe(
            "New position in the subtask list (0-indexed). Lower numbers appear first"
          ),
      },
    },
    async (input) => {
      // Build update data, only including provided fields
      const updateData: { title?: string; completed?: boolean; position?: number } = {};

      if (input.title !== undefined) {
        updateData.title = input.title;
      }
      if (input.completed !== undefined) {
        updateData.completed = input.completed;
      }
      if (input.position !== undefined) {
        updateData.position = input.position;
      }

      // Check if at least one field is provided
      if (Object.keys(updateData).length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "Error: At least one field (title, completed, or position) must be provided to update",
            },
          ],
          isError: true,
        };
      }

      const response = await apiClient.updateSubtask(
        input.taskId,
        input.subtaskId,
        updateData
      );

      if (!response.success) {
        return {
          content: [
            {
              type: "text",
              text: `Error updating subtask: ${response.error?.message || "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }

      const subtask = response.data!;
      const updatedFields = Object.keys(updateData).join(", ");

      return {
        content: [
          {
            type: "text",
            text: `Successfully updated subtask (fields: ${updatedFields}):\n\n${formatSubtask(subtask)}`,
          },
        ],
      };
    }
  );

  // Delete a subtask
  server.tool(
    "delete_subtask",
    {
      description:
        "Permanently delete a subtask from a task. This action cannot be undone. Use this when a subtask is no longer needed or was created by mistake.",
      inputSchema: {
        taskId: z
          .string()
          .describe(
            "The unique identifier (UUID) of the parent task containing the subtask"
          ),
        subtaskId: z
          .string()
          .describe("The unique identifier (UUID) of the subtask to delete"),
      },
    },
    async (input) => {
      const response = await apiClient.deleteSubtask(input.taskId, input.subtaskId);

      if (!response.success) {
        return {
          content: [
            {
              type: "text",
              text: `Error deleting subtask: ${response.error?.message || "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Successfully deleted subtask ${input.subtaskId} from task ${input.taskId}`,
          },
        ],
      };
    }
  );
}
