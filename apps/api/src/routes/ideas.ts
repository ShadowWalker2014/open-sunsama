/**
 * Ideas routes for Open Sunsama API.
 * Trello-style "someday" space: boards → columns → idea cards.
 * Mounted at /ideas.
 */
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  getDb,
  eq,
  and,
  asc,
  isNull,
  isNotNull,
  inArray,
  sql,
  ideaBoards,
  ideaColumns,
  ideas,
  ideaSubtasks,
  tasks,
} from "@open-sunsama/database";
import { NotFoundError, uuidSchema } from "@open-sunsama/utils";
import { auth, requireScopes, type AuthVariables } from "../middleware/auth.js";
import {
  createIdeaBoardSchema,
  updateIdeaBoardSchema,
  reorderIdeaBoardsSchema,
  createIdeaColumnSchema,
  updateIdeaColumnSchema,
  reorderIdeaColumnsSchema,
  createIdeaSchema,
  updateIdeaSchema,
  ideaFilterSchema,
  reorderIdeasSchema,
  promoteIdeaSchema,
} from "../validation/ideas.js";
import { publishEvent } from "../lib/websocket/index.js";

const ideasRouter = new Hono<{ Variables: AuthVariables }>();
ideasRouter.use("*", auth);

const READ = requireScopes("ideas:read");
const WRITE = requireScopes("ideas:write");

/** Verify a board belongs to the user; throws NotFoundError otherwise. */
async function assertBoardOwned(userId: string, boardId: string) {
  const db = getDb();
  const [board] = await db
    .select()
    .from(ideaBoards)
    .where(and(eq(ideaBoards.id, boardId), eq(ideaBoards.userId, userId)))
    .limit(1);
  if (!board) throw new NotFoundError("Board", boardId);
  return board;
}

/** Verify a column belongs to the user; throws NotFoundError otherwise. */
async function assertColumnOwned(userId: string, columnId: string) {
  const db = getDb();
  const [column] = await db
    .select()
    .from(ideaColumns)
    .where(and(eq(ideaColumns.id, columnId), eq(ideaColumns.userId, userId)))
    .limit(1);
  if (!column) throw new NotFoundError("Column", columnId);
  return column;
}

// ═══════════════════════════ BOARDS ═══════════════════════════

/** GET /ideas/boards - list the user's boards */
ideasRouter.get("/boards", READ, async (c) => {
  const userId = c.get("userId");
  const db = getDb();
  const data = await db
    .select()
    .from(ideaBoards)
    .where(eq(ideaBoards.userId, userId))
    .orderBy(asc(ideaBoards.position), asc(ideaBoards.createdAt));
  return c.json({ success: true, data });
});

/** POST /ideas/boards - create a board, seeded with one default column */
ideasRouter.post(
  "/boards",
  WRITE,
  zValidator("json", createIdeaBoardSchema),
  async (c) => {
    const userId = c.get("userId");
    const data = c.req.valid("json");
    const db = getDb();

    let position = data.position;
    if (position === undefined) {
      const [maxPos] = await db
        .select({ max: sql<number>`COALESCE(MAX(${ideaBoards.position}), -1)` })
        .from(ideaBoards)
        .where(eq(ideaBoards.userId, userId));
      position = (maxPos?.max ?? -1) + 1;
    }

    const [board] = await db
      .insert(ideaBoards)
      .values({
        userId,
        name: data.name,
        icon: data.icon ?? "Lightbulb",
        color: data.color ?? "#6366F1",
        position,
      })
      .returning();
    if (!board) throw new Error("Failed to create board");

    // Seed a default column so the board is immediately usable.
    const [column] = await db
      .insert(ideaColumns)
      .values({ userId, boardId: board.id, name: "Ideas", position: 0 })
      .returning();

    publishEvent(userId, "idea-board:created", { boardId: board.id });

    return c.json({ success: true, data: { ...board, columns: [column] } }, 201);
  }
);

/** POST /ideas/boards/reorder - reorder boards in the rail */
ideasRouter.post(
  "/boards/reorder",
  WRITE,
  zValidator("json", reorderIdeaBoardsSchema),
  async (c) => {
    const userId = c.get("userId");
    const { boardIds } = c.req.valid("json");
    const db = getDb();

    await Promise.all(
      boardIds.map((id, index) =>
        db
          .update(ideaBoards)
          .set({ position: index, updatedAt: new Date() })
          .where(and(eq(ideaBoards.id, id), eq(ideaBoards.userId, userId)))
      )
    );

    const data = await db
      .select()
      .from(ideaBoards)
      .where(eq(ideaBoards.userId, userId))
      .orderBy(asc(ideaBoards.position));

    publishEvent(userId, "idea-board:reordered", { boardIds });
    return c.json({ success: true, data });
  }
);

/** PATCH /ideas/boards/:id - rename / recolor / re-icon a board */
ideasRouter.patch(
  "/boards/:id",
  WRITE,
  zValidator("param", z.object({ id: uuidSchema })),
  zValidator("json", updateIdeaBoardSchema),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const updates = c.req.valid("json");
    await assertBoardOwned(userId, id);
    const db = getDb();

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.icon !== undefined) updateData.icon = updates.icon;
    if (updates.color !== undefined) updateData.color = updates.color;
    if (updates.position !== undefined) updateData.position = updates.position;

    const [board] = await db
      .update(ideaBoards)
      .set(updateData)
      .where(and(eq(ideaBoards.id, id), eq(ideaBoards.userId, userId)))
      .returning();

    publishEvent(userId, "idea-board:updated", { boardId: id });
    return c.json({ success: true, data: board });
  }
);

/** DELETE /ideas/boards/:id - delete a board (cascades columns + ideas) */
ideasRouter.delete(
  "/boards/:id",
  WRITE,
  zValidator("param", z.object({ id: uuidSchema })),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    await assertBoardOwned(userId, id);
    const db = getDb();

    await db
      .delete(ideaBoards)
      .where(and(eq(ideaBoards.id, id), eq(ideaBoards.userId, userId)));

    publishEvent(userId, "idea-board:deleted", { boardId: id });
    return c.json({ success: true, message: "Board deleted successfully" });
  }
);

// ═══════════════════════════ COLUMNS ═══════════════════════════

/** GET /ideas/columns?boardId= - list columns for a board */
ideasRouter.get(
  "/columns",
  READ,
  zValidator("query", z.object({ boardId: uuidSchema })),
  async (c) => {
    const userId = c.get("userId");
    const { boardId } = c.req.valid("query");
    const db = getDb();
    const data = await db
      .select()
      .from(ideaColumns)
      .where(
        and(eq(ideaColumns.userId, userId), eq(ideaColumns.boardId, boardId))
      )
      .orderBy(asc(ideaColumns.position), asc(ideaColumns.createdAt));
    return c.json({ success: true, data });
  }
);

/** POST /ideas/columns - add a column to a board */
ideasRouter.post(
  "/columns",
  WRITE,
  zValidator("json", createIdeaColumnSchema),
  async (c) => {
    const userId = c.get("userId");
    const data = c.req.valid("json");
    await assertBoardOwned(userId, data.boardId);
    const db = getDb();

    let position = data.position;
    if (position === undefined) {
      const [maxPos] = await db
        .select({
          max: sql<number>`COALESCE(MAX(${ideaColumns.position}), -1)`,
        })
        .from(ideaColumns)
        .where(eq(ideaColumns.boardId, data.boardId));
      position = (maxPos?.max ?? -1) + 1;
    }

    const [column] = await db
      .insert(ideaColumns)
      .values({ userId, boardId: data.boardId, name: data.name, position })
      .returning();
    if (!column) throw new Error("Failed to create column");

    publishEvent(userId, "idea-column:created", {
      boardId: data.boardId,
      columnId: column.id,
    });
    return c.json({ success: true, data: column }, 201);
  }
);

/** POST /ideas/columns/reorder - reorder columns within a board */
ideasRouter.post(
  "/columns/reorder",
  WRITE,
  zValidator("json", reorderIdeaColumnsSchema),
  async (c) => {
    const userId = c.get("userId");
    const { boardId, columnIds } = c.req.valid("json");
    await assertBoardOwned(userId, boardId);
    const db = getDb();

    await Promise.all(
      columnIds.map((id, index) =>
        db
          .update(ideaColumns)
          .set({ position: index, updatedAt: new Date() })
          .where(
            and(eq(ideaColumns.id, id), eq(ideaColumns.userId, userId))
          )
      )
    );

    const data = await db
      .select()
      .from(ideaColumns)
      .where(
        and(eq(ideaColumns.userId, userId), eq(ideaColumns.boardId, boardId))
      )
      .orderBy(asc(ideaColumns.position));

    publishEvent(userId, "idea-column:reordered", { boardId, columnIds });
    return c.json({ success: true, data });
  }
);

/** PATCH /ideas/columns/:id - rename a column */
ideasRouter.patch(
  "/columns/:id",
  WRITE,
  zValidator("param", z.object({ id: uuidSchema })),
  zValidator("json", updateIdeaColumnSchema),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const updates = c.req.valid("json");
    const existing = await assertColumnOwned(userId, id);
    const db = getDb();

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.position !== undefined) updateData.position = updates.position;

    const [column] = await db
      .update(ideaColumns)
      .set(updateData)
      .where(and(eq(ideaColumns.id, id), eq(ideaColumns.userId, userId)))
      .returning();

    publishEvent(userId, "idea-column:updated", {
      boardId: existing.boardId,
      columnId: id,
    });
    return c.json({ success: true, data: column });
  }
);

/** DELETE /ideas/columns/:id - delete a column (cascades its ideas) */
ideasRouter.delete(
  "/columns/:id",
  WRITE,
  zValidator("param", z.object({ id: uuidSchema })),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const existing = await assertColumnOwned(userId, id);
    const db = getDb();

    await db
      .delete(ideaColumns)
      .where(and(eq(ideaColumns.id, id), eq(ideaColumns.userId, userId)));

    publishEvent(userId, "idea-column:deleted", {
      boardId: existing.boardId,
      columnId: id,
    });
    return c.json({ success: true, message: "Column deleted successfully" });
  }
);

// ═══════════════════════════ IDEAS ═══════════════════════════

/** GET /ideas?boardId=&columnId=&completed= - list idea cards */
ideasRouter.get(
  "/",
  READ,
  zValidator("query", ideaFilterSchema),
  async (c) => {
    const userId = c.get("userId");
    const filters = c.req.valid("query");
    const db = getDb();

    const conditions = [eq(ideas.userId, userId)];
    if (filters.boardId) conditions.push(eq(ideas.boardId, filters.boardId));
    if (filters.columnId) conditions.push(eq(ideas.columnId, filters.columnId));
    if (filters.completed === "true")
      conditions.push(isNotNull(ideas.completedAt));
    else if (filters.completed === "false")
      conditions.push(isNull(ideas.completedAt));

    const rows = await db
      .select()
      .from(ideas)
      .where(and(...conditions))
      .orderBy(asc(ideas.position), asc(ideas.createdAt));

    // Attach subtask totals for the card badge (single grouped query).
    if (rows.length === 0) return c.json({ success: true, data: rows });
    const counts = await db
      .select({
        ideaId: ideaSubtasks.ideaId,
        total: sql<number>`count(*)::int`,
        done: sql<number>`count(*) filter (where ${ideaSubtasks.completed})::int`,
      })
      .from(ideaSubtasks)
      .where(
        inArray(
          ideaSubtasks.ideaId,
          rows.map((r) => r.id)
        )
      )
      .groupBy(ideaSubtasks.ideaId);
    const byId = new Map(counts.map((c2) => [c2.ideaId, c2]));
    const data = rows.map((r) => ({
      ...r,
      subtaskCount: byId.get(r.id)?.total ?? 0,
      subtaskDoneCount: byId.get(r.id)?.done ?? 0,
    }));

    return c.json({ success: true, data });
  }
);

/** POST /ideas - create an idea card in a column */
ideasRouter.post(
  "/",
  WRITE,
  zValidator("json", createIdeaSchema),
  async (c) => {
    const userId = c.get("userId");
    const data = c.req.valid("json");
    const db = getDb();

    // Verify both the board and column belong to the user, and that the
    // column actually lives on that board.
    await assertBoardOwned(userId, data.boardId);
    const column = await assertColumnOwned(userId, data.columnId);
    if (column.boardId !== data.boardId) {
      throw new NotFoundError("Column", data.columnId);
    }

    let position = data.position;
    if (position === undefined) {
      const [maxPos] = await db
        .select({ max: sql<number>`COALESCE(MAX(${ideas.position}), -1)` })
        .from(ideas)
        .where(eq(ideas.columnId, data.columnId));
      position = (maxPos?.max ?? -1) + 1;
    }

    const [idea] = await db
      .insert(ideas)
      .values({
        userId,
        boardId: data.boardId,
        columnId: data.columnId,
        title: data.title,
        notes: data.notes ?? null,
        estimatedMins: data.estimatedMins ?? null,
        priority: data.priority ?? "P2",
        position,
      })
      .returning();
    if (!idea) throw new Error("Failed to create idea");

    publishEvent(userId, "idea:created", {
      ideaId: idea.id,
      boardId: idea.boardId,
      columnId: idea.columnId,
    });
    return c.json({ success: true, data: idea }, 201);
  }
);

/** POST /ideas/reorder - reorder ideas within / into a column */
ideasRouter.post(
  "/reorder",
  WRITE,
  zValidator("json", reorderIdeasSchema),
  async (c) => {
    const userId = c.get("userId");
    const { columnId, ideaIds } = c.req.valid("json");
    const targetColumn = await assertColumnOwned(userId, columnId);
    const db = getDb();

    await Promise.all(
      ideaIds.map((id, index) =>
        db
          .update(ideas)
          .set({
            position: index,
            columnId,
            boardId: targetColumn.boardId,
            updatedAt: new Date(),
          })
          .where(and(eq(ideas.id, id), eq(ideas.userId, userId)))
      )
    );

    const data = await db
      .select()
      .from(ideas)
      .where(and(eq(ideas.userId, userId), eq(ideas.columnId, columnId)))
      .orderBy(asc(ideas.position));

    publishEvent(userId, "idea:reordered", { columnId, ideaIds });
    return c.json({ success: true, data });
  }
);

/** POST /ideas/:id/promote - turn an idea into a real task */
ideasRouter.post(
  "/:id/promote",
  WRITE,
  zValidator("param", z.object({ id: uuidSchema })),
  zValidator("json", promoteIdeaSchema),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const { scheduledDate } = c.req.valid("json");
    const db = getDb();

    const [idea] = await db
      .select()
      .from(ideas)
      .where(and(eq(ideas.id, id), eq(ideas.userId, userId)))
      .limit(1);
    if (!idea) throw new NotFoundError("Idea", id);

    const targetDate = scheduledDate ?? null;

    // Append to the end of the destination (backlog or a given day).
    const [maxPos] = await db
      .select({ max: sql<number>`COALESCE(MAX(${tasks.position}), -1)` })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          targetDate
            ? eq(tasks.scheduledDate, targetDate)
            : isNull(tasks.scheduledDate)
        )
      );
    const position = (maxPos?.max ?? -1) + 1;

    const [task] = await db
      .insert(tasks)
      .values({
        userId,
        title: idea.title,
        notes: idea.notes ?? null,
        scheduledDate: targetDate,
        estimatedMins: idea.estimatedMins,
        priority: idea.priority,
        position,
      })
      .returning();
    if (!task) throw new Error("Failed to create task from idea");

    const [updatedIdea] = await db
      .update(ideas)
      .set({ promotedTaskId: task.id, updatedAt: new Date() })
      .where(and(eq(ideas.id, id), eq(ideas.userId, userId)))
      .returning();

    publishEvent(userId, "task:created", {
      taskId: task.id,
      scheduledDate: task.scheduledDate,
    });
    publishEvent(userId, "idea:updated", {
      ideaId: id,
      boardId: idea.boardId,
      columnId: idea.columnId,
    });

    return c.json(
      { success: true, data: { idea: updatedIdea, task } },
      201
    );
  }
);

/** PATCH /ideas/:id - update an idea card */
ideasRouter.patch(
  "/:id",
  WRITE,
  zValidator("param", z.object({ id: uuidSchema })),
  zValidator("json", updateIdeaSchema),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const updates = c.req.valid("json");
    const db = getDb();

    const [existing] = await db
      .select()
      .from(ideas)
      .where(and(eq(ideas.id, id), eq(ideas.userId, userId)))
      .limit(1);
    if (!existing) throw new NotFoundError("Idea", id);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.estimatedMins !== undefined)
      updateData.estimatedMins = updates.estimatedMins;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.position !== undefined) updateData.position = updates.position;
    if (updates.completedAt !== undefined)
      updateData.completedAt = updates.completedAt
        ? new Date(updates.completedAt)
        : null;
    if (updates.columnId !== undefined) {
      // Moving columns — keep boardId consistent with the target column.
      const target = await assertColumnOwned(userId, updates.columnId);
      updateData.columnId = updates.columnId;
      updateData.boardId = target.boardId;
    }

    const [idea] = await db
      .update(ideas)
      .set(updateData)
      .where(and(eq(ideas.id, id), eq(ideas.userId, userId)))
      .returning();
    if (!idea) throw new NotFoundError("Idea", id);

    publishEvent(userId, "idea:updated", {
      ideaId: id,
      boardId: idea.boardId,
      columnId: idea.columnId,
    });
    return c.json({ success: true, data: idea });
  }
);

/** DELETE /ideas/:id - delete an idea card */
ideasRouter.delete(
  "/:id",
  WRITE,
  zValidator("param", z.object({ id: uuidSchema })),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const db = getDb();

    const [existing] = await db
      .select()
      .from(ideas)
      .where(and(eq(ideas.id, id), eq(ideas.userId, userId)))
      .limit(1);
    if (!existing) throw new NotFoundError("Idea", id);

    await db.delete(ideas).where(and(eq(ideas.id, id), eq(ideas.userId, userId)));

    publishEvent(userId, "idea:deleted", {
      ideaId: id,
      boardId: existing.boardId,
      columnId: existing.columnId,
    });
    return c.json({ success: true, message: "Idea deleted successfully" });
  }
);

export { ideasRouter };
