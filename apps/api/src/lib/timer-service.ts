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
import {
  getDb,
  eq,
  and,
  ne,
  isNull,
  isNotNull,
  tasks,
  subtasks,
} from "@open-sunsama/database";
import { publishEvent } from "./websocket/index.js";
import { stopTimerFields, timerSeconds } from "./timer.js";

type Db = ReturnType<typeof getDb>;
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
export async function stopTaskTimer(
  db: Db,
  userId: string,
  task: Task
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

  publishEvent(userId, "timer:stopped", {
    taskId: task.id,
    actualMins: fields.actualMins,
  });
  return updated;
}

/**
 * Starts a task's timer, stopping any other running task (and subtask)
 * timer first. Returns the task and the task it stopped, if any.
 */
export async function startTaskTimer(
  db: Db,
  userId: string,
  task: Task
): Promise<{ task: Task; stoppedTask: Task | null }> {
  if (task.timerStartedAt) return { task, stoppedTask: null };

  await stopSubtaskTimers(db, userId, { exceptTaskId: task.id });

  let stoppedTask: Task | null = null;
  const running = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), isNotNull(tasks.timerStartedAt)));
  for (const other of running) {
    if (other.id === task.id) continue;
    stoppedTask = await stopTaskTimer(db, userId, other);
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

  publishEvent(userId, "timer:started", {
    taskId: updated.id,
    startedAt: updated.timerStartedAt!.toISOString(),
    accumulatedSeconds: updated.timerAccumulatedSeconds,
  });
  return { task: updated, stoppedTask };
}

/** Starts a subtask's timer, and its task's if that isn't running. */
export async function startSubtaskTimer(
  db: Db,
  userId: string,
  task: Task,
  subtask: Subtask
): Promise<{ subtask: Subtask; task: Task; stoppedTask: Task | null }> {
  const started = await startTaskTimer(db, userId, task);
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

  publishEvent(userId, "task:updated", {
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
export async function stopSubtaskTimer(
  db: Db,
  userId: string,
  task: Task,
  subtask: Subtask
): Promise<{ subtask: Subtask; task: Task }> {
  const stoppedTask = await stopTaskTimer(db, userId, task);
  const [current] = await db
    .select()
    .from(subtasks)
    .where(eq(subtasks.id, subtask.id))
    .limit(1);
  publishEvent(userId, "task:updated", {
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
