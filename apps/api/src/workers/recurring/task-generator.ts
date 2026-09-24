/**
 * Recurring task generator
 * Creates new task instances from a series template
 */
import type PgBoss from "pg-boss";
import { getDb, eq, and, sql, type DbClient } from "@open-sunsama/database";
import { taskSeries, tasks, users } from "@open-sunsama/database/schema";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { publishEvent } from "../../lib/websocket/index.js";
import type { GenerateRecurringTaskPayload } from "./utils.js";

/**
 * Insert one series instance, doing nothing if the series already has a task
 * on that date. tasks_series_date_unique_idx is a partial index
 * (WHERE series_id IS NOT NULL), and Postgres only uses a partial index as the
 * ON CONFLICT arbiter when the statement repeats its predicate. Without the
 * `where`, every insert fails with "there is no unique or exclusion constraint
 * matching the ON CONFLICT specification".
 */
export function insertSeriesInstance(
  db: Pick<DbClient, "insert">,
  values: typeof tasks.$inferInsert
) {
  return db
    .insert(tasks)
    .values(values)
    .onConflictDoNothing({
      target: [tasks.seriesId, tasks.scheduledDate],
      where: sql`${tasks.seriesId} IS NOT NULL`,
    })
    .returning();
}
/**
 * Generate a single recurring task instance
 */
export async function processGenerateRecurringTask(
  job: PgBoss.Job<GenerateRecurringTaskPayload>
): Promise<void> {
  const { seriesId, targetDate, instanceNumber } = job.data;
  const db = getDb();

  try {
    // Get the series template
    const [series] = await db
      .select()
      .from(taskSeries)
      .where(eq(taskSeries.id, seriesId))
      .limit(1);

    if (!series) {
      console.error(`[Recurring] Series ${seriesId} not found`);
      return;
    }

    if (!series.isActive) {
      console.log(
        `[Recurring] Series ${seriesId} is no longer active, skipping`
      );
      return;
    }

    // Jobs queued (or retried) for a past date would create stale tasks
    const [user] = await db
      .select({ timezone: users.timezone })
      .from(users)
      .where(eq(users.id, series.userId))
      .limit(1);
    const todayStr = format(
      toZonedTime(new Date(), user?.timezone || "UTC"),
      "yyyy-MM-dd"
    );
    if (targetDate < todayStr) {
      console.log(
        `[Recurring] Skipping past date ${targetDate} for series ${seriesId}`
      );
      return;
    }

    // Get the maximum position for tasks on this date
    const [maxPos] = await db
      .select({ max: sql<number>`COALESCE(MAX(${tasks.position}), -1)` })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, series.userId),
          eq(tasks.scheduledDate, targetDate)
        )
      );
    const position = (maxPos?.max ?? -1) + 1;

    // The unique index on (series_id, scheduled_date) prevents duplicates
    // even if multiple workers try to create the same task simultaneously
    const [newTask] = await insertSeriesInstance(db, {
      userId: series.userId,
      title: series.title,
      notes: series.notes,
      scheduledDate: targetDate,
      estimatedMins: series.estimatedMins,
      priority: series.priority,
      position,
      seriesId: series.id,
      seriesInstanceNumber: instanceNumber,
    });

    // If no task was returned, it means a duplicate was prevented
    if (!newTask) {
      console.log(
        `[Recurring] Task already exists for series ${seriesId} on ${targetDate} (conflict prevented)`
      );
      return;
    }

    // Update the series with the last generated date
    await db
      .update(taskSeries)
      .set({
        lastGeneratedDate: targetDate,
        updatedAt: new Date(),
      })
      .where(eq(taskSeries.id, seriesId));

    // Publish realtime event
    if (newTask) {
      publishEvent(series.userId, "task:created", {
        taskId: newTask.id,
        scheduledDate: newTask.scheduledDate,
      });
    }

    console.log(
      `[Recurring] Generated task ${newTask?.id} for series ${seriesId} on ${targetDate} (instance #${instanceNumber})`
    );
  } catch (error) {
    console.error(
      `[Recurring] Error generating task for series ${seriesId}:`,
      error
    );
    throw error; // Re-throw to trigger retry
  }
}
