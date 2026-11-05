import {
  format,
  differenceInMinutes,
  addMinutes,
  max,
  min,
  startOfDay,
  endOfDay,
  isSameDay,
} from "date-fns";
import type { TimeBlock, WorkSession } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { calculateYFromTime, HOUR_HEIGHT } from "@/hooks/useCalendarDnd";
import type { LayoutItem, LayoutResult } from "./event-layout";

const COLUMN_GAP_PCT = 1; // gap between side-by-side overlapping items
const DEFAULT_COLOR = "#3B82F6"; // blue, the same default planned blocks use

/**
 * The color of the task's planned block that day, so actual time matches
 * its plan. Unplanned work gets the planned blocks' default blue.
 */
export function plannedColor(
  session: WorkSession,
  day: Date,
  blocks: TimeBlock[]
): string {
  const planned = blocks.find(
    (b) => b.taskId === session.taskId && isSameDay(new Date(b.startTime), day)
  );
  return planned?.color || DEFAULT_COLOR;
}

/** Sessions that overlap the given day. */
export function sessionsOnDay(
  sessions: WorkSession[],
  day: Date
): WorkSession[] {
  return sessions.filter(
    (s) =>
      new Date(s.startedAt) < endOfDay(day) &&
      new Date(s.endedAt) > startOfDay(day)
  );
}

/** Short sessions are drawn at least this tall so their title fits. */
const MIN_DRAWN_MINUTES = 20;

/**
 * A session's slot in the overlap layout, clipped to the given day. It
 * takes up at least the height it is drawn at, so a short session gets
 * its own lane instead of drawing over the block after it.
 */
export function sessionLayoutItem(session: WorkSession, day: Date): LayoutItem {
  const start = max([new Date(session.startedAt), startOfDay(day)]);
  const end = min([new Date(session.endedAt), endOfDay(day)]);
  return {
    id: `session:${session.id}`,
    start,
    end: max([end, addMinutes(start, MIN_DRAWN_MINUTES)]),
  };
}

interface WorkSessionBlockProps {
  session: WorkSession;
  /** The day being drawn; a session crossing midnight is clipped to it. */
  displayDate: Date;
  /** Planned blocks around it; the task's block sets the color. */
  blocks: TimeBlock[];
  layout?: LayoutResult;
  onClick?: () => void;
}

/**
 * Actual time worked on a task, from its timer. Outlined and striped so it
 * reads apart from the solid planned time blocks next to it.
 */
export function WorkSessionBlock({
  session,
  displayDate,
  blocks,
  layout = { lane: 0, columnCount: 1 },
  onClick,
}: WorkSessionBlockProps) {
  const color = plannedColor(session, displayDate, blocks);
  const startTime = new Date(session.startedAt);
  const endTime = new Date(session.endedAt);
  const visible = sessionLayoutItem(session, displayDate);
  const top = calculateYFromTime(visible.start);
  const height =
    (differenceInMinutes(visible.end, visible.start) / 60) * HOUR_HEIGHT;
  const timeLabel = session.isRunning
    ? `Working since ${format(startTime, "h:mm a")}`
    : `Worked ${format(startTime, "h:mm")} – ${format(endTime, "h:mm a")}`;

  return (
    <button
      type="button"
      data-work-session
      className={cn(
        // Solid base under the stripes, so nothing behind it shows through.
        "absolute z-10 my-0.5 overflow-hidden rounded-md border border-dashed bg-background px-2 py-0.5 text-left",
        "hover:brightness-95 hover:z-20"
      )}
      style={{
        top: `${top}px`,
        height: `${height - 4}px`, // Account for margin
        left: `calc(${(100 / layout.columnCount) * layout.lane}% + ${layout.lane === 0 ? "4px" : "1px"})`,
        width: `calc(${100 / layout.columnCount - COLUMN_GAP_PCT}% - ${layout.lane === 0 ? "4px" : "1px"})`,
        borderColor: color,
        backgroundImage: `repeating-linear-gradient(135deg, color-mix(in srgb, ${color} 20%, transparent) 0 6px, transparent 6px 12px)`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      aria-label={`${session.taskTitle}: ${timeLabel}`}
      title={`${session.taskTitle}\n${timeLabel}`}
    >
      <p className="truncate text-xs font-medium text-foreground">
        {session.taskTitle}
      </p>
      {height >= 40 && (
        <p className="truncate text-xs text-muted-foreground">{timeLabel}</p>
      )}
    </button>
  );
}
