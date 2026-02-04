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

    // Check if task already exists for this date (idempotency)
    const [existingTask] = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(
        and(eq(tasks.seriesId, seriesId), eq(tasks.scheduledDate, targetDate))
      )
      .limit(1);

    if (existingTask) {
      console.log(
        `[Recurring] Task already exists for series ${seriesId} on ${targetDate}`
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

    // Create the new task instance
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
      .returning();

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
