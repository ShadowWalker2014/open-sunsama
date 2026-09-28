/**
 * Idea subtask routes — checklist items under an idea card.
 * Mirrors the task subtasks router; mounted under /ideas.
 * Paths: /ideas/:ideaId/subtasks(/...)
 */
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  getDb,
  eq,
  and,
  asc,
  sql,
  ideas,
  ideaSubtasks,
} from "@open-sunsama/database";
import { NotFoundError, ValidationError } from "@open-sunsama/utils";
import { auth, requireScopes, type AuthVariables } from "../middleware/auth.js";
import {
  createIdeaSubtaskSchema,
  updateIdeaSubtaskSchema,
  reorderIdeaSubtasksSchema,
  ideaIdParamSchema,
  ideaSubtaskIdParamSchema,
} from "../validation/ideas.js";
import { publishEvent } from "../lib/websocket/index.js";

const ideaSubtasksRouter = new Hono<{ Variables: AuthVariables }>();
ideaSubtasksRouter.use("*", auth);

const READ = requireScopes("ideas:read");
const WRITE = requireScopes("ideas:write");

/** Verify the idea belongs to the user; returns it (for boardId/columnId). */
async function getOwnedIdea(userId: string, ideaId: string) {
  const db = getDb();
  const [idea] = await db
    .select()
    .from(ideas)
    .where(and(eq(ideas.id, ideaId), eq(ideas.userId, userId)))
    .limit(1);
  if (!idea) throw new NotFoundError("Idea", ideaId);
  return idea;
}

/** Publish an idea:updated so clients refresh the card + its subtasks. */
function notifyIdea(
  userId: string,
  idea: { id: string; boardId: string; columnId: string }
) {
  publishEvent(userId, "idea:updated", {
    ideaId: idea.id,
    boardId: idea.boardId,
    columnId: idea.columnId,
  });
}

/** GET /ideas/:ideaId/subtasks - list subtasks for an idea */
ideaSubtasksRouter.get(
  "/:ideaId/subtasks",
  READ,
  zValidator("param", ideaIdParamSchema),
  async (c) => {
    const userId = c.get("userId");
    const { ideaId } = c.req.valid("param");
    await getOwnedIdea(userId, ideaId);
    const db = getDb();
    const data = await db
      .select()
      .from(ideaSubtasks)
      .where(eq(ideaSubtasks.ideaId, ideaId))
      .orderBy(asc(ideaSubtasks.position), asc(ideaSubtasks.createdAt));
    return c.json({ success: true, data });
  }
);

/** POST /ideas/:ideaId/subtasks - create a subtask */
ideaSubtasksRouter.post(
  "/:ideaId/subtasks",
  WRITE,
  zValidator("param", ideaIdParamSchema),
  zValidator("json", createIdeaSubtaskSchema),
  async (c) => {
    const userId = c.get("userId");
    const { ideaId } = c.req.valid("param");
    const data = c.req.valid("json");
    const idea = await getOwnedIdea(userId, ideaId);
    const db = getDb();

    let position = data.position;
    if (position === undefined) {
      const [maxPos] = await db
        .select({
          max: sql<number>`COALESCE(MAX(${ideaSubtasks.position}), -1)`,
        })
        .from(ideaSubtasks)
        .where(eq(ideaSubtasks.ideaId, ideaId));
      position = (maxPos?.max ?? -1) + 1;
    }

    const [subtask] = await db
      .insert(ideaSubtasks)
      .values({ ideaId, title: data.title, position })
      .returning();
    if (!subtask) throw new Error("Failed to create subtask");

    notifyIdea(userId, idea);
    return c.json({ success: true, data: subtask }, 201);
  }
);

/** PATCH /ideas/:ideaId/subtasks/:id - update a subtask */
ideaSubtasksRouter.patch(
  "/:ideaId/subtasks/:id",
  WRITE,
  zValidator("param", ideaSubtaskIdParamSchema),
  zValidator("json", updateIdeaSubtaskSchema),
  async (c) => {
    const userId = c.get("userId");
    const { ideaId, id } = c.req.valid("param");
    const updates = c.req.valid("json");
    const idea = await getOwnedIdea(userId, ideaId);
    const db = getDb();

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.completed !== undefined)
      updateData.completed = updates.completed;
    if (updates.position !== undefined) updateData.position = updates.position;

    const [subtask] = await db
      .update(ideaSubtasks)
      .set(updateData)
      .where(and(eq(ideaSubtasks.id, id), eq(ideaSubtasks.ideaId, ideaId)))
      .returning();
    if (!subtask) throw new NotFoundError("Subtask", id);

    notifyIdea(userId, idea);
    return c.json({ success: true, data: subtask });
  }
);

/** DELETE /ideas/:ideaId/subtasks/:id - delete a subtask */
ideaSubtasksRouter.delete(
  "/:ideaId/subtasks/:id",
  WRITE,
  zValidator("param", ideaSubtaskIdParamSchema),
  async (c) => {
    const userId = c.get("userId");
    const { ideaId, id } = c.req.valid("param");
    const idea = await getOwnedIdea(userId, ideaId);
    const db = getDb();

    await db
      .delete(ideaSubtasks)
      .where(and(eq(ideaSubtasks.id, id), eq(ideaSubtasks.ideaId, ideaId)));

    notifyIdea(userId, idea);
    return c.json({ success: true, message: "Subtask deleted successfully" });
  }
);

/** POST /ideas/:ideaId/subtasks/reorder - reorder subtasks */
ideaSubtasksRouter.post(
  "/:ideaId/subtasks/reorder",
  WRITE,
  zValidator("param", ideaIdParamSchema),
  zValidator("json", reorderIdeaSubtasksSchema),
  async (c) => {
    const userId = c.get("userId");
    const { ideaId } = c.req.valid("param");
    const { subtaskIds } = c.req.valid("json");
    const idea = await getOwnedIdea(userId, ideaId);
    const db = getDb();

    const existing = await db.select({ id: ideaSubtasks.id }).from(ideaSubtasks)
      .where(eq(ideaSubtasks.ideaId, ideaId));
    if (existing.length !== subtaskIds.length || existing.some((subtask) => !subtaskIds.includes(subtask.id))) {
      throw new ValidationError("Supply every subtask on this idea exactly once");
    }

    await Promise.all(
      subtaskIds.map((id, index) =>
        db
          .update(ideaSubtasks)
          .set({ position: index, updatedAt: new Date() })
          .where(and(eq(ideaSubtasks.id, id), eq(ideaSubtasks.ideaId, ideaId)))
      )
    );

    const data = await db
      .select()
      .from(ideaSubtasks)
      .where(eq(ideaSubtasks.ideaId, ideaId))
      .orderBy(asc(ideaSubtasks.position));

    notifyIdea(userId, idea);
    return c.json({ success: true, data });
  }
);

export { ideaSubtasksRouter };
