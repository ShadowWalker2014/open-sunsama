/**
 * MCP Tools for Time Block Management
 *
 * Time blocks represent scheduled chunks of focused work time on your calendar.
 * They can optionally be linked to tasks to track what you're working on.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient, TimeBlock } from "../lib/api-client.js";

/**
 * Format an API response for MCP tool output
 */
function formatResponse(data: unknown, isError = false): {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
} {
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return {
    content: [{ type: "text", text }],
    ...(isError && { isError: true }),
  };
}

/**
 * Format a time block for display with human-readable information
 */
function formatTimeBlock(block: TimeBlock): string {
  const lines = [
    `Time Block: ${block.title}`,
    `ID: ${block.id}`,
    `Date: ${block.date}`,
    `Time: ${block.startTime} - ${block.endTime} (${block.durationMins} mins)`,
  ];

  if (block.description) {
    lines.push(`Description: ${block.description}`);
  }

  if (block.taskId) {
    lines.push(`Linked Task ID: ${block.taskId}`);
    if (block.task) {
      lines.push(`Linked Task: ${block.task.title}`);
    }
  }

  if (block.color) {
    lines.push(`Color: ${block.color}`);
  }

  lines.push(`Created: ${block.createdAt}`);
  lines.push(`Updated: ${block.updatedAt}`);

  return lines.join("\n");
}

/**
 * Format multiple time blocks as a schedule view
 */
function formatSchedule(blocks: TimeBlock[], date: string): string {
  if (blocks.length === 0) {
    return `No time blocks scheduled for ${date}`;
  }

  // Sort by start time
  const sorted = [...blocks].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  const lines = [`Schedule for ${date}:`, "─".repeat(40)];

  for (const block of sorted) {
    const taskInfo = block.taskId
      ? ` [Task: ${block.task?.title || block.taskId}]`
      : "";
    lines.push(`${block.startTime} - ${block.endTime}: ${block.title}${taskInfo}`);
    if (block.description) {
      lines.push(`  └─ ${block.description}`);
    }
  }

  // Calculate total scheduled time
  const totalMins = sorted.reduce((sum, b) => sum + b.durationMins, 0);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  lines.push("─".repeat(40));
  lines.push(
    `Total: ${blocks.length} blocks, ${hours}h ${mins}m scheduled`
  );

  return lines.join("\n");
}

/**
 * Register all time block MCP tools
 */
export function registerTimeBlockTools(
  server: McpServer,
  apiClient: ApiClient
): void {
  // List time blocks with optional filters
  server.tool(
    "list_time_blocks",
    `List time blocks from your calendar with optional filters.

Use this tool to:
- View all time blocks for a specific date (use 'date' parameter)
- View time blocks across a date range (use 'from' and 'to' parameters)
- Find all time blocks linked to a specific task (use 'taskId' parameter)
- Browse through paginated results (use 'page' and 'limit' parameters)

Time blocks represent scheduled chunks of focused work time. They can be 
linked to tasks to track what work is being done during that time.

Returns a list of time blocks with their details including title, date, 
start/end times, duration, description, color, and any linked task info.`,
    {
      date: z
        .string()
        .optional()
        .describe(
          "Filter by specific date in YYYY-MM-DD format (e.g., '2024-01-15'). Cannot be used with from/to."
        ),
      from: z
        .string()
        .optional()
        .describe(
          "Start of date range in YYYY-MM-DD format. Must be used with 'to' parameter."
        ),
      to: z
        .string()
        .optional()
        .describe(
          "End of date range in YYYY-MM-DD format. Must be used with 'from' parameter."
        ),
      taskId: z
        .string()
        .optional()
        .describe(
          "Filter to only show time blocks linked to this specific task ID"
        ),
      page: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Page number for pagination (default: 1)"),
      limit: z
        .number()
        .int()
        .positive()
        .max(100)
        .optional()
        .describe("Number of results per page (default: 50, max: 100)"),
    },
    async (input) => {
      try {
        const response = await apiClient.listTimeBlocks({
          date: input.date,
          from: input.from,
          to: input.to,
          taskId: input.taskId,
          page: input.page,
          limit: input.limit,
        });

        if (!response.success) {
          return formatResponse(
            {
              error: response.error?.message || "Failed to list time blocks",
              code: response.error?.code,
              details: response.error?.errors,
            },
            true
          );
        }

        const blocks = response.data || [];
        const result = {
          timeBlocks: blocks,
          count: blocks.length,
          pagination: response.meta,
        };

        return formatResponse(result);
      } catch (error) {
        return formatResponse(
          {
            error: "Failed to list time blocks",
            message: error instanceof Error ? error.message : String(error),
          },
          true
        );
      }
    }
  );

  // Get a specific time block by ID
  server.tool(
    "get_time_block",
    `Get detailed information about a specific time block by its ID.

Use this tool when you need to:
- View the full details of a time block
- Check if a time block exists
- See what task is linked to a time block
- Get the exact timing and duration of a scheduled block

Returns complete time block information including title, date, start/end times,
duration in minutes, description, color, and linked task details if any.`,
    {
      id: z.string().describe("The unique ID of the time block to retrieve"),
    },
    async (input) => {
      try {
        const response = await apiClient.getTimeBlock(input.id);

        if (!response.success) {
          return formatResponse(
            {
              error: response.error?.message || "Time block not found",
              code: response.error?.code,
              timeBlockId: input.id,
            },
            true
          );
        }

        return formatResponse({
          timeBlock: response.data,
          formatted: formatTimeBlock(response.data!),
        });
      } catch (error) {
        return formatResponse(
          {
            error: "Failed to get time block",
            timeBlockId: input.id,
            message: error instanceof Error ? error.message : String(error),
          },
          true
        );
      }
    }
  );

  // Create a new time block
  server.tool(
    "create_time_block",
    `Create a new time block to schedule focused work time on your calendar.

Use this tool to:
- Schedule a block of time for focused work
- Plan your day by creating time-boxed sessions
- Reserve time for specific activities or tasks
- Create recurring work sessions (one at a time)

Time blocks help you:
- Protect time for deep work
- Visualize your day's schedule
- Track how you spend your time
- Link work sessions to specific tasks

The time block will appear on your calendar for the specified date and time.
You can optionally link it to an existing task to track what you'll work on.`,
    {
      title: z
        .string()
        .min(1)
        .max(200)
        .describe(
          "Title of the time block (e.g., 'Deep work session', 'Team standup', 'Code review')"
        ),
      date: z
        .string()
        .describe(
          "Date for the time block in YYYY-MM-DD format (e.g., '2024-01-15')"
        ),
      startTime: z
        .string()
        .describe(
          "Start time in 24-hour HH:MM format (e.g., '09:00', '14:30')"
        ),
      endTime: z
        .string()
        .describe(
          "End time in 24-hour HH:MM format (e.g., '11:00', '16:00'). Must be after startTime."
        ),
      taskId: z
        .string()
        .optional()
        .describe(
          "Optional: ID of a task to link to this time block. Links the scheduled time to specific work."
        ),
      description: z
        .string()
        .max(1000)
        .optional()
        .describe(
          "Optional: Additional notes or context for this time block"
        ),
      color: z
        .string()
        .optional()
        .describe(
          "Optional: Hex color code for visual distinction (e.g., '#3B82F6' for blue, '#10B981' for green)"
        ),
    },
    async (input) => {
      try {
        // Validate time format
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(input.startTime)) {
          return formatResponse(
            {
              error: "Invalid start time format",
              message:
                "Start time must be in HH:MM 24-hour format (e.g., '09:00', '14:30')",
              provided: input.startTime,
            },
            true
          );
        }
        if (!timeRegex.test(input.endTime)) {
          return formatResponse(
            {
              error: "Invalid end time format",
              message:
                "End time must be in HH:MM 24-hour format (e.g., '11:00', '16:00')",
              provided: input.endTime,
            },
            true
          );
        }

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(input.date)) {
          return formatResponse(
            {
              error: "Invalid date format",
              message: "Date must be in YYYY-MM-DD format (e.g., '2024-01-15')",
              provided: input.date,
            },
            true
          );
        }

        // Validate end time is after start time
        if (input.endTime <= input.startTime) {
          return formatResponse(
            {
              error: "Invalid time range",
              message: "End time must be after start time",
              startTime: input.startTime,
              endTime: input.endTime,
            },
            true
          );
        }

        // Validate color format if provided
        if (input.color && !/^#[0-9A-Fa-f]{6}$/.test(input.color)) {
          return formatResponse(
            {
              error: "Invalid color format",
              message:
                "Color must be a 6-digit hex code (e.g., '#3B82F6')",
              provided: input.color,
            },
            true
          );
        }

        const response = await apiClient.createTimeBlock({
          title: input.title,
          date: input.date,
          startTime: input.startTime,
          endTime: input.endTime,
          taskId: input.taskId,
          description: input.description,
          color: input.color,
        });

        if (!response.success) {
          return formatResponse(
            {
              error: response.error?.message || "Failed to create time block",
              code: response.error?.code,
              details: response.error?.errors,
            },
            true
          );
        }

        return formatResponse({
          message: "Time block created successfully",
          timeBlock: response.data,
          formatted: formatTimeBlock(response.data!),
        });
      } catch (error) {
        return formatResponse(
          {
            error: "Failed to create time block",
            message: error instanceof Error ? error.message : String(error),
          },
          true
        );
      }
    }
  );

  // Update an existing time block
  server.tool(
    "update_time_block",
    `Update an existing time block's details.

Use this tool to:
- Reschedule a time block to a different time or date
- Change the title or description
- Update the color for visual organization
- Link or unlink a task (use link_task_to_time_block for just that)

Only provide the fields you want to change. Omitted fields will remain unchanged.
To clear optional fields (description, color, taskId), pass null explicitly.`,
    {
      id: z.string().describe("The unique ID of the time block to update"),
      title: z
        .string()
        .min(1)
        .max(200)
        .optional()
        .describe("New title for the time block"),
      date: z
        .string()
        .optional()
        .describe("New date in YYYY-MM-DD format (e.g., '2024-01-15')"),
      startTime: z
        .string()
        .optional()
        .describe("New start time in HH:MM 24-hour format (e.g., '09:00')"),
      endTime: z
        .string()
        .optional()
        .describe("New end time in HH:MM 24-hour format (e.g., '11:00')"),
      taskId: z
        .string()
        .nullable()
        .optional()
        .describe(
          "Task ID to link, or null to unlink. Omit to keep current link."
        ),
      description: z
        .string()
        .max(1000)
        .nullable()
        .optional()
        .describe("New description, or null to clear"),
      color: z
        .string()
        .nullable()
        .optional()
        .describe("New hex color (e.g., '#3B82F6'), or null to clear"),
    },
    async (input) => {
      try {
        const { id, ...updates } = input;

        // Validate time formats if provided
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (updates.startTime && !timeRegex.test(updates.startTime)) {
          return formatResponse(
            {
              error: "Invalid start time format",
              message: "Start time must be in HH:MM 24-hour format",
              provided: updates.startTime,
            },
            true
          );
        }
        if (updates.endTime && !timeRegex.test(updates.endTime)) {
          return formatResponse(
            {
              error: "Invalid end time format",
              message: "End time must be in HH:MM 24-hour format",
              provided: updates.endTime,
            },
            true
          );
        }

        // Validate date format if provided
        if (updates.date && !/^\d{4}-\d{2}-\d{2}$/.test(updates.date)) {
          return formatResponse(
            {
              error: "Invalid date format",
              message: "Date must be in YYYY-MM-DD format",
              provided: updates.date,
            },
            true
          );
        }

        // Validate color format if provided
        if (
          updates.color !== null &&
          updates.color !== undefined &&
          !/^#[0-9A-Fa-f]{6}$/.test(updates.color)
        ) {
          return formatResponse(
            {
              error: "Invalid color format",
              message: "Color must be a 6-digit hex code (e.g., '#3B82F6')",
              provided: updates.color,
            },
            true
          );
        }

        // Build update payload, only including defined fields
        const updateData: Record<string, unknown> = {};
        if (updates.title !== undefined) updateData.title = updates.title;
        if (updates.date !== undefined) updateData.date = updates.date;
        if (updates.startTime !== undefined)
          updateData.startTime = updates.startTime;
        if (updates.endTime !== undefined) updateData.endTime = updates.endTime;
        if (updates.taskId !== undefined) updateData.taskId = updates.taskId;
        if (updates.description !== undefined)
          updateData.description = updates.description;
        if (updates.color !== undefined) updateData.color = updates.color;

        if (Object.keys(updateData).length === 0) {
          return formatResponse(
            {
              error: "No updates provided",
              message: "Please provide at least one field to update",
            },
            true
          );
        }

        const response = await apiClient.updateTimeBlock(id, updateData);

        if (!response.success) {
          return formatResponse(
            {
              error: response.error?.message || "Failed to update time block",
              code: response.error?.code,
              timeBlockId: id,
              details: response.error?.errors,
            },
            true
          );
        }

        return formatResponse({
          message: "Time block updated successfully",
          timeBlock: response.data,
          formatted: formatTimeBlock(response.data!),
        });
      } catch (error) {
        return formatResponse(
          {
            error: "Failed to update time block",
            timeBlockId: input.id,
            message: error instanceof Error ? error.message : String(error),
          },
          true
        );
      }
    }
  );

  // Delete a time block
  server.tool(
    "delete_time_block",
    `Delete a time block from your calendar.

Use this tool to:
- Remove a scheduled time block that's no longer needed
- Clear a time slot that was cancelled
- Delete mistakenly created time blocks

This action is permanent. The time block will be removed from your schedule.
Any linked task will NOT be deleted, only the link will be removed.`,
    {
      id: z.string().describe("The unique ID of the time block to delete"),
    },
    async (input) => {
      try {
        const response = await apiClient.deleteTimeBlock(input.id);

        if (!response.success) {
          return formatResponse(
            {
              error: response.error?.message || "Failed to delete time block",
              code: response.error?.code,
              timeBlockId: input.id,
            },
            true
          );
        }

        return formatResponse({
          message: "Time block deleted successfully",
          deletedId: input.id,
        });
      } catch (error) {
        return formatResponse(
          {
            error: "Failed to delete time block",
            timeBlockId: input.id,
            message: error instanceof Error ? error.message : String(error),
          },
          true
        );
      }
    }
  );

  // Link or unlink a task to a time block
  server.tool(
    "link_task_to_time_block",
    `Link a task to a time block, or unlink a task from a time block.

Use this tool to:
- Connect a scheduled time block to a specific task you'll work on
- Track which task you're dedicating time to
- Unlink a task if the time block is for something else

When a task is linked to a time block:
- The calendar shows what you'll be working on
- You can see which tasks have dedicated time slots
- Time tracking becomes more meaningful

To unlink a task, pass null as the taskId.`,
    {
      timeBlockId: z
        .string()
        .describe("The ID of the time block to link/unlink"),
      taskId: z
        .string()
        .nullable()
        .describe(
          "The task ID to link to this time block, or null to unlink the current task"
        ),
    },
    async (input) => {
      try {
        const response = await apiClient.updateTimeBlock(input.timeBlockId, {
          taskId: input.taskId,
        });

        if (!response.success) {
          return formatResponse(
            {
              error: response.error?.message || "Failed to update time block",
              code: response.error?.code,
              timeBlockId: input.timeBlockId,
              details: response.error?.errors,
            },
            true
          );
        }

        const action = input.taskId ? "linked" : "unlinked";
        return formatResponse({
          message: `Task ${action} successfully`,
          timeBlock: response.data,
          taskId: input.taskId,
          formatted: formatTimeBlock(response.data!),
        });
      } catch (error) {
        return formatResponse(
          {
            error: "Failed to link/unlink task",
            timeBlockId: input.timeBlockId,
            taskId: input.taskId,
            message: error instanceof Error ? error.message : String(error),
          },
          true
        );
      }
    }
  );

  // Get schedule for a specific day (convenience tool)
  server.tool(
    "get_schedule_for_day",
    `Get all time blocks for a specific day, formatted as a schedule view.

This is a convenience tool that:
- Fetches all time blocks for the given date
- Sorts them chronologically
- Formats them as a readable daily schedule
- Shows total scheduled time

Use this tool to:
- See your schedule for today or any other day
- Review how your day is organized
- Check for gaps in your schedule
- Get an overview before planning

The schedule shows times, titles, and linked tasks in an easy-to-read format.`,
    {
      date: z
        .string()
        .describe(
          "The date to get the schedule for in YYYY-MM-DD format (e.g., '2024-01-15')"
        ),
    },
    async (input) => {
      try {
        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
          return formatResponse(
            {
              error: "Invalid date format",
              message: "Date must be in YYYY-MM-DD format (e.g., '2024-01-15')",
              provided: input.date,
            },
            true
          );
        }

        const response = await apiClient.listTimeBlocks({
          date: input.date,
          limit: 100, // Get all blocks for the day
        });

        if (!response.success) {
          return formatResponse(
            {
              error: response.error?.message || "Failed to get schedule",
              code: response.error?.code,
              date: input.date,
            },
            true
          );
        }

        const blocks = response.data || [];
        return formatResponse({
          date: input.date,
          schedule: formatSchedule(blocks, input.date),
          timeBlocks: blocks,
          count: blocks.length,
        });
      } catch (error) {
        return formatResponse(
          {
            error: "Failed to get schedule",
            date: input.date,
            message: error instanceof Error ? error.message : String(error),
          },
          true
        );
      }
    }
  );
}
