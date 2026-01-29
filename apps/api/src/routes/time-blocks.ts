/**
 * Time block routes for Chronoflow API
 * Handles CRUD operations for time blocks
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getDb, eq, and, asc, timeBlocks, tasks, sql } from '@chronoflow/database';
import { NotFoundError, uuidSchema, dateSchema, timeSchema } from '@chronoflow/utils';
import { auth, requireScopes, type AuthVariables } from '../middleware/auth.js';

const timeBlocksRouter = new Hono<{ Variables: AuthVariables }>();

// Apply authentication to all routes
timeBlocksRouter.use('*', auth);

// Validation schemas
const createTimeBlockSchema = z.object({
  taskId: uuidSchema.optional().nullable(),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(1000).optional().nullable(),
  date: dateSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional().default('#3B82F6'),
  position: z.number().int().nonnegative().optional(),
}).refine(
  (data) => {
    const [startHour, startMin] = data.startTime.split(':').map(Number);
    const [endHour, endMin] = data.endTime.split(':').map(Number);
    const startMinutes = (startHour ?? 0) * 60 + (startMin ?? 0);
    const endMinutes = (endHour ?? 0) * 60 + (endMin ?? 0);
    return endMinutes > startMinutes;
  },
  { message: 'End time must be after start time', path: ['endTime'] }
);

const updateTimeBlockSchema = z.object({
  taskId: uuidSchema.optional().nullable(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  date: dateSchema.optional(),
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional().nullable(),
  position: z.number().int().nonnegative().optional(),
}).refine(
  (data) => {
    // Only validate if both times are provided
    if (data.startTime && data.endTime) {
      const [startHour, startMin] = data.startTime.split(':').map(Number);
      const [endHour, endMin] = data.endTime.split(':').map(Number);
      const startMinutes = (startHour ?? 0) * 60 + (startMin ?? 0);
      const endMinutes = (endHour ?? 0) * 60 + (endMin ?? 0);
      return endMinutes > startMinutes;
    }
    return true;
  },
  { message: 'End time must be after start time', path: ['endTime'] }
);

const timeBlockFilterSchema = z.object({
  date: dateSchema.optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  taskId: uuidSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

/**
 * Calculate duration in minutes from start and end times
 */
function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const startMinutes = (startHour ?? 0) * 60 + (startMin ?? 0);
  const endMinutes = (endHour ?? 0) * 60 + (endMin ?? 0);
  return endMinutes - startMinutes;
}

/**
 * GET /time-blocks
 * List time blocks with filters
 */
timeBlocksRouter.get(
  '/',
  requireScopes('time-blocks:read'),
  zValidator('query', timeBlockFilterSchema),
  async (c) => {
    const userId = c.get('userId');
    const filters = c.req.valid('query');
    const db = getDb();

    // Build query conditions
    const conditions = [eq(timeBlocks.userId, userId)];

    // Filter by specific date
    if (filters.date) {
      conditions.push(eq(timeBlocks.date, filters.date));
    }

    // Filter by date range
    if (filters.from) {
      conditions.push(sql`${timeBlocks.date} >= ${filters.from}`);
    }
    if (filters.to) {
      conditions.push(sql`${timeBlocks.date} <= ${filters.to}`);
    }

    // Filter by task ID
    if (filters.taskId) {
      conditions.push(eq(timeBlocks.taskId, filters.taskId));
    }

    // Calculate pagination
    const offset = (filters.page - 1) * filters.limit;

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(timeBlocks)
      .where(and(...conditions));

    const total = countResult?.count || 0;

    // Get paginated results with associated tasks
    const results = await db
      .select({
        timeBlock: timeBlocks,
        task: tasks,
      })
      .from(timeBlocks)
      .leftJoin(tasks, eq(timeBlocks.taskId, tasks.id))
      .where(and(...conditions))
      .orderBy(asc(timeBlocks.date), asc(timeBlocks.startTime), asc(timeBlocks.position))
      .limit(filters.limit)
      .offset(offset);

    // Format results
    const formattedResults = results.map(({ timeBlock, task }) => ({
      ...timeBlock,
      task: task || null,
    }));

    return c.json({
      success: true,
      data: formattedResults,
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
 * POST /time-blocks
 * Create a new time block
 */
timeBlocksRouter.post(
  '/',
  requireScopes('time-blocks:write'),
  zValidator('json', createTimeBlockSchema),
  async (c) => {
    const userId = c.get('userId');
    const data = c.req.valid('json');
    const db = getDb();

    // If taskId provided, verify it exists and belongs to user
    if (data.taskId) {
      const [task] = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, data.taskId), eq(tasks.userId, userId)))
        .limit(1);

      if (!task) {
        throw new NotFoundError('Task', data.taskId);
      }
    }

    // Calculate duration
    const durationMins = calculateDuration(data.startTime, data.endTime);

    // If no position specified, get the max position for the date and add 1
    let position = data.position;
    if (position === undefined) {
      const [maxPosition] = await db
        .select({ max: sql<number>`COALESCE(MAX(${timeBlocks.position}), -1)` })
        .from(timeBlocks)
        .where(
          and(
            eq(timeBlocks.userId, userId),
            eq(timeBlocks.date, data.date)
          )
        );

      position = (maxPosition?.max ?? -1) + 1;
    }

    const [newTimeBlock] = await db
      .insert(timeBlocks)
      .values({
        userId,
        taskId: data.taskId ?? null,
        title: data.title,
        description: data.description ?? null,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        durationMins,
        color: data.color,
        position,
      })
      .returning();

    // Fetch associated task if any
    let task = null;
    if (newTimeBlock && newTimeBlock.taskId) {
      [task] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, newTimeBlock.taskId))
        .limit(1);
    }

    return c.json({
      success: true,
      data: { ...newTimeBlock, task },
    }, 201);
  }
);

/**
 * GET /time-blocks/:id
 * Get a single time block by ID
 */
timeBlocksRouter.get(
  '/:id',
  requireScopes('time-blocks:read'),
  zValidator('param', z.object({ id: uuidSchema })),
  async (c) => {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const db = getDb();

    const [result] = await db
      .select({
        timeBlock: timeBlocks,
        task: tasks,
      })
      .from(timeBlocks)
      .leftJoin(tasks, eq(timeBlocks.taskId, tasks.id))
      .where(and(eq(timeBlocks.id, id), eq(timeBlocks.userId, userId)))
      .limit(1);

    if (!result) {
      throw new NotFoundError('Time block', id);
    }

    return c.json({
      success: true,
      data: {
        ...result.timeBlock,
        task: result.task || null,
      },
    });
  }
);

/**
 * PATCH /time-blocks/:id
 * Update a time block
 */
timeBlocksRouter.patch(
  '/:id',
  requireScopes('time-blocks:write'),
  zValidator('param', z.object({ id: uuidSchema })),
  zValidator('json', updateTimeBlockSchema),
  async (c) => {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const updates = c.req.valid('json');
    const db = getDb();

    // Check if time block exists and belongs to user
    const [existing] = await db
      .select()
      .from(timeBlocks)
      .where(and(eq(timeBlocks.id, id), eq(timeBlocks.userId, userId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Time block', id);
    }

    // If taskId provided, verify it exists and belongs to user
    if (updates.taskId) {
      const [task] = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, updates.taskId), eq(tasks.userId, userId)))
        .limit(1);

      if (!task) {
        throw new NotFoundError('Task', updates.taskId);
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (updates.taskId !== undefined) {
      updateData.taskId = updates.taskId;
    }
    if (updates.title !== undefined) {
      updateData.title = updates.title;
    }
    if (updates.description !== undefined) {
      updateData.description = updates.description;
    }
    if (updates.date !== undefined) {
      updateData.date = updates.date;
    }
    if (updates.startTime !== undefined) {
      updateData.startTime = updates.startTime;
    }
    if (updates.endTime !== undefined) {
      updateData.endTime = updates.endTime;
    }
    if (updates.color !== undefined) {
      updateData.color = updates.color;
    }
    if (updates.position !== undefined) {
      updateData.position = updates.position;
    }

    // Recalculate duration if times changed
    const newStartTime = updates.startTime ?? existing.startTime;
    const newEndTime = updates.endTime ?? existing.endTime;
    if (updates.startTime !== undefined || updates.endTime !== undefined) {
      updateData.durationMins = calculateDuration(newStartTime, newEndTime);
    }

    const [updatedTimeBlock] = await db
      .update(timeBlocks)
      .set(updateData)
      .where(and(eq(timeBlocks.id, id), eq(timeBlocks.userId, userId)))
      .returning();

    // Fetch associated task if any
    let task = null;
    if (updatedTimeBlock && updatedTimeBlock.taskId) {
      [task] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, updatedTimeBlock.taskId))
        .limit(1);
    }

    return c.json({
      success: true,
      data: { ...updatedTimeBlock, task },
    });
  }
);

/**
 * DELETE /time-blocks/:id
 * Delete a time block
 */
timeBlocksRouter.delete(
  '/:id',
  requireScopes('time-blocks:write'),
  zValidator('param', z.object({ id: uuidSchema })),
  async (c) => {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const db = getDb();

    // Check if time block exists and belongs to user
    const [existing] = await db
      .select()
      .from(timeBlocks)
      .where(and(eq(timeBlocks.id, id), eq(timeBlocks.userId, userId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Time block', id);
    }

    await db
      .delete(timeBlocks)
      .where(and(eq(timeBlocks.id, id), eq(timeBlocks.userId, userId)));

    return c.json({ success: true, message: 'Time block deleted successfully' });
  }
);

export { timeBlocksRouter };
