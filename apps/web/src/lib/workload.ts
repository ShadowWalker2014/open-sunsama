import type { Task } from "@open-sunsama/types";

/** Minutes worked on a task, counting a running timer up to `now`. */
export function actualMinutes(task: Task, now: number = Date.now()): number {
  if (!task.timerStartedAt) return task.actualMins ?? 0;
  const elapsed = (now - new Date(task.timerStartedAt).getTime()) / 1000;
  return Math.floor((task.timerAccumulatedSeconds + Math.max(0, elapsed)) / 60);
}
