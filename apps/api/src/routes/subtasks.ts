/**
 * Subtask routes for Open Sunsama API
 * Handles CRUD operations for subtasks within tasks
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { getDb, eq, and, asc, subtasks, tasks, sql } from '@open-sunsama/database';
import { NotFoundError } from '@open-sunsama/utils';
import { auth, requireScopes, type AuthVariables } from '../middleware/auth.js';
import {
  createSubtaskSchema,
  updateSubtaskSchema,
  reorderSubtasksSchema,
  taskIdParamSchema,
  subtaskIdParamSchema,
} from '../validation/subtasks.js';
import { publishEvent } from '../lib/websocket/index.js';

const subtasksRouter = new Hono<{ Variables: AuthVariables }>();
subtasksRouter.use('*', auth);

/**
 * Helper function to verify task ownership
 */
async function verifyTaskOwnership(db: ReturnType<typeof getDb>, taskId: string, userId: string) {
  const [task] = await db.select().from(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId))).limit(1);
  if (!task) throw new NotFoundError('Task', taskId);
  return task;
}

/** GET /tasks/:taskId/subtasks - List subtasks for a task */
subtasksRouter.get(
  '/:taskId/subtasks',
  requireScopes('tasks:read'),
  zValidator('param', taskIdParamSchema),
  async (c) => {
    const userId = c.get('userId');
    const { taskId } = c.req.valid('param');
    const db = getDb();

    // Verify task ownership
    await verifyTaskOwnership(db, taskId, userId);

    const results = await db
      .select()
      .from(subtasks)
      .where(eq(subtasks.taskId, taskId))
      .orderBy(asc(subtasks.position), asc(subtasks.createdAt));

    return c.json({ success: true, data: results });
  }
);

/** POST /tasks/:taskId/subtasks - Create a subtask */
subtasksRouter.post(
  '/:taskId/subtasks',
  requireScopes('tasks:write'),
  zValidator('param', taskIdParamSchema),
  zValidator('json', createSubtaskSchema),
  async (c) => {
    const userId = c.get('userId');
    const { taskId } = c.req.valid('param');
    const data = c.req.valid('json');
    const db = getDb();

    // Verify task ownership
    await verifyTaskOwnership(db, taskId, userId);

    // Get max position if not provided
    let position = data.position;
    if (position === undefined) {
      const [maxPos] = await db
        .select({ max: sql<number>`COALESCE(MAX(${subtasks.position}), -1)` })
        .from(subtasks)
        .where(eq(subtasks.taskId, taskId));
      position = (maxPos?.max ?? -1) + 1;
    }

    const [newSubtask] = await db
      .insert(subtasks)
      .values({
        taskId,
        title: data.title,
        position,
      })
      .returning();

    // Publish realtime event (fire and forget) - subtask change affects parent task
    if (process.env.REDIS_URL) {
      // Get parent task's scheduledDate for the event payload
      const [parentTask] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
      publishEvent(userId, 'task:updated', {
        taskId,
        scheduledDate: parentTask?.scheduledDate ?? null,
      });
    }

    return c.json({ success: true, data: newSubtask }, 201);
  }
);

/** PATCH /tasks/:taskId/subtasks/:id - Update a subtask */
subtasksRouter.patch(
  '/:taskId/subtasks/:id',
  requireScopes('tasks:write'),
  zValidator('param', subtaskIdParamSchema),
  zValidator('json', updateSubtaskSchema),
  async (c) => {
    const userId = c.get('userId');
    const { taskId, id } = c.req.valid('param');
    const updates = c.req.valid('json');
    const db = getDb();

    // Verify task ownership
    await verifyTaskOwnership(db, taskId, userId);

    // Verify subtask exists and belongs to task
    const [existing] = await db
      .select()
      .from(subtasks)
      .where(and(eq(subtasks.id, id), eq(subtasks.taskId, taskId)))
      .limit(1);
    if (!existing) throw new NotFoundError('Subtask', id);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.completed !== undefined) updateData.completed = updates.completed;
    if (updates.position !== undefined) updateData.position = updates.position;

    const [updatedSubtask] = await db
      .update(subtasks)
      .set(updateData)
      .where(and(eq(subtasks.id, id), eq(subtasks.taskId, taskId)))
      .returning();

    // Publish realtime event (fire and forget) - subtask change affects parent task
    if (process.env.REDIS_URL) {
      // Get parent task's scheduledDate for the event payload
      const [parentTask] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
      publishEvent(userId, 'task:updated', {
        taskId,
        scheduledDate: parentTask?.scheduledDate ?? null,
      });
    }

    return c.json({ success: true, data: updatedSubtask });
  }
);

/** DELETE /tasks/:taskId/subtasks/:id - Delete a subtask */
subtasksRouter.delete(
  '/:taskId/subtasks/:id',
  requireScopes('tasks:write'),
  zValidator('param', subtaskIdParamSchema),
  async (c) => {
    const userId = c.get('userId');
    const { taskId, id } = c.req.valid('param');
    const db = getDb();

    // Verify task ownership
    await verifyTaskOwnership(db, taskId, userId);

    // Verify subtask exists and belongs to task
    const [existing] = await db
      .select()
      .from(subtasks)
      .where(and(eq(subtasks.id, id), eq(subtasks.taskId, taskId)))
      .limit(1);
    if (!existing) throw new NotFoundError('Subtask', id);

    await db.delete(subtasks).where(and(eq(subtasks.id, id), eq(subtasks.taskId, taskId)));

    // Publish realtime event (fire and forget) - subtask change affects parent task
    if (process.env.REDIS_URL) {
      // Get parent task's scheduledDate for the event payload
      const [parentTask] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
      publishEvent(userId, 'task:updated', {
        taskId,
        scheduledDate: parentTask?.scheduledDate ?? null,
      });
    }

    return c.json({ success: true, message: 'Subtask deleted successfully' });
  }
);

/** POST /tasks/:taskId/subtasks/reorder - Reorder subtasks */
subtasksRouter.post(
  '/:taskId/subtasks/reorder',
  requireScopes('tasks:write'),
  zValidator('param', taskIdParamSchema),
  zValidator('json', reorderSubtasksSchema),
  async (c) => {
    const userId = c.get('userId');
    const { taskId } = c.req.valid('param');
    const { subtaskIds } = c.req.valid('json');
    const db = getDb();

    // Verify task ownership
    await verifyTaskOwnership(db, taskId, userId);

    // Update positions for each subtask
    await Promise.all(
      subtaskIds.map((subtaskId, index) =>
        db
          .update(subtasks)
          .set({ position: index, updatedAt: new Date() })
          .where(and(eq(subtasks.id, subtaskId), eq(subtasks.taskId, taskId)))
      )
    );

    // Fetch updated subtasks
    const updatedSubtasks = await db
      .select()
      .from(subtasks)
      .where(eq(subtasks.taskId, taskId))
      .orderBy(asc(subtasks.position));

    return c.json({ success: true, data: updatedSubtasks, message: 'Subtasks reordered successfully' });
  }
);

export { subtasksRouter };
