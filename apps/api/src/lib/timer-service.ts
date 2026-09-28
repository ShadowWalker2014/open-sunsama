/**
 * Starting and stopping focus timers on tasks and subtasks.
 *
 * The rules, shared by every route and the MCP tools:
 * - One task timer runs at a time; starting one stops the others.
 * - A subtask timer runs inside its task's timer: starting a subtask starts
 *   the task, and stopping the task stops its subtask.
 * - One subtask timer runs at a time.
 * - Starting what already runs, or stopping what is stopped, changes
 *   nothing, so double clicks and a second device can't lose time.
 */
import type { getDb } from "@open-sunsama/database";
import {
  eq,
  and,
  ne,
  isNull,
  isNotNull,
  tasks,
  subtasks,
  sql,
} from "@open-sunsama/database";
import { ValidationError } from "@open-sunsama/utils";
import { publishEvent } from "./websocket/index.js";
import { stopTimerFields, timerSeconds } from "./timer.js";

type Database = ReturnType<typeof getDb>;
type Db = Pick<Database, "select" | "update" | "execute">;
type Task = typeof tasks.$inferSelect;
type Subtask = typeof subtasks.$inferSelect;

/**
 * Stops running subtask timers of one user, logging their time. Narrow it
 * to one task, or keep one task's or one subtask's timer running.
 */
export async function stopSubtaskTimers(
  db: Db,
  userId: string,
  scope: { taskId?: string; exceptTaskId?: string; exceptSubtaskId?: string } = {}
): Promise<void> {
  const conditions = [eq(tasks.userId, userId), isNotNull(subtasks.timerStartedAt)];
  if (scope.taskId) conditions.push(eq(subtasks.taskId, scope.taskId));
  if (scope.exceptTaskId) conditions.push(ne(subtasks.taskId, scope.exceptTaskId));
  if (scope.exceptSubtaskId) conditions.push(ne(subtasks.id, scope.exceptSubtaskId));

  const running = await db
    .select({ subtask: subtasks })
    .from(subtasks)
    .innerJoin(tasks, eq(subtasks.taskId, tasks.id))
    .where(and(...conditions));

  for (const { subtask } of running) {
    await db
      .update(subtasks)
      .set({ ...stopTimerFields(subtask), updatedAt: new Date() })
      .where(and(eq(subtasks.id, subtask.id), isNotNull(subtasks.timerStartedAt)));
  }
}

/** Stops a task's timer (and its subtask's), logging the time. */
async function stopTaskTimerUnlocked(
  db: Db,
  userId: string,
  task: Task,
  emit: typeof publishEvent
): Promise<Task> {
  await stopSubtaskTimers(db, userId, { taskId: task.id });
  if (!task.timerStartedAt) return task;

  const fields = stopTimerFields(task);
  const [updated] = await db
    .update(tasks)
    .set({ ...fields, updatedAt: new Date() })
    .where(
      and(eq(tasks.id, task.id), eq(tasks.userId, userId), isNotNull(tasks.timerStartedAt))
    )
    .returning();
  if (!updated) return (await reloadTask(db, userId, task.id)) ?? task;

  emit(userId, "timer:stopped", {
    taskId: task.id,
    actualMins: fields.actualMins,
  });
  return updated;
}

/**
 * Starts a task's timer, stopping any other running task (and subtask)
 * timer first. Returns the task and the task it stopped, if any.
 */
async function startTaskTimerUnlocked(
  db: Db,
  userId: string,
  task: Task,
  emit: typeof publishEvent
): Promise<{ task: Task; stoppedTask: Task | null }> {
  if (task.completedAt) throw new ValidationError("Reopen the task before starting its timer.");
  if (task.timerStartedAt) return { task, stoppedTask: null };

  await stopSubtaskTimers(db, userId, { exceptTaskId: task.id });

  let stoppedTask: Task | null = null;
  const running = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), isNotNull(tasks.timerStartedAt)));
  for (const other of running) {
    if (other.id === task.id) continue;
    stoppedTask = await stopTaskTimerUnlocked(db, userId, other, emit);
  }

  // Resume from the exact seconds logged so far. The isNull guard makes a
  // second start that raced this one leave the first start alone.
  const [updated] = await db
    .update(tasks)
    .set({
      timerStartedAt: new Date(),
      timerAccumulatedSeconds: timerSeconds(task),
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, task.id), eq(tasks.userId, userId), isNull(tasks.timerStartedAt)))
    .returning();
  if (!updated) {
    return { task: (await reloadTask(db, userId, task.id)) ?? task, stoppedTask };
  }

  emit(userId, "timer:started", {
    taskId: updated.id,
    startedAt: updated.timerStartedAt!.toISOString(),
    accumulatedSeconds: updated.timerAccumulatedSeconds,
  });
  return { task: updated, stoppedTask };
}

/** Starts a subtask's timer, and its task's if that isn't running. */
async function startSubtaskTimerUnlocked(
  db: Db,
  userId: string,
  task: Task,
  subtask: Subtask,
  emit: typeof publishEvent
): Promise<{ subtask: Subtask; task: Task; stoppedTask: Task | null }> {
  if (subtask.completed) throw new ValidationError("Reopen the subtask before starting its timer.");
  const started = await startTaskTimerUnlocked(db, userId, task, emit);
  await stopSubtaskTimers(db, userId, { exceptSubtaskId: subtask.id });
  if (subtask.timerStartedAt) {
    return { subtask, task: started.task, stoppedTask: started.stoppedTask };
  }

  const [updated] = await db
    .update(subtasks)
    .set({
      timerStartedAt: new Date(),
      timerAccumulatedSeconds: timerSeconds(subtask),
      updatedAt: new Date(),
    })
    .where(and(eq(subtasks.id, subtask.id), isNull(subtasks.timerStartedAt)))
    .returning();

  emit(userId, "task:updated", {
    taskId: task.id,
    scheduledDate: task.scheduledDate,
  });
  return {
    subtask: updated ?? subtask,
    task: started.task,
    stoppedTask: started.stoppedTask,
  };
}

/** Stops a subtask's timer and its task's: they measure the same stretch. */
async function stopSubtaskTimerUnlocked(
  db: Db,
  userId: string,
  task: Task,
  subtask: Subtask,
  emit: typeof publishEvent
): Promise<{ subtask: Subtask; task: Task }> {
  const stoppedTask = await stopTaskTimerUnlocked(db, userId, task, emit);
  const [current] = await db
    .select()
    .from(subtasks)
    .where(eq(subtasks.id, subtask.id))
    .limit(1);
  emit(userId, "task:updated", {
    taskId: task.id,
    scheduledDate: task.scheduledDate,
  });
  return { subtask: current ?? subtask, task: stoppedTask };
}

async function reloadTask(db: Db, userId: string, id: string) {
  const [row] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .limit(1);
  return row;
}

// Serialize timer transitions across tabs/devices, then reload after acquiring
// the lock. A stale request must not start two timers or overwrite logged time.
async function transition<T>(db: Database, userId: string, run: (tx: Db, emit: typeof publishEvent) => Promise<T>) {
  const events: Parameters<typeof publishEvent>[] = [];
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}), 917)`);
    return run(tx, async (...args) => { events.push(args); });
  });
  for (const args of events) void publishEvent(...args);
  return result;
}
export async function startTaskTimer(db: Database, userId: string, task: Task) {
  return transition(db, userId, async (tx, emit) => startTaskTimerUnlocked(tx, userId, (await reloadTask(tx, userId, task.id)) ?? task, emit));
}
export async function stopTaskTimer(db: Database, userId: string, task: Task) {
  return transition(db, userId, async (tx, emit) => stopTaskTimerUnlocked(tx, userId, (await reloadTask(tx, userId, task.id)) ?? task, emit));
}
export async function startSubtaskTimer(db: Database, userId: string, task: Task, subtask: Subtask) {
  return transition(db, userId, async (tx, emit) => {
    const [current] = await tx.select().from(subtasks).where(eq(subtasks.id, subtask.id));
    return startSubtaskTimerUnlocked(tx, userId, (await reloadTask(tx, userId, task.id)) ?? task, current ?? subtask, emit);
  });
}
export async function stopSubtaskTimer(db: Database, userId: string, task: Task, subtask: Subtask) {
  return transition(db, userId, async (tx, emit) => {
    const [current] = await tx.select().from(subtasks).where(eq(subtasks.id, subtask.id));
    if (!current?.timerStartedAt) return { subtask: current ?? subtask, task: (await reloadTask(tx, userId, task.id)) ?? task };
    return stopSubtaskTimerUnlocked(tx, userId, (await reloadTask(tx, userId, task.id)) ?? task, current, emit);
  });
}
