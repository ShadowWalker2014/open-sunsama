/**
 * Task routes for Open Sunsama API
 * Handles CRUD operations for tasks
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getDb, eq, and, isNull, isNotNull, desc, asc, tasks, sql } from '@open-sunsama/database';
import { NotFoundError, uuidSchema } from '@open-sunsama/utils';
import { auth, requireScopes, type AuthVariables } from '../middleware/auth.js';
import { createTaskSchema, updateTaskSchema, taskFilterSchema, reorderTasksSchema } from '../validation/tasks.js';

const tasksRouter = new Hono<{ Variables: AuthVariables }>();
tasksRouter.use('*', auth);

/** GET /tasks - List tasks with filters */
tasksRouter.get('/', requireScopes('tasks:read'), zValidator('query', taskFilterSchema), async (c) => {
  const userId = c.get('userId');
  const filters = c.req.valid('query');
  const db = getDb();
  const conditions = [eq(tasks.userId, userId)];

  if (filters.date) conditions.push(eq(tasks.scheduledDate, filters.date));
  if (filters.from) conditions.push(sql`${tasks.scheduledDate} >= ${filters.from}`);
  if (filters.to) conditions.push(sql`${tasks.scheduledDate} <= ${filters.to}`);
  if (filters.completed === 'true') conditions.push(isNotNull(tasks.completedAt));
  else if (filters.completed === 'false') conditions.push(isNull(tasks.completedAt));
  if (filters.backlog === 'true') conditions.push(isNull(tasks.scheduledDate));
  else if (filters.backlog === 'false') conditions.push(isNotNull(tasks.scheduledDate));
  if (filters.priority) conditions.push(eq(tasks.priority, filters.priority));

  const offset = (filters.page - 1) * filters.limit;
  const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(tasks).where(and(...conditions));
  const total = countResult?.count || 0;

  // Determine sort order based on sortBy parameter
  let orderByClause;
  if (filters.sortBy === 'priority') {
    // P0 first, then P1, P2, P3 (alphabetically works for P0-P3)
    orderByClause = [asc(tasks.priority), asc(tasks.position), desc(tasks.createdAt)];
  } else if (filters.sortBy === 'createdAt') {
    orderByClause = [desc(tasks.createdAt)];
  } else {
    // Default: position (original behavior)
    orderByClause = [asc(tasks.scheduledDate), asc(tasks.position), desc(tasks.createdAt)];
  }

  const results = await db.select().from(tasks).where(and(...conditions))
    .orderBy(...orderByClause)
    .limit(filters.limit).offset(offset);

  return c.json({
    success: true, data: results,
    meta: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) },
  });
});

/** POST /tasks - Create a new task */
tasksRouter.post('/', requireScopes('tasks:write'), zValidator('json', createTaskSchema), async (c) => {
  const userId = c.get('userId');
  const data = c.req.valid('json');
  const db = getDb();

  let position = data.position;
  if (position === undefined) {
    const scheduledDate = data.scheduledDate || null;
    const [maxPos] = await db.select({ max: sql<number>`COALESCE(MAX(${tasks.position}), -1)` }).from(tasks)
      .where(and(eq(tasks.userId, userId), scheduledDate ? eq(tasks.scheduledDate, scheduledDate) : isNull(tasks.scheduledDate)));
    position = (maxPos?.max ?? -1) + 1;
  }

  const [newTask] = await db.insert(tasks).values({
    userId, title: data.title, notes: data.notes ?? null,
    scheduledDate: data.scheduledDate ?? null, estimatedMins: data.estimatedMins ?? null,
    priority: data.priority ?? 'P2', position,
  }).returning();

  return c.json({ success: true, data: newTask }, 201);
});

/** GET /tasks/:id - Get a single task by ID */
tasksRouter.get('/:id', requireScopes('tasks:read'), zValidator('param', z.object({ id: uuidSchema })), async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.valid('param');
  const db = getDb();

  const [task] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).limit(1);
  if (!task) throw new NotFoundError('Task', id);

  return c.json({ success: true, data: task });
});

/** PATCH /tasks/:id - Update a task */
tasksRouter.patch('/:id', requireScopes('tasks:write'), zValidator('param', z.object({ id: uuidSchema })), zValidator('json', updateTaskSchema), async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.valid('param');
  const updates = c.req.valid('json');
  const db = getDb();

  const [existing] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).limit(1);
  if (!existing) throw new NotFoundError('Task', id);

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.notes !== undefined) updateData.notes = updates.notes;
  if (updates.scheduledDate !== undefined) updateData.scheduledDate = updates.scheduledDate;
  if (updates.estimatedMins !== undefined) updateData.estimatedMins = updates.estimatedMins;
  if (updates.priority !== undefined) updateData.priority = updates.priority;
  if (updates.completedAt !== undefined) updateData.completedAt = updates.completedAt ? new Date(updates.completedAt) : null;
  if (updates.position !== undefined) updateData.position = updates.position;

  const [updatedTask] = await db.update(tasks).set(updateData).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).returning();
  return c.json({ success: true, data: updatedTask });
});

/** DELETE /tasks/:id - Delete a task */
tasksRouter.delete('/:id', requireScopes('tasks:write'), zValidator('param', z.object({ id: uuidSchema })), async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.valid('param');
  const db = getDb();

  const [existing] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).limit(1);
  if (!existing) throw new NotFoundError('Task', id);

  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  return c.json({ success: true, message: 'Task deleted successfully' });
});

/** POST /tasks/:id/complete - Mark a task as complete */
tasksRouter.post('/:id/complete', requireScopes('tasks:write'), zValidator('param', z.object({ id: uuidSchema })), async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.valid('param');
  const db = getDb();

  const [existing] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).limit(1);
  if (!existing) throw new NotFoundError('Task', id);

  const [updatedTask] = await db.update(tasks).set({ completedAt: new Date(), updatedAt: new Date() }).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).returning();
  return c.json({ success: true, data: updatedTask });
});

/** POST /tasks/:id/uncomplete - Mark a task as incomplete */
tasksRouter.post('/:id/uncomplete', requireScopes('tasks:write'), zValidator('param', z.object({ id: uuidSchema })), async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.valid('param');
  const db = getDb();

  const [existing] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).limit(1);
  if (!existing) throw new NotFoundError('Task', id);

  const [updatedTask] = await db.update(tasks).set({ completedAt: null, updatedAt: new Date() }).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).returning();
  return c.json({ success: true, data: updatedTask });
});

/** POST /tasks/reorder - Reorder tasks for a specific date */
tasksRouter.post('/reorder', requireScopes('tasks:write'), zValidator('json', reorderTasksSchema), async (c) => {
  const userId = c.get('userId');
  const { date, taskIds } = c.req.valid('json');
  const db = getDb();

  const isBacklog = date === 'backlog';
  const targetDate = isBacklog ? null : date;

  // Update each task with new position and scheduled date
  // This handles both reordering within a date AND moving tasks between dates
  await Promise.all(taskIds.map((taskId, index) =>
    db.update(tasks)
      .set({ 
        position: index, 
        scheduledDate: targetDate,
        updatedAt: new Date() 
      })
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
  ));

  // Fetch all tasks for the target date
  const dateCondition = isBacklog ? isNull(tasks.scheduledDate) : eq(tasks.scheduledDate, date);
  const updatedTasks = await db.select().from(tasks)
    .where(and(eq(tasks.userId, userId), dateCondition))
    .orderBy(asc(tasks.position));

  return c.json({ success: true, data: updatedTasks, message: 'Tasks reordered successfully' });
});

export { tasksRouter };
