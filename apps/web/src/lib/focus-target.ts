import type { Task, TimeBlock } from "@open-sunsama/types";

export type FocusTarget =
  | { kind: "task"; taskId: string }
  | { kind: "all-done" }
  | { kind: "nothing-planned" };

/**
 * Pick the task the desktop "start focus" shortcut should open, in order:
 * the task whose timer is running, the task in the time block happening now,
 * then the first incomplete task on today's list.
 */
export function pickFocusTarget({
  activeTimerTask,
  todayTasks,
  todayTimeBlocks,
  now,
}: {
  activeTimerTask: Task | null;
  todayTasks: Task[];
  todayTimeBlocks: TimeBlock[];
  now: Date;
}): FocusTarget {
  if (activeTimerTask && !activeTimerTask.completedAt) {
    return { kind: "task", taskId: activeTimerTask.id };
  }

  const incomplete = todayTasks
    .filter((t) => !t.completedAt)
    .sort((a, b) => a.position - b.position);
  const incompleteIds = new Set(incomplete.map((t) => t.id));

  const nowMs = now.getTime();
  const currentBlock = todayTimeBlocks.find(
    (b) =>
      b.taskId !== null &&
      incompleteIds.has(b.taskId) &&
      new Date(b.startTime).getTime() <= nowMs &&
      nowMs < new Date(b.endTime).getTime()
  );
  if (currentBlock?.taskId) {
    return { kind: "task", taskId: currentBlock.taskId };
  }

  const next = incomplete[0];
  if (next) return { kind: "task", taskId: next.id };

  return todayTasks.length > 0 ? { kind: "all-done" } : { kind: "nothing-planned" };
}
