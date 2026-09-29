/** MCP access to the Ideas boards, columns, cards, and card checklists. */
import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import type { ApiClient, ApiResponse } from "../lib/api-client.js";
import { defineTool } from "../lib/define-tool.js";

const id = z.string().uuid();
const position = z.number().int().nonnegative();
const name = z.string().min(1).max(120);
const title = z.string().min(1).max(500);
const priority = z.enum(["P0", "P1", "P2", "P3"]);
const icon = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9]+$/);
const color = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
const notes = z.string().max(5000).nullable();
const estimatedMins = z.number().int().positive().max(1440).nullable();
const ids = z.array(id).min(1);

const boardFields = { name, icon: icon.optional(), color: color.optional(), position: position.optional() };
const columnFields = { boardId: id, name, position: position.optional() };
const ideaFields = { boardId: id, columnId: id, title, notes: notes.optional(), estimatedMins: estimatedMins.optional(), priority: priority.optional(), position: position.optional() };
const ideaChanges = { title: title.optional(), notes: notes.optional(), estimatedMins: estimatedMins.optional(), priority: priority.optional(), columnId: id.optional(), position: position.optional(), completedAt: z.string().datetime().nullable().optional() };
const operations = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create_board"), data: z.object(boardFields) }),
  z.object({ action: z.literal("update_board"), id, data: z.object(boardFields).partial() }),
  z.object({ action: z.literal("delete_board"), id }),
  z.object({ action: z.literal("create_column"), data: z.object(columnFields) }),
  z.object({ action: z.literal("update_column"), id, data: z.object({ name: name.optional(), position: position.optional() }) }),
  z.object({ action: z.literal("delete_column"), id }),
  z.object({ action: z.literal("create_idea"), data: z.object(ideaFields) }),
  z.object({ action: z.literal("update_idea"), id, data: z.object(ideaChanges) }),
  z.object({ action: z.literal("delete_idea"), id }),
  z.object({ action: z.literal("create_subtask"), ideaId: id, data: z.object({ title, position: position.optional() }) }),
  z.object({ action: z.literal("update_subtask"), ideaId: id, id, data: z.object({ title: title.optional(), position: position.optional(), completed: z.boolean().optional() }) }),
  z.object({ action: z.literal("delete_subtask"), ideaId: id, id }),
]);

async function executeOperation(api: ApiClient, op: z.infer<typeof operations>) {
  switch (op.action) {
    case "create_board": return api.createIdeaBoard(op.data);
    case "update_board": return api.updateIdeaBoard(op.id, op.data);
    case "delete_board": return api.deleteIdeaBoard(op.id);
    case "create_column": return api.createIdeaColumn(op.data);
    case "update_column": return api.updateIdeaColumn(op.id, op.data);
    case "delete_column": return api.deleteIdeaColumn(op.id);
    case "create_idea": return api.createIdea(op.data);
    case "update_idea": return api.updateIdea(op.id, op.data);
    case "delete_idea": return api.deleteIdea(op.id);
    case "create_subtask": return api.createIdeaSubtask(op.ideaId, op.data);
    case "update_subtask": return api.updateIdeaSubtask(op.ideaId, op.id, op.data);
    case "delete_subtask": return api.deleteIdeaSubtask(op.ideaId, op.id);
  }
}

function result(response: ApiResponse<unknown>, fallback: string) {
  if (!response.success) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error: ${response.error?.message ?? fallback}`,
        },
      ],
      isError: true,
    };
  }
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(response.data ?? response.message ?? { success: true }),
      },
    ],
  };
}

export function registerIdeaTools(server: McpServer, api: ApiClient): void {
  defineTool(server, "bulk_ideas", "Create, update, move, complete, or delete up to 50 Ideas boards, columns, cards, or checklist items in one call. Operations execute in order and return indexed success/error results. Not atomic: successful operations stay saved if another fails. Do not retry successful creates. Create parents first, then use the returned UUIDs in a subsequent call. Deleting a board/column also deletes its contents. Promotion uses promote_idea separately.",
    { operations: z.array(operations).min(1).max(50) }, async (input) => {
      const results = [];
      for (const [index, op] of input.operations.entries()) {
        try {
          const response = await executeOperation(api, op);
          results.push({ index, action: op.action, success: response.success, data: response.data ?? response.message, error: response.error });
        } catch (error) {
          results.push({ index, action: op.action, success: false, error: { message: error instanceof Error ? error.message : "Request failed" } });
        }
      }
      return { content: [{ type: "text" as const, text: JSON.stringify({ results }) }], isError: results.some((r) => !r.success) };
    });
  defineTool(server, "get_idea", "Get one idea card, its checklist, and the ID of its planner task if promoted.", { id }, async ({ id }) => result(await api.getIdea(id), "Failed to get idea"));

  defineTool(
    server,
    "list_idea_boards",
    "List the user's Ideas boards in display order.",
    {},
    async () => result(await api.listIdeaBoards(), "Failed to list boards")
  );

  defineTool(
    server,
    "create_idea_board",
    "Create an Ideas board. The server also creates an initial column named Ideas; the response includes that column and its ID.",
    {
      name,
      icon: icon.optional(),
      color: color.optional(),
      position: position.optional(),
    },
    async (input) =>
      result(await api.createIdeaBoard(input), "Failed to create board")
  );

  defineTool(
    server,
    "update_idea_board",
    "Rename, recolor, change the icon, or position an Ideas board.",
    {
      id,
      name: name.optional(),
      icon: icon.optional(),
      color: color.optional(),
      position: position.optional(),
    },
    async ({ id, ...data }) =>
      result(await api.updateIdeaBoard(id, data), "Failed to update board")
  );

  defineTool(
    server,
    "delete_idea_board",
    "Delete a board and all its columns, ideas, and idea subtasks permanently.",
    { id },
    async ({ id }) =>
      result(await api.deleteIdeaBoard(id), "Failed to delete board")
  );

  defineTool(
    server,
    "reorder_idea_boards",
    "Set the display order of all Ideas boards. Supply their IDs in the desired order.",
    { boardIds: ids },
    async ({ boardIds }) =>
      result(await api.reorderIdeaBoards(boardIds), "Failed to reorder boards")
  );

  defineTool(
    server,
    "list_idea_columns",
    "List the columns on one Ideas board in display order.",
    { boardId: id },
    async ({ boardId }) =>
      result(await api.listIdeaColumns(boardId), "Failed to list columns")
  );

  defineTool(
    server,
    "create_idea_column",
    "Create a column on an Ideas board.",
    { boardId: id, name, position: position.optional() },
    async (input) =>
      result(await api.createIdeaColumn(input), "Failed to create column")
  );

  defineTool(
    server,
    "update_idea_column",
    "Rename or position an Ideas column.",
    { id, name: name.optional(), position: position.optional() },
    async ({ id, ...data }) =>
      result(await api.updateIdeaColumn(id, data), "Failed to update column")
  );

  defineTool(
    server,
    "delete_idea_column",
    "Delete a column and all its ideas and idea subtasks permanently.",
    { id },
    async ({ id }) =>
      result(await api.deleteIdeaColumn(id), "Failed to delete column")
  );

  defineTool(
    server,
    "reorder_idea_columns",
    "Set the display order of all columns on a board. Supply their IDs in the desired order.",
    { boardId: id, columnIds: ids },
    async ({ boardId, columnIds }) =>
      result(
        await api.reorderIdeaColumns(boardId, columnIds),
        "Failed to reorder columns"
      )
  );

  defineTool(
    server,
    "list_ideas",
    "List idea cards, optionally filtered by board, column, or completion. The response includes each card's ID, fields, and subtask counts.",
    {
      boardId: id.optional(),
      columnId: id.optional(),
      completed: z.boolean().optional(),
    },
    async (input) => result(await api.listIdeas(input), "Failed to list ideas")
  );

  defineTool(
    server,
    "create_idea",
    "Create an idea card in a column on the specified board.",
    {
      boardId: id,
      columnId: id,
      title,
      notes: notes.optional(),
      estimatedMins: estimatedMins.optional(),
      priority: priority.optional(),
      position: position.optional(),
    },
    async (input) =>
      result(await api.createIdea(input), "Failed to create idea")
  );

  defineTool(
    server,
    "update_idea",
    "Edit an idea card, move it to another column, or set completedAt to an ISO timestamp or null to mark it done or reopen it.",
    {
      id,
      title: title.optional(),
      notes: notes.optional(),
      estimatedMins: estimatedMins.optional(),
      priority: priority.optional(),
      columnId: id.optional(),
      position: position.optional(),
      completedAt: z.string().datetime().nullable().optional(),
    },
    async ({ id, ...data }) =>
      result(await api.updateIdea(id, data), "Failed to update idea")
  );

  defineTool(
    server,
    "delete_idea",
    "Delete an idea card and its subtasks permanently. A task previously promoted from it remains a task.",
    { id },
    async ({ id }) => result(await api.deleteIdea(id), "Failed to delete idea")
  );

  defineTool(
    server,
    "reorder_ideas",
    "Set the order of cards in a column. Cards can be moved from another column or board. Supply the complete destination order.",
    { columnId: id, ideaIds: ids },
    async ({ columnId, ideaIds }) =>
      result(
        await api.reorderIdeas(columnId, ideaIds),
        "Failed to reorder ideas"
      )
  );

  defineTool(
    server,
    "promote_idea",
    "Create a planner task from an idea card. Omit scheduledDate to put the task in the backlog. The idea remains and records the task ID. Repeating promotion returns the existing task without making a duplicate; use schedule_task to move it.",
    {
      id,
      scheduledDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .nullable()
        .optional(),
    },
    async ({ id, scheduledDate }) =>
      result(await api.promoteIdea(id, scheduledDate), "Failed to promote idea")
  );

  defineTool(
    server,
    "list_idea_subtasks",
    "List an idea card's checklist items.",
    { ideaId: id },
    async ({ ideaId }) =>
      result(await api.listIdeaSubtasks(ideaId), "Failed to list idea subtasks")
  );

  defineTool(
    server,
    "create_idea_subtask",
    "Add a checklist item to an idea card.",
    { ideaId: id, title, position: position.optional() },
    async ({ ideaId, ...data }) =>
      result(
        await api.createIdeaSubtask(ideaId, data),
        "Failed to create idea subtask"
      )
  );

  defineTool(
    server,
    "update_idea_subtask",
    "Rename, complete, reopen, or position an idea checklist item.",
    {
      ideaId: id,
      id,
      title: title.optional(),
      completed: z.boolean().optional(),
      position: position.optional(),
    },
    async ({ ideaId, id, ...data }) =>
      result(
        await api.updateIdeaSubtask(ideaId, id, data),
        "Failed to update idea subtask"
      )
  );

  defineTool(
    server,
    "delete_idea_subtask",
    "Delete an idea checklist item permanently.",
    { ideaId: id, id },
    async ({ ideaId, id }) =>
      result(
        await api.deleteIdeaSubtask(ideaId, id),
        "Failed to delete idea subtask"
      )
  );

  defineTool(
    server,
    "reorder_idea_subtasks",
    "Set the order of checklist items on an idea card. Supply their IDs in the desired order.",
    { ideaId: id, subtaskIds: ids },
    async ({ ideaId, subtaskIds }) =>
      result(
        await api.reorderIdeaSubtasks(ideaId, subtaskIds),
        "Failed to reorder idea subtasks"
      )
  );
}
