/**
 * Keeps a task's time blocks on the task's day.
 */
import type { TimerDb } from "../lib/timer-service.js";
import { getDb, and, eq, timeBlocks } from '@open-sunsama/database';

export interface TaskDayChange {
  taskId: string;
  /** The day the task was on before the change; null for the backlog. */
  from: string | null;
}

/**
 * When a task moves to another day, its blocks on the old day move with it
 * and keep their times. When it goes back to the backlog, those blocks come
 * off the calendar. Blocks on other days are left alone. Returns how many
 * blocks changed.
 */
export async function moveBlocksWithTasks(
  userId: string,
  changes: TaskDayChange[],
  to: string | null,
  db: TimerDb = getDb()
): Promise<number> {
  let changed = 0;
  for (const { taskId, from } of changes) {
    if (!from || from === to) continue;
    const onOldDay = and(
      eq(timeBlocks.userId, userId),
      eq(timeBlocks.taskId, taskId),
      eq(timeBlocks.date, from)
    );
    const rows = to
      ? await db
          .update(timeBlocks)
          .set({ date: to, updatedAt: new Date() })
          .where(onOldDay)
          .returning({ id: timeBlocks.id })
      : await db.delete(timeBlocks).where(onOldDay).returning({ id: timeBlocks.id });
    changed += rows.length;
  }
  return changed;
}
