import { addMinutes, isSameDay, isBefore, startOfDay } from "date-fns";

/** Planned time assumed for a task with no estimate, as in Sunsama. */
export const DEFAULT_PLANNED_MINS = 20;

export interface ProjectionTask {
  id: string;
  estimatedMins?: number | null;
}

export interface BusyInterval {
  start: Date;
  end: Date;
}

/**
 * Sunsama-style task projection: lay a day's open tasks end to end, in list
 * order, from the start of the workday (or now, for today), stepping over
 * time already taken by time blocks and meetings. Tasks that already have a
 * block keep that time and are skipped. Returns each projected start.
 */
export function projectTaskStarts({
  day,
  tasks,
  blockedTaskIds,
  busy,
  workStartHour,
  now = new Date(),
}: {
  day: Date;
  tasks: ProjectionTask[];
  blockedTaskIds: Set<string>;
  busy: BusyInterval[];
  workStartHour: number;
  now?: Date;
}): Map<string, Date> {
  const starts = new Map<string, Date>();
  const dayStart = startOfDay(day);
  // Nothing to plan on days that are over.
  if (isBefore(dayStart, startOfDay(now))) return starts;

  let cursor = addMinutes(dayStart, workStartHour * 60);
  if (isSameDay(day, now) && isBefore(cursor, now)) {
    // Round up to the next 5 minutes so times read cleanly.
    const mins = Math.ceil((now.getHours() * 60 + now.getMinutes()) / 5) * 5;
    cursor = addMinutes(dayStart, mins);
  }

  const sortedBusy = [...busy].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );

  for (const task of tasks) {
    if (blockedTaskIds.has(task.id)) continue;
    const minutes = task.estimatedMins || DEFAULT_PLANNED_MINS;
    // Slide past anything the task would overlap.
    let moved = true;
    while (moved) {
      moved = false;
      const end = addMinutes(cursor, minutes);
      for (const b of sortedBusy) {
        if (b.start < end && b.end > cursor) {
          cursor = b.end;
          moved = true;
          break;
        }
      }
    }
    if (!isSameDay(cursor, dayStart)) break; // ran past midnight
    starts.set(task.id, cursor);
    cursor = addMinutes(cursor, minutes);
  }
  return starts;
}
