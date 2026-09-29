/**
 * Focus timer arithmetic, kept pure so every route agrees on it.
 *
 * A task's logged time lives in `actualMins` (what people see and edit).
 * While a timer runs, `timerStartedAt` is set and `timerAccumulatedSeconds`
 * holds the seconds logged before this run. When it stops, the exact seconds
 * stay in `timerAccumulatedSeconds` so the next start resumes from them
 * instead of from `actualMins`, which is rounded up to a whole minute.
 * Without that, every start/stop cycle would add up to a minute.
 */
export interface TimerFields {
  timerStartedAt: Date | null;
  timerAccumulatedSeconds: number;
  actualMins: number | null;
}

/** Seconds the task has logged at `now`, running or not. */
export function timerSeconds(task: TimerFields, now: number = Date.now()): number {
  if (task.timerStartedAt) {
    // Rounded, so quick start/stop runs of under a second still count.
    const elapsed = Math.round((now - task.timerStartedAt.getTime()) / 1000);
    return task.timerAccumulatedSeconds + Math.max(0, elapsed);
  }
  const mins = task.actualMins ?? 0;
  const seconds = task.timerAccumulatedSeconds;
  // Trust the exact seconds only while they still match the minutes shown;
  // a manual edit of actual time wins.
  return seconds > 0 && Math.ceil(seconds / 60) === mins ? seconds : mins * 60;
}

/** The column values that stop a running timer and log its time. */
export function stopTimerFields(task: TimerFields, now: number = Date.now()) {
  const seconds = timerSeconds(task, now);
  return {
    actualMins: Math.ceil(seconds / 60),
    timerStartedAt: null,
    timerAccumulatedSeconds: seconds,
  };
}
