/**
 * MCP Tools for Task Management
 * Provides AI agents with tools to create, read, update, and delete tasks
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient, Task } from "../lib/api-client.js";

/**
 * Formats a task object for display in tool results
 */
function formatTask(task: Task): string {
  const lines = [
    `ID: ${task.id}`,
    `Title: ${task.title}`,
    `Priority: ${task.priority}`,
    `Scheduled: ${task.scheduledDate ?? "Backlog"}`,
    `Status: ${task.completedAt ? "Completed" : "Pending"}`,
  ];

  if (task.estimatedMins) {
    lines.push(`Estimated: ${task.estimatedMins} minutes`);
  }

  if (task.notes) {
    lines.push(`Notes: ${task.notes}`);
  }

  if (task.completedAt) {
    lines.push(`Completed At: ${task.completedAt}`);
  }

  lines.push(`Created: ${task.createdAt}`);
  lines.push(`Updated: ${task.updatedAt}`);

  return lines.join("\n");
}

/**
 * Formats multiple tasks for display
 */
function formatTaskList(tasks: Task[]): string {
  if (tasks.length === 0) {
    return "No tasks found.";
  }

  return tasks.map((task, index) => {
    const status = task.completedAt ? "[x]" : "[ ]";
    const scheduled = task.scheduledDate ?? "Backlog";
    return `${index + 1}. ${status} [${task.priority}] ${task.title}\n   ID: ${task.id} | Scheduled: ${scheduled}`;
  }).join("\n\n");
}

/**
 * Creates a success response for MCP tools
 */
function successResponse(text: string) {
  return {
    content: [{ type: "text" as const, text }],
  };
}

/**
 * Creates an error response for MCP tools
 */
function errorResponse(message: string) {
  return {
    content: [{ type: "text" as const, text: `Error: ${message}` }],
    isError: true,
  };
}

/**
 * Registers all task management tools with the MCP server
 */
export function registerTaskTools(server: McpServer, apiClient: ApiClient): void {
  // ============================================================
  // LIST TASKS
  // ============================================================
  server.tool(
    "list_tasks",
    {
      description: `List tasks with optional filters. Returns tasks sorted by position by default.

Examples:
- List today's tasks: { "date": "2024-01-15" }
- List tasks in date range: { "from": "2024-01-15", "to": "2024-01-21" }
- List incomplete tasks: { "completed": false }
- List completed tasks: { "completed": true }
- List backlog tasks: { "backlog": true }
- Combine filters: { "date": "2024-01-15", "completed": false }

Date format: YYYY-MM-DD
Pagination: Use "page" and "limit" for large result sets.`,
      inputSchema: {
        date: z.string().optional().describe("Filter by specific date (YYYY-MM-DD). Cannot be used with 'from'/'to'."),
        from: z.string().optional().describe("Start date for range filter (YYYY-MM-DD). Use with 'to'."),
        to: z.string().optional().describe("End date for range filter (YYYY-MM-DD). Use with 'from'."),
        completed: z.boolean().optional().describe("Filter by completion status. true = completed, false = incomplete, omit = all."),
        backlog: z.boolean().optional().describe("If true, only return tasks without a scheduled date (backlog tasks)."),
        sortBy: z.enum(["priority", "position", "createdAt"]).optional().describe("Sort order. Default is 'position'."),
        page: z.number().int().positive().optional().describe("Page number for pagination (starts at 1)."),
        limit: z.number().int().positive().max(100).optional().describe("Number of tasks per page (max 100, default 50)."),
      },
    },
    async (input) => {
      try {
        const response = await apiClient.listTasks({
          date: input.date,
          from: input.from,
          to: input.to,
          completed: input.completed,
          backlog: input.backlog,
          sortBy: input.sortBy,
          page: input.page,
          limit: input.limit,
        });

        if (!response.success || !response.data) {
          return errorResponse(response.error?.message ?? "Failed to list tasks");
        }

        let result = formatTaskList(response.data);

        if (response.meta) {
          result += `\n\n---\nPage ${response.meta.page} of ${response.meta.totalPages} (${response.meta.total} total tasks)`;
        }

        return successResponse(result);
      } catch (error) {
        return errorResponse(error instanceof Error ? error.message : "Unknown error");
      }
    }
  );

  // ============================================================
  // GET TASK
  // ============================================================
  server.tool(
    "get_task",
    {
      description: `Get detailed information about a specific task by its ID.

Returns the full task object including title, notes, scheduled date, priority, completion status, and timestamps.

Example: { "id": "task_abc123" }`,
      inputSchema: {
        id: z.string().describe("The unique task ID (e.g., 'task_abc123')."),
      },
    },
    async (input) => {
      try {
        const response = await apiClient.getTask(input.id);

        if (!response.success || !response.data) {
          return errorResponse(response.error?.message ?? "Task not found");
        }

        return successResponse(formatTask(response.data));
      } catch (error) {
        return errorResponse(error instanceof Error ? error.message : "Unknown error");
      }
    }
  );

  // ============================================================
  // CREATE TASK
  // ============================================================
  server.tool(
    "create_task",
    {
      description: `Create a new task.

Required: title
Optional: notes, scheduledDate, estimatedMins, priority

Priority levels:
- P0: Critical/Urgent (highest priority)
- P1: High priority
- P2: Medium priority (default)
- P3: Low priority

Examples:
- Simple task: { "title": "Review PR #123" }
- Scheduled task: { "title": "Team meeting", "scheduledDate": "2024-01-15", "estimatedMins": 60 }
- High priority: { "title": "Fix production bug", "priority": "P0", "notes": "Server returning 500 errors" }
- Backlog task: { "title": "Research new framework" } (no scheduledDate = backlog)`,
      inputSchema: {
        title: z.string().min(1).max(500).describe("The task title (required, 1-500 characters)."),
        notes: z.string().max(10000).optional().describe("Additional notes or description (max 10,000 characters)."),
        scheduledDate: z.string().optional().describe("Date to schedule the task (YYYY-MM-DD). Omit for backlog."),
        estimatedMins: z.number().int().positive().optional().describe("Estimated time in minutes."),
        priority: z.enum(["P0", "P1", "P2", "P3"]).optional().describe("Priority level (P0=highest, P3=lowest). Default: P2."),
      },
    },
    async (input) => {
      try {
        const response = await apiClient.createTask({
          title: input.title,
          notes: input.notes,
          scheduledDate: input.scheduledDate,
          estimatedMins: input.estimatedMins,
          priority: input.priority,
        });

        if (!response.success || !response.data) {
          return errorResponse(response.error?.message ?? "Failed to create task");
        }

        return successResponse(`Task created successfully!\n\n${formatTask(response.data)}`);
      } catch (error) {
        return errorResponse(error instanceof Error ? error.message : "Unknown error");
      }
    }
  );

  // ============================================================
  // UPDATE TASK
  // ============================================================
  server.tool(
    "update_task",
    {
      description: `Update an existing task. Only provide fields you want to change.

You can update: title, notes, scheduledDate, estimatedMins, priority

To clear a field, set it to null (for notes, scheduledDate, estimatedMins).
To mark complete/incomplete, use the dedicated complete_task/uncomplete_task tools instead.

Examples:
- Update title: { "id": "task_abc123", "title": "New title" }
- Change priority: { "id": "task_abc123", "priority": "P1" }
- Move to backlog: { "id": "task_abc123", "scheduledDate": null }
- Reschedule: { "id": "task_abc123", "scheduledDate": "2024-01-20" }
- Clear notes: { "id": "task_abc123", "notes": null }`,
      inputSchema: {
        id: z.string().describe("The unique task ID to update."),
        title: z.string().min(1).max(500).optional().describe("New task title."),
        notes: z.string().max(10000).nullable().optional().describe("New notes. Set to null to clear."),
        scheduledDate: z.string().nullable().optional().describe("New scheduled date (YYYY-MM-DD). Set to null to move to backlog."),
        estimatedMins: z.number().int().positive().nullable().optional().describe("New estimated time in minutes. Set to null to clear."),
        priority: z.enum(["P0", "P1", "P2", "P3"]).optional().describe("New priority level."),
      },
    },
    async (input) => {
      try {
        const { id, ...updates } = input;

        // Filter out undefined values, keeping null values
        const filteredUpdates: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(updates)) {
          if (value !== undefined) {
            filteredUpdates[key] = value;
          }
        }

        if (Object.keys(filteredUpdates).length === 0) {
          return errorResponse("No fields to update. Provide at least one field to change.");
        }

        const response = await apiClient.updateTask(id, filteredUpdates);

        if (!response.success || !response.data) {
          return errorResponse(response.error?.message ?? "Failed to update task");
        }

        return successResponse(`Task updated successfully!\n\n${formatTask(response.data)}`);
      } catch (error) {
        return errorResponse(error instanceof Error ? error.message : "Unknown error");
      }
    }
  );

  // ============================================================
  // COMPLETE TASK
  // ============================================================
  server.tool(
    "complete_task",
    {
      description: `Mark a task as complete.

Sets the task's completedAt timestamp to the current time.

Example: { "id": "task_abc123" }`,
      inputSchema: {
        id: z.string().describe("The unique task ID to mark as complete."),
      },
    },
    async (input) => {
      try {
        const response = await apiClient.updateTask(input.id, {
          completedAt: new Date().toISOString(),
        });

        if (!response.success || !response.data) {
          return errorResponse(response.error?.message ?? "Failed to complete task");
        }

        return successResponse(`Task marked as complete!\n\n${formatTask(response.data)}`);
      } catch (error) {
        return errorResponse(error instanceof Error ? error.message : "Unknown error");
      }
    }
  );

  // ============================================================
  // UNCOMPLETE TASK
  // ============================================================
  server.tool(
    "uncomplete_task",
    {
      description: `Mark a task as incomplete (reopen a completed task).

Clears the task's completedAt timestamp.

Example: { "id": "task_abc123" }`,
      inputSchema: {
        id: z.string().describe("The unique task ID to mark as incomplete."),
      },
    },
    async (input) => {
      try {
        const response = await apiClient.updateTask(input.id, {
          completedAt: null,
        });

        if (!response.success || !response.data) {
          return errorResponse(response.error?.message ?? "Failed to uncomplete task");
        }

        return successResponse(`Task marked as incomplete!\n\n${formatTask(response.data)}`);
      } catch (error) {
        return errorResponse(error instanceof Error ? error.message : "Unknown error");
      }
    }
  );

  // ============================================================
  // DELETE TASK
  // ============================================================
  server.tool(
    "delete_task",
    {
      description: `Permanently delete a task.

WARNING: This action cannot be undone. The task and all its subtasks will be permanently removed.

Example: { "id": "task_abc123" }`,
      inputSchema: {
        id: z.string().describe("The unique task ID to delete."),
      },
    },
    async (input) => {
      try {
        const response = await apiClient.deleteTask(input.id);

        if (!response.success) {
          return errorResponse(response.error?.message ?? "Failed to delete task");
        }

        return successResponse(`Task deleted successfully.`);
      } catch (error) {
        return errorResponse(error instanceof Error ? error.message : "Unknown error");
      }
    }
  );

  // ============================================================
  // SCHEDULE TASK
  // ============================================================
  server.tool(
    "schedule_task",
    {
      description: `Move a task to a specific date or to the backlog.

This is a convenience tool for rescheduling tasks. Use it to:
- Schedule a backlog task to a specific date
- Reschedule a task to a different date
- Move a scheduled task back to the backlog

Examples:
- Schedule for tomorrow: { "id": "task_abc123", "date": "2024-01-16" }
- Move to backlog: { "id": "task_abc123", "date": null }`,
      inputSchema: {
        id: z.string().describe("The unique task ID to schedule."),
        date: z.string().nullable().describe("Target date (YYYY-MM-DD) or null to move to backlog."),
      },
    },
    async (input) => {
      try {
        const response = await apiClient.updateTask(input.id, {
          scheduledDate: input.date,
        });

        if (!response.success || !response.data) {
          return errorResponse(response.error?.message ?? "Failed to schedule task");
        }

        const destination = input.date ? `scheduled for ${input.date}` : "moved to backlog";
        return successResponse(`Task ${destination}!\n\n${formatTask(response.data)}`);
      } catch (error) {
        return errorResponse(error instanceof Error ? error.message : "Unknown error");
      }
    }
  );

  // ============================================================
  // REORDER TASKS
  // ============================================================
  server.tool(
    "reorder_tasks",
    {
      description: `Reorder tasks within a specific date or backlog.

Provide the complete ordered list of task IDs for the given date. Tasks will be reordered according to their position in the array.

Important:
- You must include ALL task IDs for the given date/backlog
- The first task ID in the array will be position 0 (top)
- Tasks not included in the array will have undefined positions

Examples:
- Reorder today's tasks: { "date": "2024-01-15", "taskIds": ["task_3", "task_1", "task_2"] }
- Reorder backlog: { "date": "backlog", "taskIds": ["task_b", "task_a", "task_c"] }`,
      inputSchema: {
        date: z.string().describe("The date (YYYY-MM-DD) or 'backlog' for backlog tasks."),
        taskIds: z.array(z.string()).describe("Ordered array of task IDs representing the new order."),
      },
    },
    async (input) => {
      try {
        const dateParam = input.date === "backlog" ? "backlog" : input.date;
        const response = await apiClient.reorderTasks(dateParam, input.taskIds);

        if (!response.success || !response.data) {
          return errorResponse(response.error?.message ?? "Failed to reorder tasks");
        }

        const location = input.date === "backlog" ? "backlog" : input.date;
        return successResponse(`Tasks reordered for ${location}!\n\n${formatTaskList(response.data)}`);
      } catch (error) {
        return errorResponse(error instanceof Error ? error.message : "Unknown error");
      }
    }
  );
}
