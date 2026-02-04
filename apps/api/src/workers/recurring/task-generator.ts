/**
 * Recurring task generator
 * Creates new task instances from a series template
 */
import type PgBoss from "pg-boss";
import { getDb, eq, and, sql } from "@open-sunsama/database";
import { taskSeries, tasks } from "@open-sunsama/database/schema";
import { format } from "date-fns";
import { publishEvent } from "../../lib/websocket/index.js";
import type { GenerateRecurringTaskPayload } from "./utils.js";

// Target for unique constraint conflict (series_id, scheduled_date)
const SERIES_DATE_UNIQUE_TARGET = sql`(series_id, scheduled_date) WHERE series_id IS NOT NULL`;

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

    // Create the new task instance with ON CONFLICT DO NOTHING
    // The unique constraint on (series_id, scheduled_date) prevents duplicates
    // even if multiple workers try to create the same task simultaneously
    const [newTask] = await db
      .insert(tasks)
      .values({
        userId: series.userId,
        title: series.title,
        notes: series.notes,
        scheduledDate: targetDate,
        estimatedMins: series.estimatedMins,
        priority: series.priority,
        position,
        seriesId: series.id,
        seriesInstanceNumber: instanceNumber,
      })
      .onConflictDoNothing({
        target: [tasks.seriesId, tasks.scheduledDate],
      })
      .returning();

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
