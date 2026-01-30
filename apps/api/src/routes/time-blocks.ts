/**
 * Time block routes for Open Sunsama API
 * Handles CRUD operations for time blocks
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getDb, eq, and, asc, timeBlocks, tasks, sql } from '@open-sunsama/database';
import { NotFoundError, uuidSchema } from '@open-sunsama/utils';
import { auth, requireScopes, type AuthVariables } from '../middleware/auth.js';
import {
  createTimeBlockSchema, updateTimeBlockSchema, timeBlockFilterSchema, calculateDuration,
  quickScheduleSchema, calculateEndTime, cascadeResizeSchema, timeToMinutes, minutesToTime,
} from '../validation/time-blocks.js';
import { publishEvent } from '../lib/websocket/index.js';

const timeBlocksRouter = new Hono<{ Variables: AuthVariables }>();
timeBlocksRouter.use('*', auth);

/** GET /time-blocks - List time blocks with filters */
timeBlocksRouter.get('/', requireScopes('time-blocks:read'), zValidator('query', timeBlockFilterSchema), async (c) => {
  const userId = c.get('userId');
  const filters = c.req.valid('query');
  const db = getDb();
  const conditions = [eq(timeBlocks.userId, userId)];

  if (filters.date) conditions.push(eq(timeBlocks.date, filters.date));
  if (filters.from) conditions.push(sql`${timeBlocks.date} >= ${filters.from}`);
  if (filters.to) conditions.push(sql`${timeBlocks.date} <= ${filters.to}`);
  if (filters.taskId) conditions.push(eq(timeBlocks.taskId, filters.taskId));

  const offset = (filters.page - 1) * filters.limit;
  const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(timeBlocks).where(and(...conditions));
  const total = countResult?.count || 0;

  const results = await db
    .select({ timeBlock: timeBlocks, task: tasks })
    .from(timeBlocks)
    .leftJoin(tasks, eq(timeBlocks.taskId, tasks.id))
    .where(and(...conditions))
    .orderBy(asc(timeBlocks.date), asc(timeBlocks.startTime), asc(timeBlocks.position))
    .limit(filters.limit)
    .offset(offset);

  return c.json({
    success: true,
    data: results.map(({ timeBlock, task }) => ({ ...timeBlock, task: task || null })),
    meta: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) },
  });
});

/** POST /time-blocks - Create a new time block */
timeBlocksRouter.post('/', requireScopes('time-blocks:write'), zValidator('json', createTimeBlockSchema), async (c) => {
  const userId = c.get('userId');
  const data = c.req.valid('json');
  const db = getDb();

  if (data.taskId) {
    const [task] = await db.select().from(tasks).where(and(eq(tasks.id, data.taskId), eq(tasks.userId, userId))).limit(1);
    if (!task) throw new NotFoundError('Task', data.taskId);
  }

  const durationMins = calculateDuration(data.startTime, data.endTime);
  let position = data.position;
  if (position === undefined) {
    const [maxPos] = await db
      .select({ max: sql<number>`COALESCE(MAX(${timeBlocks.position}), -1)` })
      .from(timeBlocks)
      .where(and(eq(timeBlocks.userId, userId), eq(timeBlocks.date, data.date)));
    position = (maxPos?.max ?? -1) + 1;
  }

  const [newTimeBlock] = await db.insert(timeBlocks).values({
    userId, taskId: data.taskId ?? null, title: data.title, description: data.description ?? null,
    date: data.date, startTime: data.startTime, endTime: data.endTime, durationMins, color: data.color, position,
  }).returning();

  let task = null;
  if (newTimeBlock?.taskId) {
    [task] = await db.select().from(tasks).where(eq(tasks.id, newTimeBlock.taskId)).limit(1);
  }

  // Publish realtime event (fire and forget)
  if (newTimeBlock) {
    publishEvent(userId, 'timeblock:created', {
      timeBlockId: newTimeBlock.id,
      date: newTimeBlock.date,
    });
  }

  return c.json({ success: true, data: { ...newTimeBlock, task } }, 201);
});

/** POST /time-blocks/quick-schedule - Create a time block from a task */
timeBlocksRouter.post('/quick-schedule', requireScopes('time-blocks:write'), zValidator('json', quickScheduleSchema), async (c) => {
  const userId = c.get('userId');
  const data = c.req.valid('json');
  const db = getDb();

  // Look up the task
  const [task] = await db.select().from(tasks).where(and(eq(tasks.id, data.taskId), eq(tasks.userId, userId))).limit(1);
  if (!task) throw new NotFoundError('Task', data.taskId);

  // Calculate end time from start time + duration
  const endTime = calculateEndTime(data.startTime, data.durationMins);
  const durationMins = data.durationMins;

  // Get next position for this date
  const [maxPos] = await db
    .select({ max: sql<number>`COALESCE(MAX(${timeBlocks.position}), -1)` })
    .from(timeBlocks)
    .where(and(eq(timeBlocks.userId, userId), eq(timeBlocks.date, data.date)));
  const position = (maxPos?.max ?? -1) + 1;

  // Create time block with task's title and link to task
  const [newTimeBlock] = await db.insert(timeBlocks).values({
    userId,
    taskId: data.taskId,
    title: task.title,
    description: task.notes ?? null,
    date: data.date,
    startTime: data.startTime,
    endTime,
    durationMins,
    color: data.color ?? '#3B82F6',
    position,
  }).returning();

  // Publish realtime event (fire and forget)
  if (newTimeBlock) {
    publishEvent(userId, 'timeblock:created', {
      timeBlockId: newTimeBlock.id,
      date: newTimeBlock.date,
    });
  }

  return c.json({ success: true, data: { ...newTimeBlock, task } }, 201);
});

/** GET /time-blocks/:id - Get a single time block by ID */
timeBlocksRouter.get('/:id', requireScopes('time-blocks:read'), zValidator('param', z.object({ id: uuidSchema })), async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.valid('param');
  const db = getDb();

  const [result] = await db
    .select({ timeBlock: timeBlocks, task: tasks })
    .from(timeBlocks)
    .leftJoin(tasks, eq(timeBlocks.taskId, tasks.id))
    .where(and(eq(timeBlocks.id, id), eq(timeBlocks.userId, userId)))
    .limit(1);

  if (!result) throw new NotFoundError('Time block', id);
  return c.json({ success: true, data: { ...result.timeBlock, task: result.task || null } });
});

/** PATCH /time-blocks/:id - Update a time block */
timeBlocksRouter.patch('/:id', requireScopes('time-blocks:write'), zValidator('param', z.object({ id: uuidSchema })), zValidator('json', updateTimeBlockSchema), async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.valid('param');
  const updates = c.req.valid('json');
  const db = getDb();

  const [existing] = await db.select().from(timeBlocks).where(and(eq(timeBlocks.id, id), eq(timeBlocks.userId, userId))).limit(1);
  if (!existing) throw new NotFoundError('Time block', id);

  if (updates.taskId) {
    const [task] = await db.select().from(tasks).where(and(eq(tasks.id, updates.taskId), eq(tasks.userId, userId))).limit(1);
    if (!task) throw new NotFoundError('Task', updates.taskId);
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (updates.taskId !== undefined) updateData.taskId = updates.taskId;
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.date !== undefined) updateData.date = updates.date;
  if (updates.startTime !== undefined) updateData.startTime = updates.startTime;
  if (updates.endTime !== undefined) updateData.endTime = updates.endTime;
  if (updates.color !== undefined) updateData.color = updates.color;
  if (updates.position !== undefined) updateData.position = updates.position;

  if (updates.startTime !== undefined || updates.endTime !== undefined) {
    updateData.durationMins = calculateDuration(updates.startTime ?? existing.startTime, updates.endTime ?? existing.endTime);
  }

  const [updatedTimeBlock] = await db.update(timeBlocks).set(updateData).where(and(eq(timeBlocks.id, id), eq(timeBlocks.userId, userId))).returning();

  let task = null;
  if (updatedTimeBlock?.taskId) {
    [task] = await db.select().from(tasks).where(eq(tasks.id, updatedTimeBlock.taskId)).limit(1);
  }

  // Publish realtime event (fire and forget)
  if (updatedTimeBlock) {
    publishEvent(userId, 'timeblock:updated', {
      timeBlockId: updatedTimeBlock.id,
      date: updatedTimeBlock.date,
    });
  }

  return c.json({ success: true, data: { ...updatedTimeBlock, task } });
});

/** PATCH /time-blocks/:id/cascade-resize - Resize a block and cascade shift subsequent blocks */
timeBlocksRouter.patch('/:id/cascade-resize', requireScopes('time-blocks:write'), zValidator('param', z.object({ id: uuidSchema })), zValidator('json', cascadeResizeSchema), async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.valid('param');
  const { startTime: newStartTime, endTime: newEndTime } = c.req.valid('json');
  const db = getDb();

  // Fetch the target block
  const [targetBlock] = await db.select().from(timeBlocks).where(and(eq(timeBlocks.id, id), eq(timeBlocks.userId, userId))).limit(1);
  if (!targetBlock) throw new NotFoundError('Time block', id);

  const originalStartTime = targetBlock.startTime;
  const targetDate = targetBlock.date;

  // Fetch all blocks for the same date, ordered by start time
  const allBlocks = await db
    .select()
    .from(timeBlocks)
    .where(and(eq(timeBlocks.userId, userId), eq(timeBlocks.date, targetDate)))
    .orderBy(asc(timeBlocks.startTime));

  // Filter to blocks that start AFTER the resized block's original start time (excluding the target)
  const subsequentBlocks = allBlocks.filter(
    (block) => block.id !== id && block.startTime > originalStartTime
  );

  // Calculate the updates needed
  type BlockUpdate = { id: string; startTime: string; endTime: string; durationMins: number };
  const updates: BlockUpdate[] = [];

  // First, add the resized block's update
  const newDuration = calculateDuration(newStartTime, newEndTime);
  updates.push({
    id: targetBlock.id,
    startTime: newStartTime,
    endTime: newEndTime,
    durationMins: newDuration,
  });

  // Track the current "end boundary" - blocks need to shift if they start before this
  let currentEndMinutes = timeToMinutes(newEndTime);

  // Process subsequent blocks in order
  for (let i = 0; i < subsequentBlocks.length; i++) {
    const block = subsequentBlocks[i]!;
    const blockStartMinutes = timeToMinutes(block.startTime);
    const blockEndMinutes = timeToMinutes(block.endTime);
    const blockDuration = blockEndMinutes - blockStartMinutes;

    // Calculate the original gap between this block and the previous one
    let originalGap = 0;
    if (i === 0) {
      // Gap from the target block's original end to this block's start
      const targetOriginalEndMinutes = timeToMinutes(targetBlock.endTime);
      originalGap = Math.max(0, blockStartMinutes - targetOriginalEndMinutes);
    } else {
      // Gap from the previous subsequent block's original end to this block's start
      const prevBlock = subsequentBlocks[i - 1]!;
      const prevEndMinutes = timeToMinutes(prevBlock.endTime);
      originalGap = Math.max(0, blockStartMinutes - prevEndMinutes);
    }

    // Check if this block needs to shift
    if (blockStartMinutes < currentEndMinutes + originalGap) {
      // Shift this block: new start = current end boundary + original gap
      const newBlockStartMinutes = currentEndMinutes + originalGap;
      const newBlockEndMinutes = newBlockStartMinutes + blockDuration;

      updates.push({
        id: block.id,
        startTime: minutesToTime(newBlockStartMinutes),
        endTime: minutesToTime(newBlockEndMinutes),
        durationMins: blockDuration,
      });

      // Update the end boundary for the next block
      currentEndMinutes = newBlockEndMinutes;
    } else {
      // This block doesn't need to shift, but we still need to update the boundary
      // for cascade detection of following blocks
      currentEndMinutes = blockEndMinutes;
    }
  }

  // Execute all updates in a single transaction
  const updatedBlocks = await db.transaction(async (tx) => {
    const results: typeof timeBlocks.$inferSelect[] = [];

    for (const update of updates) {
      const [updated] = await tx
        .update(timeBlocks)
        .set({
          startTime: update.startTime,
          endTime: update.endTime,
          durationMins: update.durationMins,
          updatedAt: new Date(),
        })
        .where(and(eq(timeBlocks.id, update.id), eq(timeBlocks.userId, userId)))
        .returning();

      if (updated) {
        results.push(updated);
      }
    }

    return results;
  });

  // Fetch tasks for all updated blocks
  const updatedBlocksWithTasks = await Promise.all(
    updatedBlocks.map(async (block) => {
      let task = null;
      if (block.taskId) {
        [task] = await db.select().from(tasks).where(eq(tasks.id, block.taskId)).limit(1);
      }
      return { ...block, task };
    })
  );

  // Publish realtime events for all updated blocks
  for (const block of updatedBlocks) {
    publishEvent(userId, 'timeblock:updated', {
      timeBlockId: block.id,
      date: block.date,
    });
  }

  return c.json({ success: true, data: updatedBlocksWithTasks });
});

/** DELETE /time-blocks/:id - Delete a time block */
timeBlocksRouter.delete('/:id', requireScopes('time-blocks:write'), zValidator('param', z.object({ id: uuidSchema })), async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.valid('param');
  const db = getDb();

  const [existing] = await db.select().from(timeBlocks).where(and(eq(timeBlocks.id, id), eq(timeBlocks.userId, userId))).limit(1);
  if (!existing) throw new NotFoundError('Time block', id);

  await db.delete(timeBlocks).where(and(eq(timeBlocks.id, id), eq(timeBlocks.userId, userId)));

  // Publish realtime event (fire and forget)
  publishEvent(userId, 'timeblock:deleted', {
    timeBlockId: id,
    date: existing.date,
  });

  return c.json({ success: true, message: 'Time block deleted successfully' });
});

export { timeBlocksRouter };
