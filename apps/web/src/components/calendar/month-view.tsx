import * as React from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  isWeekend,
  startOfDay,
  endOfDay,
} from "date-fns";
import type { CalendarEvent, TimeBlock } from "@open-sunsama/types";
import { cn } from "@/lib/utils";

interface MonthViewProps {
  /** The "current" month — anchors which days the grid renders */
  month: Date;
  weekStartsOn: 0 | 1;
  calendarEvents: CalendarEvent[];
  timeBlocks: TimeBlock[];
  isLoading?: boolean;
  onDayClick?: (date: Date) => void;
  onExternalEventClick?: (event: CalendarEvent) => void;
  onBlockClick?: (block: TimeBlock) => void;
}

const WEEKDAY_LABELS_SUN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_LABELS_MON = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface DayCellEntries {
  events: CalendarEvent[];
  blocks: TimeBlock[];
}

function bucketEntriesForDay(
  date: Date,
  events: CalendarEvent[],
  blocks: TimeBlock[]
): DayCellEntries {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  // All-day events are stored at UTC midnight per the iCal convention.
  // Compare YYYY-MM-DD strings derived using the same calendar-date
  // semantics on both sides: local components for the cell, UTC
  // components for the event start/end.
  const targetCalendarDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  const dayEvents: CalendarEvent[] = [];
  for (const event of events) {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    if (event.isAllDay) {
      const startDateStr = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}-${String(start.getUTCDate()).padStart(2, "0")}`;
      const endDateStr = `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, "0")}-${String(end.getUTCDate()).padStart(2, "0")}`;
      if (
        targetCalendarDate >= startDateStr &&
        targetCalendarDate < endDateStr
      ) {
        dayEvents.push(event);
      }
    } else if (start < dayEnd && end > dayStart) {
      dayEvents.push(event);
    }
  }

  const dayBlocks = blocks.filter((b) =>
    isSameDay(new Date(b.startTime), date)
  );

  return { events: dayEvents, blocks: dayBlocks };
}

function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  if (Number.isNaN(r)) return `rgba(107, 114, 128, ${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const MAX_VISIBLE_PER_DAY = 3;

/**
 * Full-month grid (6 rows × 7 cols, padded so the first row starts on
 * the user's `weekStartsOn` weekday). Each cell shows up to 3 entries
 * (events + time blocks), with a "+N more" affordance that opens the
 * day in detail.
 */
export function MonthView({
  month,
  weekStartsOn,
  calendarEvents,
  timeBlocks,
  isLoading = false,
  onDayClick,
  onExternalEventClick,
  onBlockClick,
}: MonthViewProps) {
  const days = React.useMemo(() => {
    const firstOfMonth = startOfMonth(month);
    const lastOfMonth = endOfMonth(month);
    return eachDayOfInterval({
      start: startOfWeek(firstOfMonth, { weekStartsOn }),
      end: endOfWeek(lastOfMonth, { weekStartsOn }),
    });
  }, [month, weekStartsOn]);

  const weekdayLabels = weekStartsOn === 1 ? WEEKDAY_LABELS_MON : WEEKDAY_LABELS_SUN;

  return (
    <div className="flex h-full w-full min-w-0 flex-1 flex-col">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b bg-background flex-shrink-0">
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className="px-2 py-1.5 text-center text-[11px] uppercase tracking-wide text-muted-foreground border-r last:border-r-0"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading…
          </p>
        </div>
      )}

      {/* Day grid — 6 rows × 7 cols */}
      {!isLoading && (
        <div
          className="grid grid-cols-7 flex-1 overflow-auto auto-rows-fr"
          style={{ gridAutoRows: "minmax(80px, 1fr)" }}
        >
          {days.map((day) => {
            const inCurrentMonth = isSameMonth(day, month);
            const today = isToday(day);
            const weekend = isWeekend(day);
            const { events, blocks } = bucketEntriesForDay(
              day,
              calendarEvents,
              timeBlocks
            );
            const totalEntries = events.length + blocks.length;
            const visible = [
              ...blocks.slice(0, MAX_VISIBLE_PER_DAY).map((b) => ({
                kind: "block" as const,
                id: b.id,
                title: b.title,
                color: b.color ?? "#3B82F6",
                onClick: onBlockClick ? () => onBlockClick(b) : undefined,
              })),
              ...events
                .slice(0, Math.max(0, MAX_VISIBLE_PER_DAY - blocks.length))
                .map((e) => ({
                  kind: "event" as const,
                  id: e.id,
                  title: e.title,
                  color: e.calendar?.color ?? "#6B7280",
                  onClick: onExternalEventClick
                    ? () => onExternalEventClick(e)
                    : undefined,
                })),
            ];
            const hidden = Math.max(0, totalEntries - visible.length);

            return (
              // NOTE: must NOT be a <button> — it contains nested entry
              // <button>s (and putting an interactive element inside a
              // button is invalid HTML and triggers a React hydration
              // warning). Use role="button" + keyboard handlers instead.
              <div
                key={day.toISOString()}
                onClick={(e) => {
                  // Don't open the day if the click originated inside
                  // an entry button — that has its own handler. Mouse
                  // clicks on entry buttons already stopPropagation so
                  // this is mostly defensive, but it also covers any
                  // future interactive child.
                  if (
                    (e.target as HTMLElement).closest(
                      "button,a,[role='button']"
                    ) !== e.currentTarget
                  ) {
                    return;
                  }
                  onDayClick?.(day);
                }}
                onKeyDown={(e) => {
                  // Keyboard activation (Enter / Space) on an entry
                  // button bubbles up — only respond when focus is on
                  // the cell itself, not an interactive descendant.
                  if (e.target !== e.currentTarget) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onDayClick?.(day);
                  }
                }}
                role="button"
                tabIndex={0}
                className={cn(
                  "border-r border-b last:border-r-0 flex flex-col items-stretch text-left p-1.5 hover:bg-accent/30 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset",
                  !inCurrentMonth && "bg-muted/20",
                  weekend && inCurrentMonth && "bg-muted/10"
                )}
                aria-label={`${format(day, "MMMM d, yyyy")}${
                  totalEntries > 0
                    ? `, ${totalEntries} event${totalEntries === 1 ? "" : "s"}`
                    : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "inline-flex items-center justify-center text-xs sm:text-[13px] font-medium",
                      today &&
                        "bg-primary text-primary-foreground rounded-full h-6 w-6",
                      !today && !inCurrentMonth && "text-muted-foreground/50",
                      !today && inCurrentMonth && "text-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </div>

                <div className="mt-1 space-y-0.5 overflow-hidden">
                  {visible.map((item) => (
                    <button
                      key={`${item.kind}-${item.id}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        item.onClick?.();
                      }}
                      className="block w-full text-left rounded px-1 py-0.5 text-[10px] sm:text-[11px] truncate cursor-pointer hover:brightness-90"
                      style={
                        item.kind === "event"
                          ? {
                              backgroundColor: hexToRgba(item.color, 0.15),
                              borderLeft: `2px solid ${hexToRgba(item.color, 0.6)}`,
                            }
                          : {
                              backgroundColor: hexToRgba(item.color, 0.85),
                              color: "white",
                            }
                      }
                      title={item.title}
                    >
                      {item.title}
                    </button>
                  ))}
                  {hidden > 0 && (
                    <div className="text-[10px] text-muted-foreground/80 pl-1">
                      +{hidden} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
