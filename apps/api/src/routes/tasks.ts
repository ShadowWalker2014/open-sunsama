/**
 * Task routes for Open Sunsama API
 * Handles CRUD operations for tasks
 */
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  getDb,
  eq,
  and,
  lt,
  isNull,
  isNotNull,
  desc,
  asc,
  tasks,
  sql,
  notificationPreferences,
} from "@open-sunsama/database";
import { users, rolloverLogs } from "@open-sunsama/database/schema";
import { NotFoundError, uuidSchema } from "@open-sunsama/utils";
import { auth, requireScopes, type AuthVariables } from "../middleware/auth.js";
import {
  createTaskSchema,
  updateTaskSchema,
  taskFilterSchema,
  reorderTasksSchema,
} from "../validation/tasks.js";
import { publishEvent } from "../lib/websocket/index.js";
import { format, subDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { getPgBoss, JOBS } from "../lib/pgboss.js";

const tasksRouter = new Hono<{ Variables: AuthVariables }>();
tasksRouter.use("*", auth);

/** GET /tasks - List tasks with filters */
tasksRouter.get(
  "/",
  requireScopes("tasks:read"),
  zValidator("query", taskFilterSchema),
  async (c) => {
    const userId = c.get("userId");
    const filters = c.req.valid("query");
    const db = getDb();
    const conditions = [eq(tasks.userId, userId)];

    if (filters.date) conditions.push(eq(tasks.scheduledDate, filters.date));
    if (filters.from)
      conditions.push(sql`${tasks.scheduledDate} >= ${filters.from}`);
    if (filters.to)
      conditions.push(sql`${tasks.scheduledDate} <= ${filters.to}`);
    if (filters.completed === "true")
      conditions.push(isNotNull(tasks.completedAt));
    else if (filters.completed === "false")
      conditions.push(isNull(tasks.completedAt));
    if (filters.backlog === "true")
      conditions.push(isNull(tasks.scheduledDate));
    else if (filters.backlog === "false")
      conditions.push(isNotNull(tasks.scheduledDate));
    if (filters.priority) conditions.push(eq(tasks.priority, filters.priority));

    const offset = (filters.page - 1) * filters.limit;
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tasks)
      .where(and(...conditions));
    const total = countResult?.count || 0;

    // Determine sort order based on sortBy parameter
    let orderByClause;
    if (filters.sortBy === "priority") {
      // P0 first, then P1, P2, P3 (alphabetically works for P0-P3)
      orderByClause = [
        asc(tasks.priority),
        asc(tasks.position),
        desc(tasks.createdAt),
      ];
    } else if (filters.sortBy === "createdAt") {
      orderByClause = [desc(tasks.createdAt)];
    } else {
      // Default: position (original behavior)
      orderByClause = [
        asc(tasks.scheduledDate),
        asc(tasks.position),
        desc(tasks.createdAt),
      ];
    }

    const results = await db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(...orderByClause)
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

/** POST /tasks - Create a new task */
tasksRouter.post(
  "/",
  requireScopes("tasks:write"),
  zValidator("json", createTaskSchema),
  async (c) => {
    const userId = c.get("userId");
    const data = c.req.valid("json");
    const db = getDb();

    let position = data.position;
    if (position === undefined) {
      const scheduledDate = data.scheduledDate || null;
      const [maxPos] = await db
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
      position = (maxPos?.max ?? -1) + 1;
    }

    const [newTask] = await db
      .insert(tasks)
      .values({
        userId,
        title: data.title,
        notes: data.notes ?? null,
        scheduledDate: data.scheduledDate ?? null,
        estimatedMins: data.estimatedMins ?? null,
        priority: data.priority ?? "P2",
        position,
      })
      .returning();

    // Publish realtime event (fire and forget)
    if (newTask) {
      publishEvent(userId, "task:created", {
        taskId: newTask.id,
        scheduledDate: newTask.scheduledDate,
      });
    }

    return c.json({ success: true, data: newTask }, 201);
  }
);

/** GET /tasks/timer/active - Get the currently active timer task */
tasksRouter.get(
  "/timer/active",
  requireScopes("tasks:read"),
  async (c) => {
    const userId = c.get("userId");
    const db = getDb();

    const [activeTask] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), isNotNull(tasks.timerStartedAt)))
      .limit(1);

    return c.json({ success: true, data: activeTask ?? null });
  }
);

/** POST /tasks/:id/timer/start - Start the focus timer for a task */
tasksRouter.post(
  "/:id/timer/start",
  requireScopes("tasks:write"),
  zValidator("param", z.object({ id: uuidSchema })),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const db = getDb();

    // Verify task belongs to user
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .limit(1);
    if (!task) throw new NotFoundError("Task", id);

    let stoppedTask = null;

    // Check if any other task has an active timer — auto-stop it
    const [runningTask] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), isNotNull(tasks.timerStartedAt)))
      .limit(1);

    if (runningTask && runningTask.id !== id) {
      const elapsed = Math.floor(
        (Date.now() - runningTask.timerStartedAt!.getTime()) / 1000
      );
      const totalSeconds = runningTask.timerAccumulatedSeconds + elapsed;
      const actualMins = Math.ceil(totalSeconds / 60);

      const [stopped] = await db
        .update(tasks)
        .set({
          actualMins,
          timerStartedAt: null,
          timerAccumulatedSeconds: 0,
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, runningTask.id))
        .returning();

      stoppedTask = stopped;

      // Broadcast timer:stopped for the auto-stopped task
      publishEvent(userId, "timer:stopped", {
        taskId: runningTask.id,
        actualMins,
      });
    }

    // Start timer on target task
    const [updatedTask] = await db
      .update(tasks)
      .set({
        timerStartedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();

    // Broadcast timer:started event
    if (updatedTask) {
      publishEvent(userId, "timer:started", {
        taskId: updatedTask.id,
        startedAt: updatedTask.timerStartedAt!.toISOString(),
        accumulatedSeconds: updatedTask.timerAccumulatedSeconds,
      });
    }

    return c.json({ success: true, data: updatedTask, stoppedTask });
  }
);

/** POST /tasks/:id/timer/stop - Stop the focus timer for a task */
tasksRouter.post(
  "/:id/timer/stop",
  requireScopes("tasks:write"),
  zValidator("param", z.object({ id: uuidSchema })),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const db = getDb();

    // Verify task belongs to user and timer is running
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .limit(1);
    if (!task) throw new NotFoundError("Task", id);

    if (!task.timerStartedAt) {
      return c.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Timer is not running for this task",
            statusCode: 400,
          },
        },
        400
      );
    }

    // Calculate elapsed time
    const elapsed = Math.floor(
      (Date.now() - task.timerStartedAt.getTime()) / 1000
    );
    const totalSeconds = task.timerAccumulatedSeconds + elapsed;
    const actualMins = Math.ceil(totalSeconds / 60);

    // Update task: save actualMins, clear timer fields
    const [updatedTask] = await db
      .update(tasks)
      .set({
        actualMins,
        timerStartedAt: null,
        timerAccumulatedSeconds: 0,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();

    // Broadcast timer:stopped event
    if (updatedTask) {
      publishEvent(userId, "timer:stopped", {
        taskId: updatedTask.id,
        actualMins,
      });
    }

    return c.json({ success: true, data: updatedTask });
  }
);

/** GET /tasks/:id - Get a single task by ID */
tasksRouter.get(
  "/:id",
  requireScopes("tasks:read"),
  zValidator("param", z.object({ id: uuidSchema })),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const db = getDb();

    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .limit(1);
    if (!task) throw new NotFoundError("Task", id);

    return c.json({ success: true, data: task });
  }
);

/** PATCH /tasks/:id - Update a task */
tasksRouter.patch(
  "/:id",
  requireScopes("tasks:write"),
  zValidator("param", z.object({ id: uuidSchema })),
  zValidator("json", updateTaskSchema),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const updates = c.req.valid("json");
    const db = getDb();

    const [existing] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .limit(1);
    if (!existing) throw new NotFoundError("Task", id);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.scheduledDate !== undefined)
      updateData.scheduledDate = updates.scheduledDate;
    if (updates.estimatedMins !== undefined)
      updateData.estimatedMins = updates.estimatedMins;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.completedAt !== undefined)
      updateData.completedAt = updates.completedAt
        ? new Date(updates.completedAt)
        : null;
    if (updates.position !== undefined) updateData.position = updates.position;
    if (updates.subtasksHidden !== undefined)
      updateData.subtasksHidden = updates.subtasksHidden;
    if (updates.actualMins !== undefined)
      updateData.actualMins = updates.actualMins;

    const [updatedTask] = await db
      .update(tasks)
      .set(updateData)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();

    // Publish realtime event (fire and forget)
    // Use 'task:completed' if completedAt changed to a truthy value, otherwise 'task:updated'
    if (updatedTask) {
      const eventType = updates.completedAt ? "task:completed" : "task:updated";
      publishEvent(userId, eventType, {
        taskId: updatedTask.id,
        scheduledDate: updatedTask.scheduledDate,
      });
    }

    return c.json({ success: true, data: updatedTask });
  }
);

/** DELETE /tasks/:id - Delete a task */
tasksRouter.delete(
  "/:id",
  requireScopes("tasks:write"),
  zValidator("param", z.object({ id: uuidSchema })),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const db = getDb();

    const [existing] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .limit(1);
    if (!existing) throw new NotFoundError("Task", id);

    await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

    // Publish realtime event (fire and forget)
    publishEvent(userId, "task:deleted", {
      taskId: id,
      scheduledDate: existing.scheduledDate,
    });

    return c.json({ success: true, message: "Task deleted successfully" });
  }
);

/** POST /tasks/:id/complete - Mark a task as complete */
tasksRouter.post(
  "/:id/complete",
  requireScopes("tasks:write"),
  zValidator("param", z.object({ id: uuidSchema })),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const db = getDb();

    const [existing] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .limit(1);
    if (!existing) throw new NotFoundError("Task", id);

    // Auto-stop timer if running
    const updateData: Record<string, unknown> = {
      completedAt: new Date(),
      updatedAt: new Date(),
    };

    if (existing.timerStartedAt) {
      const elapsed = Math.floor(
        (Date.now() - existing.timerStartedAt.getTime()) / 1000
      );
      const totalSeconds = existing.timerAccumulatedSeconds + elapsed;
      const actualMins = Math.ceil(totalSeconds / 60);

      updateData.actualMins = actualMins;
      updateData.timerStartedAt = null;
      updateData.timerAccumulatedSeconds = 0;

      // Broadcast timer:stopped before task:completed
      publishEvent(userId, "timer:stopped", {
        taskId: id,
        actualMins,
      });
    }

    const [updatedTask] = await db
      .update(tasks)
      .set(updateData)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();

    // Publish realtime event (fire and forget)
    if (updatedTask) {
      publishEvent(userId, "task:completed", {
        taskId: updatedTask.id,
        scheduledDate: updatedTask.scheduledDate,
      });
    }

    return c.json({ success: true, data: updatedTask });
  }
);

/** POST /tasks/:id/uncomplete - Mark a task as incomplete */
tasksRouter.post(
  "/:id/uncomplete",
  requireScopes("tasks:write"),
  zValidator("param", z.object({ id: uuidSchema })),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const db = getDb();

    const [existing] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .limit(1);
    if (!existing) throw new NotFoundError("Task", id);

    const [updatedTask] = await db
      .update(tasks)
      .set({ completedAt: null, updatedAt: new Date() })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();

    // Publish realtime event (fire and forget)
    if (updatedTask) {
      publishEvent(userId, "task:updated", {
        taskId: updatedTask.id,
        scheduledDate: updatedTask.scheduledDate,
      });
    }

    return c.json({ success: true, data: updatedTask });
  }
);

/** POST /tasks/reorder - Reorder tasks for a specific date */
tasksRouter.post(
  "/reorder",
  requireScopes("tasks:write"),
  zValidator("json", reorderTasksSchema),
  async (c) => {
    const userId = c.get("userId");
    const { date, taskIds } = c.req.valid("json");
    const db = getDb();

    const isBacklog = date === "backlog";
    const targetDate = isBacklog ? null : date;

    // Update each task with new position and scheduled date
    // This handles both reordering within a date AND moving tasks between dates
    await Promise.all(
      taskIds.map((taskId, index) =>
        db
          .update(tasks)
          .set({
            position: index,
            scheduledDate: targetDate,
            updatedAt: new Date(),
          })
          .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      )
    );

    // Fetch all tasks for the target date
    const dateCondition = isBacklog
      ? isNull(tasks.scheduledDate)
      : eq(tasks.scheduledDate, date);
    const updatedTasks = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), dateCondition))
      .orderBy(asc(tasks.position));

    // Publish realtime event (fire and forget)
    publishEvent(userId, "task:reordered", {
      date,
      taskIds,
    });

    return c.json({
      success: true,
      data: updatedTasks,
      message: "Tasks reordered successfully",
    });
  }
);

/** GET /tasks/rollover/debug - Debug endpoint to check rollover status */
tasksRouter.get("/rollover/debug", requireScopes("tasks:read"), async (c) => {
  const userId = c.get("userId");
  const db = getDb();

  // Get user's timezone
  const [user] = await db
    .select({ timezone: users.timezone })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const timezone = user?.timezone || "UTC";

  // Get current time info in user's timezone
  const now = new Date();
  const zonedNow = toZonedTime(now, timezone);
  const todayInTz = format(zonedNow, "yyyy-MM-dd");
  const yesterdayInTz = format(subDays(zonedNow, 1), "yyyy-MM-dd");
  const currentHour = zonedNow.getHours();
  const currentMinute = zonedNow.getMinutes();

  // Get recent rollover logs for this timezone
  const recentLogs = await db
    .select()
    .from(rolloverLogs)
    .where(eq(rolloverLogs.timezone, timezone))
    .orderBy(desc(rolloverLogs.executedAt))
    .limit(10);

  // Get PG Boss schedule and job info
  let pgBossInfo: Record<string, unknown> = {};
  try {
    const boss = await getPgBoss();

    // Get schedule info - use raw query since getSchedules may not exist
    const scheduleResult = await db.execute(
      sql`SELECT name, cron, timezone, options, created_on, updated_on FROM pgboss.schedule WHERE name LIKE '%rollover%' OR name LIKE '%check%'`
    );

    // Get recent jobs
    const recentJobsResult = await db.execute(
      sql`SELECT name, state, created_on, started_on, completed_on, output FROM pgboss.job WHERE name LIKE '%rollover%' ORDER BY created_on DESC LIMIT 20`
    );

    // Get queue sizes
    const rolloverCheckQueueSize = await boss.getQueueSize(
      JOBS.TIMEZONE_ROLLOVER_CHECK
    );
    const batchQueueSize = await boss.getQueueSize(JOBS.USER_BATCH_ROLLOVER);

    pgBossInfo = {
      schedules: scheduleResult,
      recentJobs: recentJobsResult,
      queueSizes: {
        timezoneRolloverCheck: rolloverCheckQueueSize,
        userBatchRollover: batchQueueSize,
      },
    };
  } catch (error) {
    pgBossInfo = {
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // Get incomplete tasks from yesterday that should have been rolled over
  const incompleteTasksYesterday = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      scheduledDate: tasks.scheduledDate,
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        eq(tasks.scheduledDate, yesterdayInTz),
        isNull(tasks.completedAt)
      )
    );

  return c.json({
    success: true,
    data: {
      currentTime: {
        utc: now.toISOString(),
        timezone,
        local: zonedNow.toString(),
        hour: currentHour,
        minute: currentMinute,
        todayInTz,
        yesterdayInTz,
        isMidnightWindow: currentHour === 0 && currentMinute <= 10,
      },
      rolloverLogs: recentLogs,
      pgBoss: pgBossInfo,
      incompleteTasksFromYesterday: incompleteTasksYesterday,
      rolloverShouldHaveCheckedFor: yesterdayInTz,
    },
  });
});

/** POST /tasks/rollover - Manually trigger task rollover for the current user */
tasksRouter.post("/rollover", requireScopes("tasks:write"), async (c) => {
  const userId = c.get("userId");
  const db = getDb();

  // Get user's timezone
  const [user] = await db
    .select({ timezone: users.timezone })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const timezone = user?.timezone || "UTC";

  // Get current date in user's timezone
  const now = new Date();
  const zonedNow = toZonedTime(now, timezone);
  const todayInTz = format(zonedNow, "yyyy-MM-dd");

  // Get user's rollover preferences
  const [prefs] = await db
    .select({
      rolloverDestination: notificationPreferences.rolloverDestination,
      rolloverPosition: notificationPreferences.rolloverPosition,
    })
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  const rolloverDestination = prefs?.rolloverDestination || "backlog";
  const rolloverPosition = prefs?.rolloverPosition || "top";

  // Find incomplete tasks scheduled before today
  const incompleteTasks = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      scheduledDate: tasks.scheduledDate,
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        lt(tasks.scheduledDate, todayInTz),
        isNull(tasks.completedAt),
        isNotNull(tasks.scheduledDate)
      )
    );

  if (incompleteTasks.length === 0) {
    return c.json({
      success: true,
      message: "No tasks to rollover",
      data: { tasksRolledOver: 0, timezone, today: todayInTz },
    });
  }

  // Determine new scheduled date based on destination
  const newScheduledDate =
    rolloverDestination === "next_day" ? todayInTz : null;

  // Get position bounds for the target destination
  const [positionBounds] = await db
    .select({
      minPos: sql<number>`COALESCE(MIN(${tasks.position}), 0)`,
      maxPos: sql<number>`COALESCE(MAX(${tasks.position}), 0)`,
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        newScheduledDate
          ? eq(tasks.scheduledDate, newScheduledDate)
          : isNull(tasks.scheduledDate)
      )
    );

  const POSITION_GAP = 1000;
  const basePosition =
    rolloverPosition === "top"
      ? (positionBounds?.minPos ?? 0) -
        incompleteTasks.length * POSITION_GAP -
        POSITION_GAP
      : (positionBounds?.maxPos ?? 0) + POSITION_GAP;

  // Update all tasks
  const taskIds = incompleteTasks.map((t) => t.id);
  await Promise.all(
    taskIds.map((taskId, index) =>
      db
        .update(tasks)
        .set({
          scheduledDate: newScheduledDate,
          position: basePosition + index * POSITION_GAP,
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, taskId))
    )
  );

  // Publish realtime events
  for (const task of incompleteTasks) {
    publishEvent(userId, "task:updated", {
      taskId: task.id,
      scheduledDate: newScheduledDate,
    });
  }

  return c.json({
    success: true,
    message: `Rolled over ${incompleteTasks.length} tasks`,
    data: {
      tasksRolledOver: incompleteTasks.length,
      taskIds,
      destination: rolloverDestination,
      position: rolloverPosition,
      timezone,
      today: todayInTz,
    },
  });
});

export { tasksRouter };
