/**
 * Task Series (Recurring Tasks) routes for Open Sunsama API
 * Handles CRUD operations for task series (recurring task templates)
 */
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  getDb,
  eq,
  and,
  desc,
  asc,
  sql,
  isNull,
  isNotNull,
} from "@open-sunsama/database";
import {
  tasks,
  taskSeries,
  users,
  RECURRENCE_TYPES,
} from "@open-sunsama/database/schema";
import {
  NotFoundError,
  ValidationError,
  uuidSchema,
} from "@open-sunsama/utils";
import { auth, requireScopes, type AuthVariables } from "../middleware/auth.js";
import { publishEvent } from "../lib/websocket/index.js";
import {
  format,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  setDate,
  getDay,
  getDate,
} from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

const taskSeriesRouter = new Hono<{ Variables: AuthVariables }>();
taskSeriesRouter.use("*", auth);

// Validation schemas
const createTaskSeriesSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(500),
    notes: z.string().optional(),
    estimatedMins: z.number().int().positive().optional(),
    priority: z.enum(["P0", "P1", "P2", "P3"]).optional(),
    recurrenceType: z.enum(RECURRENCE_TYPES),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
    dayOfMonth: z.number().int().min(1).max(31).optional(),
    weekOfMonth: z.number().int().min(1).max(5).optional(),
    dayOfWeekMonthly: z.number().int().min(0).max(6).optional(),
    frequency: z.number().int().min(1).max(12).optional(),
    startTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)")
      .optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
      .optional(),
  })
  .refine(
    (data) => {
      if (
        data.recurrenceType === "weekly" &&
        (!data.daysOfWeek || data.daysOfWeek.length === 0)
      ) {
        return false;
      }
      if (data.recurrenceType === "monthly_date" && !data.dayOfMonth) {
        return false;
      }
      if (
        data.recurrenceType === "monthly_weekday" &&
        (data.weekOfMonth === undefined || data.dayOfWeekMonthly === undefined)
      ) {
        return false;
      }
      return true;
    },
    { message: "Required fields missing for recurrence type" }
  );

const updateTaskSeriesSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  notes: z.string().nullable().optional(),
  estimatedMins: z.number().int().positive().nullable().optional(),
  priority: z.enum(["P0", "P1", "P2", "P3"]).optional(),
  recurrenceType: z.enum(RECURRENCE_TYPES).optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
  weekOfMonth: z.number().int().min(1).max(5).nullable().optional(),
  dayOfWeekMonthly: z.number().int().min(0).max(6).nullable().optional(),
  frequency: z.number().int().min(1).max(12).optional(),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
});

const taskSeriesFilterSchema = z.object({
  isActive: z.enum(["true", "false"]).optional(),
  recurrenceType: z.enum(RECURRENCE_TYPES).optional(),
  titleSearch: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

/**
 * Generate a human-readable schedule description
 */
function generateScheduleDescription(series: {
  recurrenceType: string;
  frequency: number;
  daysOfWeek: number[] | null;
  dayOfMonth: number | null;
  weekOfMonth: number | null;
  dayOfWeekMonthly: number | null;
  startTime: string | null;
  estimatedMins: number | null;
}): string {
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const weekNames = ["", "first", "second", "third", "fourth", "last"];
  const {
    recurrenceType,
    frequency,
    daysOfWeek,
    dayOfMonth,
    weekOfMonth,
    dayOfWeekMonthly,
    startTime,
    estimatedMins,
  } = series;

  let desc = "Repeats ";

  // Frequency prefix
  const freqPrefix =
    frequency === 1
      ? "every"
      : frequency === 2
        ? "every other"
        : `every ${frequency}${frequency === 3 ? "rd" : "th"}`;

  switch (recurrenceType) {
    case "daily":
      desc += frequency === 1 ? "every day" : `${freqPrefix} day`;
      break;
    case "weekdays":
      desc += "every weekday";
      break;
    case "weekly":
      if (daysOfWeek && daysOfWeek.length > 0) {
        const days = daysOfWeek.map((d) => dayNames[d]).join(", ");
        desc += `${freqPrefix} week on ${days}`;
      } else {
        desc += `${freqPrefix} week`;
      }
      break;
    case "monthly_date":
      desc += `${freqPrefix} month on the ${dayOfMonth}${getOrdinalSuffix(dayOfMonth || 1)}`;
      break;
    case "monthly_weekday":
      if (weekOfMonth && dayOfWeekMonthly !== null) {
        desc += `${freqPrefix} month on the ${weekNames[weekOfMonth]} ${dayNames[dayOfWeekMonthly]}`;
      }
      break;
    case "yearly":
      desc += `${freqPrefix} year`;
      break;
  }

  // Add time
  if (startTime) {
    desc += ` at ~${formatTime12Hour(startTime)}`;
  }

  // Add duration
  if (estimatedMins) {
    desc += ` for ${formatDuration(estimatedMins)}`;
  }

  return desc;
}

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0] ?? "th";
}

function formatTime12Hour(time: string): string {
  const parts = time.split(":");
  const hours = Number(parts[0] ?? 0);
  const minutes = Number(parts[1] ?? 0);
  const period = hours >= 12 ? "pm" : "am";
  const hour12 = hours % 12 || 12;
  return minutes === 0
    ? `${hour12} ${period}`
    : `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remaining = mins % 60;
  if (remaining === 0) return `${hours} hr`;
  return `${hours} hr ${remaining} min`;
}

/**
 * Calculate the next occurrence date based on recurrence pattern
 */
function calculateNextOccurrence(
  fromDate: Date,
  series: {
    recurrenceType: string;
    frequency: number;
    daysOfWeek: number[] | null;
    dayOfMonth: number | null;
    weekOfMonth: number | null;
    dayOfWeekMonthly: number | null;
  },
  timezone: string
): Date {
  const {
    recurrenceType,
    frequency,
    daysOfWeek,
    dayOfMonth,
    weekOfMonth,
    dayOfWeekMonthly,
  } = series;
  let nextDate = new Date(fromDate);

  switch (recurrenceType) {
    case "daily":
      nextDate = addDays(nextDate, frequency);
      break;

    case "weekdays": {
      // Skip to next weekday
      let days = 1;
      while (days <= 7) {
        const candidate = addDays(nextDate, days);
        const dayOfWeek = getDay(candidate);
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          nextDate = candidate;
          break;
        }
        days++;
      }
      break;
    }

    case "weekly": {
      if (daysOfWeek && daysOfWeek.length > 0) {
        // Find the next matching day of week
        const currentDow = getDay(nextDate);
        const sortedDays = [...daysOfWeek].sort((a, b) => a - b);

        // Look for next day this week
        const nextDayThisWeek = sortedDays.find((d) => d > currentDow);
        if (nextDayThisWeek !== undefined) {
          nextDate = addDays(nextDate, nextDayThisWeek - currentDow);
        } else {
          // Go to next week (or N weeks based on frequency) and get first day
          const firstDay = sortedDays[0] ?? 0;
          const daysUntilNextWeek = 7 - currentDow + firstDay;
          const weeksToAdd = frequency - 1;
          nextDate = addDays(nextDate, daysUntilNextWeek + weeksToAdd * 7);
        }
      } else {
        nextDate = addWeeks(nextDate, frequency);
      }
      break;
    }

    case "monthly_date": {
      if (dayOfMonth) {
        nextDate = addMonths(nextDate, frequency);
        // Set the day of month, handling months with fewer days
        const maxDays = new Date(
          nextDate.getFullYear(),
          nextDate.getMonth() + 1,
          0
        ).getDate();
        nextDate = setDate(nextDate, Math.min(dayOfMonth, maxDays));
      }
      break;
    }

    case "monthly_weekday": {
      if (weekOfMonth && dayOfWeekMonthly !== null) {
        nextDate = addMonths(nextDate, frequency);
        // Find the Nth weekday of the month
        nextDate = getNthWeekdayOfMonth(
          nextDate,
          weekOfMonth,
          dayOfWeekMonthly
        );
      }
      break;
    }

    case "yearly":
      nextDate = addYears(nextDate, frequency);
      break;
  }

  return nextDate;
}

/**
 * Get the Nth weekday of a given month
 */
function getNthWeekdayOfMonth(
  date: Date,
  weekOfMonth: number,
  dayOfWeek: number
): Date {
  const year = date.getFullYear();
  const month = date.getMonth();

  if (weekOfMonth === 5) {
    // "Last" occurrence - start from end of month
    const lastDay = new Date(year, month + 1, 0);
    let current = lastDay;
    while (getDay(current) !== dayOfWeek) {
      current = addDays(current, -1);
    }
    return current;
  }

  // Find first occurrence of the weekday
  let first = new Date(year, month, 1);
  while (getDay(first) !== dayOfWeek) {
    first = addDays(first, 1);
  }

  // Add weeks to get to Nth occurrence
  return addDays(first, (weekOfMonth - 1) * 7);
}

/** GET /task-series - List all task series (routines) */
taskSeriesRouter.get(
  "/",
  requireScopes("tasks:read"),
  zValidator("query", taskSeriesFilterSchema),
  async (c) => {
    const userId = c.get("userId");
    const filters = c.req.valid("query");
    const db = getDb();

    const conditions = [eq(taskSeries.userId, userId)];

    if (filters.isActive !== undefined) {
      conditions.push(eq(taskSeries.isActive, filters.isActive === "true"));
    }
    if (filters.recurrenceType) {
      conditions.push(eq(taskSeries.recurrenceType, filters.recurrenceType));
    }
    if (filters.titleSearch) {
      conditions.push(
        sql`${taskSeries.title} ILIKE ${`%${filters.titleSearch}%`}`
      );
    }

    const offset = (filters.page - 1) * filters.limit;

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(taskSeries)
      .where(and(...conditions));
    const total = countResult?.count || 0;

    // Get series with instance counts
    const results = await db
      .select({
        series: taskSeries,
        instanceCount: sql<number>`(SELECT COUNT(*) FROM ${tasks} WHERE ${tasks.seriesId} = ${taskSeries.id})::int`,
        completedCount: sql<number>`(SELECT COUNT(*) FROM ${tasks} WHERE ${tasks.seriesId} = ${taskSeries.id} AND ${tasks.completedAt} IS NOT NULL)::int`,
      })
      .from(taskSeries)
      .where(and(...conditions))
      .orderBy(desc(taskSeries.createdAt))
      .limit(filters.limit)
      .offset(offset);

    // Transform results with schedule descriptions
    const data = results.map(({ series, instanceCount, completedCount }) => ({
      ...series,
      scheduleDescription: generateScheduleDescription(series),
      instanceCount,
      completedCount,
    }));

    return c.json({
      success: true,
      data,
      meta: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    });
  }
);

/** POST /task-series - Create a new task series */
taskSeriesRouter.post(
  "/",
  requireScopes("tasks:write"),
  zValidator("json", createTaskSeriesSchema),
  async (c) => {
    const userId = c.get("userId");
    const data = c.req.valid("json");
    const db = getDb();

    // Get user's timezone
    const [user] = await db
      .select({ timezone: users.timezone })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const timezone = user?.timezone || "UTC";

    // Determine start date (default to today in user's timezone)
    const now = new Date();
    const zonedNow = toZonedTime(now, timezone);
    const startDate = data.startDate || format(zonedNow, "yyyy-MM-dd");

    // Create the task series
    const [newSeries] = await db
      .insert(taskSeries)
      .values({
        userId,
        title: data.title,
        notes: data.notes ?? null,
        estimatedMins: data.estimatedMins ?? null,
        priority: data.priority ?? "P2",
        recurrenceType: data.recurrenceType,
        daysOfWeek: data.daysOfWeek ?? null,
        dayOfMonth: data.dayOfMonth ?? null,
        weekOfMonth: data.weekOfMonth ?? null,
        dayOfWeekMonthly: data.dayOfWeekMonthly ?? null,
        frequency: data.frequency ?? 1,
        startTime: data.startTime ?? null,
        timezone,
        startDate,
        endDate: data.endDate ?? null,
        lastGeneratedDate: startDate,
        isActive: true,
      })
      .returning();

    if (!newSeries) {
      throw new ValidationError("Failed to create task series");
    }

    // Create the first task instance
    const [maxPos] = await db
      .select({ max: sql<number>`COALESCE(MAX(${tasks.position}), -1)` })
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.scheduledDate, startDate)));
    const position = (maxPos?.max ?? -1) + 1;

    const [firstTask] = await db
      .insert(tasks)
      .values({
        userId,
        title: data.title,
        notes: data.notes ?? null,
        scheduledDate: startDate,
        estimatedMins: data.estimatedMins ?? null,
        priority: data.priority ?? "P2",
        position,
        seriesId: newSeries.id,
        seriesInstanceNumber: 1,
      })
      .returning();

    // Publish realtime events
    publishEvent(userId, "task-series:created", { seriesId: newSeries.id });
    if (firstTask) {
      publishEvent(userId, "task:created", {
        taskId: firstTask.id,
        scheduledDate: firstTask.scheduledDate,
      });
    }

    return c.json(
      {
        success: true,
        data: {
          series: {
            ...newSeries,
            scheduleDescription: generateScheduleDescription(newSeries),
          },
          firstInstance: firstTask
            ? {
                id: firstTask.id,
                title: firstTask.title,
                scheduledDate: firstTask.scheduledDate,
                seriesInstanceNumber: firstTask.seriesInstanceNumber,
              }
            : null,
        },
      },
      201
    );
  }
);

/** GET /task-series/:id - Get a single task series */
taskSeriesRouter.get(
  "/:id",
  requireScopes("tasks:read"),
  zValidator("param", z.object({ id: uuidSchema })),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const db = getDb();

    const [series] = await db
      .select()
      .from(taskSeries)
      .where(and(eq(taskSeries.id, id), eq(taskSeries.userId, userId)))
      .limit(1);

    if (!series) {
      throw new NotFoundError("Task Series", id);
    }

    // Get instance counts
    const [counts] = await db
      .select({
        instanceCount: sql<number>`count(*)::int`,
        completedCount: sql<number>`count(CASE WHEN ${tasks.completedAt} IS NOT NULL THEN 1 END)::int`,
      })
      .from(tasks)
      .where(eq(tasks.seriesId, id));

    return c.json({
      success: true,
      data: {
        ...series,
        scheduleDescription: generateScheduleDescription(series),
        instanceCount: counts?.instanceCount || 0,
        completedCount: counts?.completedCount || 0,
      },
    });
  }
);

/** PATCH /task-series/:id - Update a task series */
taskSeriesRouter.patch(
  "/:id",
  requireScopes("tasks:write"),
  zValidator("param", z.object({ id: uuidSchema })),
  zValidator("json", updateTaskSeriesSchema),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const updates = c.req.valid("json");
    const db = getDb();

    const [existing] = await db
      .select()
      .from(taskSeries)
      .where(and(eq(taskSeries.id, id), eq(taskSeries.userId, userId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundError("Task Series", id);
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.estimatedMins !== undefined)
      updateData.estimatedMins = updates.estimatedMins;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.recurrenceType !== undefined)
      updateData.recurrenceType = updates.recurrenceType;
    if (updates.daysOfWeek !== undefined)
      updateData.daysOfWeek = updates.daysOfWeek;
    if (updates.dayOfMonth !== undefined)
      updateData.dayOfMonth = updates.dayOfMonth;
    if (updates.weekOfMonth !== undefined)
      updateData.weekOfMonth = updates.weekOfMonth;
    if (updates.dayOfWeekMonthly !== undefined)
      updateData.dayOfWeekMonthly = updates.dayOfWeekMonthly;
    if (updates.frequency !== undefined)
      updateData.frequency = updates.frequency;
    if (updates.startTime !== undefined)
      updateData.startTime = updates.startTime;
    if (updates.endDate !== undefined) updateData.endDate = updates.endDate;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    const [updatedSeries] = await db
      .update(taskSeries)
      .set(updateData)
      .where(and(eq(taskSeries.id, id), eq(taskSeries.userId, userId)))
      .returning();

    if (updatedSeries) {
      publishEvent(userId, "task-series:updated", { seriesId: id });
    }

    return c.json({
      success: true,
      data: updatedSeries
        ? {
            ...updatedSeries,
            scheduleDescription: generateScheduleDescription(updatedSeries),
          }
        : null,
    });
  }
);

/** DELETE /task-series/:id - Delete a task series (stop repeating) */
taskSeriesRouter.delete(
  "/:id",
  requireScopes("tasks:write"),
  zValidator("param", z.object({ id: uuidSchema })),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const db = getDb();

    const [existing] = await db
      .select()
      .from(taskSeries)
      .where(and(eq(taskSeries.id, id), eq(taskSeries.userId, userId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundError("Task Series", id);
    }

    // Just mark as inactive (tasks remain as regular tasks due to SET NULL foreign key)
    await db
      .update(taskSeries)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(taskSeries.id, id), eq(taskSeries.userId, userId)));

    publishEvent(userId, "task-series:deleted", { seriesId: id });

    return c.json({
      success: true,
      message: "Task series stopped successfully",
    });
  }
);

/** POST /task-series/:id/stop - Stop repeating (alias for delete) */
taskSeriesRouter.post(
  "/:id/stop",
  requireScopes("tasks:write"),
  zValidator("param", z.object({ id: uuidSchema })),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const db = getDb();

    const [existing] = await db
      .select()
      .from(taskSeries)
      .where(and(eq(taskSeries.id, id), eq(taskSeries.userId, userId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundError("Task Series", id);
    }

    await db
      .update(taskSeries)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(taskSeries.id, id), eq(taskSeries.userId, userId)));

    publishEvent(userId, "task-series:updated", { seriesId: id });

    return c.json({ success: true, message: "Task series stopped" });
  }
);

/** POST /task-series/:id/delete-instances - Delete all incomplete instances and stop */
taskSeriesRouter.post(
  "/:id/delete-instances",
  requireScopes("tasks:write"),
  zValidator("param", z.object({ id: uuidSchema })),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const db = getDb();

    const [existing] = await db
      .select()
      .from(taskSeries)
      .where(and(eq(taskSeries.id, id), eq(taskSeries.userId, userId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundError("Task Series", id);
    }

    // Delete incomplete task instances
    const deleted = await db
      .delete(tasks)
      .where(
        and(
          eq(tasks.seriesId, id),
          eq(tasks.userId, userId),
          isNull(tasks.completedAt)
        )
      )
      .returning({ id: tasks.id, scheduledDate: tasks.scheduledDate });

    // Stop the series
    await db
      .update(taskSeries)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(taskSeries.id, id), eq(taskSeries.userId, userId)));

    // Publish events for deleted tasks
    for (const task of deleted) {
      publishEvent(userId, "task:deleted", {
        taskId: task.id,
        scheduledDate: task.scheduledDate,
      });
    }
    publishEvent(userId, "task-series:deleted", { seriesId: id });

    return c.json({
      success: true,
      message: `Deleted ${deleted.length} incomplete instances and stopped series`,
      data: { deletedCount: deleted.length },
    });
  }
);

/** POST /task-series/:id/sync-instances - Update all incomplete instances to match series */
taskSeriesRouter.post(
  "/:id/sync-instances",
  requireScopes("tasks:write"),
  zValidator("param", z.object({ id: uuidSchema })),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const db = getDb();

    const [series] = await db
      .select()
      .from(taskSeries)
      .where(and(eq(taskSeries.id, id), eq(taskSeries.userId, userId)))
      .limit(1);

    if (!series) {
      throw new NotFoundError("Task Series", id);
    }

    // Update all incomplete instances with current series values
    const updated = await db
      .update(tasks)
      .set({
        title: series.title,
        notes: series.notes,
        estimatedMins: series.estimatedMins,
        priority: series.priority,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(tasks.seriesId, id),
          eq(tasks.userId, userId),
          isNull(tasks.completedAt)
        )
      )
      .returning({ id: tasks.id, scheduledDate: tasks.scheduledDate });

    // Publish events for updated tasks
    for (const task of updated) {
      publishEvent(userId, "task:updated", {
        taskId: task.id,
        scheduledDate: task.scheduledDate,
      });
    }

    return c.json({
      success: true,
      message: `Updated ${updated.length} incomplete instances`,
      data: { updatedCount: updated.length },
    });
  }
);

/** GET /task-series/:id/instances - Get all task instances for a series */
taskSeriesRouter.get(
  "/:id/instances",
  requireScopes("tasks:read"),
  zValidator("param", z.object({ id: uuidSchema })),
  zValidator(
    "query",
    z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(50),
      completed: z.enum(["true", "false"]).optional(),
    })
  ),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const { page, limit, completed } = c.req.valid("query");
    const db = getDb();

    const conditions = [eq(tasks.seriesId, id), eq(tasks.userId, userId)];

    if (completed !== undefined) {
      if (completed === "true") {
        conditions.push(isNotNull(tasks.completedAt));
      } else {
        conditions.push(isNull(tasks.completedAt));
      }
    }

    const offset = (page - 1) * limit;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tasks)
      .where(and(...conditions));
    const total = countResult?.count || 0;

    const instances = await db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(asc(tasks.seriesInstanceNumber))
      .limit(limit)
      .offset(offset);

    return c.json({
      success: true,
      data: instances,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  }
);

export { taskSeriesRouter };
