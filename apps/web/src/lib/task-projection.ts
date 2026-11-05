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

export interface ProjectedBlock<T extends ProjectionTask> {
  task: T;
  start: Date;
  end: Date;
}

/**
 * The dotted blocks drawn for a day's open tasks that have no time block:
 * each task at its projected start, as long as its estimate. Empty when the
 * user has turned projected tasks off.
 */
export function projectedBlocks<
  T extends ProjectionTask & { position: number; completedAt?: Date | string | null },
>({
  enabled,
  tasks,
  blocks,
  events,
  day,
  workStartHour,
  now,
}: {
  enabled: boolean;
  tasks: T[];
  blocks: { taskId?: string | null; startTime: Date | string; endTime: Date | string }[];
  events: {
    isAllDay?: boolean;
    responseStatus?: string | null;
    startTime: Date | string;
    endTime: Date | string;
  }[];
  day: Date;
  workStartHour: number;
  now?: Date;
}): ProjectedBlock<T>[] {
  if (!enabled) return [];
  const open = tasks
    .filter((t) => !t.completedAt)
    .sort((a, b) => a.position - b.position);
  const busy = [
    ...blocks,
    ...events.filter((e) => !e.isAllDay && e.responseStatus !== "declined"),
  ].map((b) => ({ start: new Date(b.startTime), end: new Date(b.endTime) }));
  const starts = projectTaskStarts({
    day,
    tasks: open,
    blockedTaskIds: new Set(
      blocks.map((b) => b.taskId).filter((id): id is string => !!id)
    ),
    busy,
    workStartHour,
    now,
  });
  return open.flatMap((task) => {
    const start = starts.get(task.id);
    if (!start) return [];
    const mins = task.estimatedMins || DEFAULT_PLANNED_MINS;
    return [{ task, start, end: addMinutes(start, mins) }];
  });
}
