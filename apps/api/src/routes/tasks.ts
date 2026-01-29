/**
 * Task routes for Chronoflow API
 * Handles CRUD operations for tasks
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getDb, eq, and, isNull, isNotNull, desc, asc, tasks, sql } from '@chronoflow/database';
import { NotFoundError, uuidSchema, dateSchema } from '@chronoflow/utils';
import { auth, requireScopes, type AuthVariables } from '../middleware/auth.js';

const tasksRouter = new Hono<{ Variables: AuthVariables }>();

// Apply authentication to all routes
tasksRouter.use('*', auth);

// Validation schemas
const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  notes: z.string().max(5000).optional().nullable(),
  scheduledDate: dateSchema.optional().nullable(),
  estimatedMins: z.number().int().positive().max(480).optional().nullable(),
  position: z.number().int().nonnegative().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  notes: z.string().max(5000).optional().nullable(),
  scheduledDate: dateSchema.optional().nullable(),
  estimatedMins: z.number().int().positive().max(480).optional().nullable(),
  completedAt: z.string().datetime().optional().nullable(),
  position: z.number().int().nonnegative().optional(),
});

const taskFilterSchema = z.object({
  date: dateSchema.optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  completed: z.enum(['true', 'false']).optional(),
  backlog: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const reorderTasksSchema = z.object({
  date: z.union([dateSchema, z.literal('backlog')]),
  taskIds: z.array(uuidSchema).min(1),
});

/**
 * GET /tasks
 * List tasks with filters
 */
tasksRouter.get(
  '/',
  requireScopes('tasks:read'),
  zValidator('query', taskFilterSchema),
  async (c) => {
    const userId = c.get('userId');
    const filters = c.req.valid('query');
    const db = getDb();

    // Build query conditions
    const conditions = [eq(tasks.userId, userId)];

    // Filter by specific date
    if (filters.date) {
      conditions.push(eq(tasks.scheduledDate, filters.date));
    }

    // Filter by date range
    if (filters.from) {
      conditions.push(sql`${tasks.scheduledDate} >= ${filters.from}`);
    }
    if (filters.to) {
      conditions.push(sql`${tasks.scheduledDate} <= ${filters.to}`);
    }

    // Filter by completion status
    if (filters.completed === 'true') {
      conditions.push(isNotNull(tasks.completedAt));
    } else if (filters.completed === 'false') {
      conditions.push(isNull(tasks.completedAt));
    }

    // Filter backlog (unscheduled tasks)
    if (filters.backlog === 'true') {
      conditions.push(isNull(tasks.scheduledDate));
    } else if (filters.backlog === 'false') {
      conditions.push(isNotNull(tasks.scheduledDate));
    }

    // Calculate pagination
    const offset = (filters.page - 1) * filters.limit;

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tasks)
      .where(and(...conditions));

    const total = countResult?.count || 0;

    // Get paginated results
    const results = await db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(asc(tasks.scheduledDate), asc(tasks.position), desc(tasks.createdAt))
      .limit(filters.limit)
      .offset(offset);

    return c.json({
      success: true,
      data: results,
      meta: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    });
  }
);

/**
 * POST /tasks
 * Create a new task
 */
tasksRouter.post(
  '/',
  requireScopes('tasks:write'),
  zValidator('json', createTaskSchema),
  async (c) => {
    const userId = c.get('userId');
    const data = c.req.valid('json');
    const db = getDb();

    // If no position specified, get the max position for the date and add 1
    let position = data.position;
    if (position === undefined) {
      const scheduledDate = data.scheduledDate || null;
      
      const [maxPosition] = await db
        .select({ max: sql<number>`COALESCE(MAX(${tasks.position}), -1)` })
        .from(tasks)
        .where(
          and(
            eq(tasks.userId, userId),
            scheduledDate 
              ? eq(tasks.scheduledDate, scheduledDate)
              : isNull(tasks.scheduledDate)
          )
        );
      
      position = (maxPosition?.max ?? -1) + 1;
    }

    const [newTask] = await db
      .insert(tasks)
      .values({
        userId,
        title: data.title,
        notes: data.notes ?? null,
        scheduledDate: data.scheduledDate ?? null,
        estimatedMins: data.estimatedMins ?? null,
        position,
      })
      .returning();

    return c.json({ success: true, data: newTask }, 201);
  }
);

/**
 * GET /tasks/:id
 * Get a single task by ID
 */
tasksRouter.get(
  '/:id',
  requireScopes('tasks:read'),
  zValidator('param', z.object({ id: uuidSchema })),
  async (c) => {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const db = getDb();

    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .limit(1);

    if (!task) {
      throw new NotFoundError('Task', id);
    }

    return c.json({ success: true, data: task });
  }
);

/**
 * PATCH /tasks/:id
 * Update a task
 */
tasksRouter.patch(
  '/:id',
  requireScopes('tasks:write'),
  zValidator('param', z.object({ id: uuidSchema })),
  zValidator('json', updateTaskSchema),
  async (c) => {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const updates = c.req.valid('json');
    const db = getDb();

    // Check if task exists and belongs to user
    const [existing] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Task', id);
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (updates.title !== undefined) {
      updateData.title = updates.title;
    }
    if (updates.notes !== undefined) {
      updateData.notes = updates.notes;
    }
    if (updates.scheduledDate !== undefined) {
      updateData.scheduledDate = updates.scheduledDate;
    }
    if (updates.estimatedMins !== undefined) {
      updateData.estimatedMins = updates.estimatedMins;
    }
    if (updates.completedAt !== undefined) {
      updateData.completedAt = updates.completedAt ? new Date(updates.completedAt) : null;
    }
    if (updates.position !== undefined) {
      updateData.position = updates.position;
    }

    const [updatedTask] = await db
      .update(tasks)
      .set(updateData)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();

    return c.json({ success: true, data: updatedTask });
  }
);

/**
 * DELETE /tasks/:id
 * Delete a task
 */
tasksRouter.delete(
  '/:id',
  requireScopes('tasks:write'),
  zValidator('param', z.object({ id: uuidSchema })),
  async (c) => {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const db = getDb();

    // Check if task exists and belongs to user
    const [existing] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Task', id);
    }

    await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

    return c.json({ success: true, message: 'Task deleted successfully' });
  }
);

/**
 * POST /tasks/reorder
 * Reorder tasks for a specific date
 */
tasksRouter.post(
  '/reorder',
  requireScopes('tasks:write'),
  zValidator('json', reorderTasksSchema),
  async (c) => {
    const userId = c.get('userId');
    const { date, taskIds } = c.req.valid('json');
    const db = getDb();

    // Update position for each task
    const updatePromises = taskIds.map((taskId, index) =>
      db
        .update(tasks)
        .set({ position: index, updatedAt: new Date() })
        .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    );

    await Promise.all(updatePromises);

    // Fetch updated tasks
    const isBacklog = date === 'backlog';
    const dateCondition = isBacklog
      ? isNull(tasks.scheduledDate)
      : eq(tasks.scheduledDate, date);

    const updatedTasks = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), dateCondition))
      .orderBy(asc(tasks.position));

    return c.json({
      success: true,
      data: updatedTasks,
      message: 'Tasks reordered successfully',
    });
  }
);

export { tasksRouter };
