import type { WorkSession } from "@open-sunsama/types";

/** A pause shorter than this doesn't split a task's actual time in two. */
const MAX_PAUSE_MS = 15 * 60_000;

/** Whether `next` is the same task picked up again after a short pause. */
function isResumeOf(previous: WorkSession, next: WorkSession): boolean {
  const pause =
    new Date(next.startedAt).getTime() - new Date(previous.endedAt).getTime();
  return previous.taskId === next.taskId && pause < MAX_PAUSE_MS;
}

/**
 * Joins back-to-back runs of the same task, such as a pause and resume,
 * into one block. Runs with another task in between stay separate.
 */
export function mergeBackToBackRuns(sessions: WorkSession[]): WorkSession[] {
  const byStart = [...sessions].sort(
    (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
  );
  const merged: WorkSession[] = [];
  for (const session of byStart) {
    const previous = merged[merged.length - 1];
    if (previous && isResumeOf(previous, session)) {
      previous.endedAt = session.endedAt;
      previous.isRunning = session.isRunning;
    } else {
      merged.push({ ...session });
    }
  }
  return merged;
}
