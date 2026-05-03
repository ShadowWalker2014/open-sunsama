import * as React from "react";
import {
  format,
  differenceInMinutes,
  startOfDay,
  endOfDay,
  isSameDay,
} from "date-fns";
import type { CalendarEvent } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { CalendarDays } from "lucide-react";
import {
  calculateYFromTime,
  HOUR_HEIGHT,
} from "@/hooks/useCalendarDnd";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui";
import type { LayoutResult } from "./event-layout";

const COLUMN_GAP_PCT = 1; // gap between side-by-side overlapping events

interface ExternalEventProps {
  event: CalendarEvent;
  /**
   * The day this timeline is rendering. Used to clamp multi-day events
   * to the visible window — without this a Mon→Wed event would render at
   * Y = "23:00 of Tuesday" on Tuesday's view (off-screen at the bottom).
   */
  displayDate: Date;
  /**
   * Lane assignment from the side-by-side overlap layout. When N items
   * overlap at the same time slot, they split the column into N
   * sub-columns and each item renders in its assigned lane.
   */
  layout?: LayoutResult;
  onClick?: () => void;
  /**
   * Optional drag-to-reschedule entry point. Receives the native mouse
   * event from `mousedown` on the event body. Resize-edge handlers
   * stopPropagation so dragging an edge resizes instead of moving.
   * Only wired for editable events — read-only events stay click-only.
   */
  onDragStart?: (e: React.MouseEvent) => void;
  /**
   * Resize handler — receives the edge being grabbed.
   */
  onResizeStart?: (e: React.MouseEvent, edge: "top" | "bottom") => void;
  /** True while THIS event is being dragged — used for visual feedback. */
  isDragging?: boolean;
  /**
   * The DnD hook's "we just finished a drag" flag. Browsers fire a
   * synthetic click on the same element after a real drag's mouseup;
   * without consulting this flag the trailing click would unexpectedly
   * open the detail sheet right after the user repositioned the event.
   */
  justEndedDrag?: boolean;
  className?: string;
}

/**
 * Convert hex color to rgba string
 */
function hexToRgba(hex: string, alpha: number): string {
  // Remove # if present
  const cleanHex = hex.replace("#", "");
  
  // Parse hex values
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Get color from calendar or default
 */
function getEventColor(event: CalendarEvent): string {
  return event.calendar?.color || "#6B7280"; // Default gray if no calendar color
}

/**
 * ExternalEvent component for displaying external calendar events on the timeline
 * These are read-only and cannot be dragged/resized
 */
export function ExternalEvent({
  event,
  displayDate,
  layout = { lane: 0, columnCount: 1 },
  onClick,
  onDragStart,
  onResizeStart,
  isDragging = false,
  justEndedDrag = false,
  className,
}: ExternalEventProps) {
  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);
  const color = getEventColor(event);

  // Clamp the rendered slice of a multi-day event to the displayed day.
  // If the event started yesterday it should render flush against the top
  // of today's column; if it ends tomorrow it should render flush against
  // the bottom. We also surface "continues from earlier" / "continues
  // tomorrow" indicators via title-row affordances.
  const dayStart = startOfDay(displayDate);
  const dayEnd = endOfDay(displayDate);
  const continuesFromPriorDay = startTime < dayStart;
  const continuesToNextDay = endTime > dayEnd;

  const renderStart = continuesFromPriorDay ? dayStart : startTime;
  const renderEnd = continuesToNextDay ? dayEnd : endTime;

  // Calculate position and size based on the clamped slice.
  const top = calculateYFromTime(renderStart);
  const durationMins = differenceInMinutes(renderEnd, renderStart);
  const height = (durationMins / 60) * HOUR_HEIGHT;

  // Determine if event is too short to show full content
  const isCompact = height < 48;
  const isVeryCompact = height < 28;

  const handleClick = (e: React.MouseEvent) => {
    // Stop the event from bubbling up to the timeline's "click empty
    // slot to create a time block" handler — without this, clicking an
    // event ALSO opened the create-time-block dialog.
    e.stopPropagation();
    // Suppress the trailing click after a real drag completes —
    // browsers fire mouseup → click on the same element, and without
    // this guard the detail sheet would unexpectedly open right after
    // the user repositioned the event.
    if (justEndedDrag) return;
    // Delegate to the parent — typically opens an in-app detail sheet
    // rather than redirecting to the provider's web UI.
    onClick?.();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // If user grabbed a resize handle, the resize handler stopped
    // propagation already and this never fires. Otherwise: start
    // a move-event drag. The DnD hook tracks `justEndedDrag` to
    // suppress the trailing click when the mouse actually moved.
    if (!onDragStart) return;
    if ((e.target as HTMLElement).dataset.resize) return;
    onDragStart(e);
  };

  const handleTopResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    onResizeStart?.(e, "top");
  };

  const handleBottomResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    onResizeStart?.(e, "bottom");
  };

  const calendarName = event.calendar?.name || "External Calendar";

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div
            data-external-event
            className={cn(
              "absolute z-[5] my-0.5 rounded-md border-l-[3px] transition-all select-none",
              "hover:brightness-90 hover:z-[15]",
              isDragging
                ? "opacity-50 cursor-grabbing"
                : onDragStart
                  ? "cursor-grab"
                  : "cursor-pointer",
              className
            )}
            style={{
              top: `${top}px`,
              height: `${Math.max(height - 4, 20)}px`, // Account for margin
              // Side-by-side overlap layout: split column into
              // layout.columnCount lanes; this event lives in lane N.
              // 4px gutter on the leftmost lane (matches the prior
              // `left-1 right-1` look when no overlap), tighter gaps
              // between sub-columns to keep them visually distinct.
              left: `calc(${(100 / layout.columnCount) * layout.lane}% + ${layout.lane === 0 ? "4px" : "1px"})`,
              width: `calc(${100 / layout.columnCount - COLUMN_GAP_PCT}% - ${layout.lane === 0 ? "4px" : "1px"})`,
              backgroundColor: hexToRgba(color, 0.1),
              borderColor: hexToRgba(color, 0.5),
            }}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            role="button"
            tabIndex={0}
            aria-label={`Calendar event: ${event.title} from ${format(startTime, "h:mm a")} to ${format(endTime, "h:mm a")}`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                onClick?.();
              }
            }}
          >
            {/* Top resize handle — only when editable. Tagged with
                `data-resize` so the body's mousedown bails out. */}
            {onResizeStart && !continuesFromPriorDay && (
              <div
                data-resize="top"
                onMouseDown={handleTopResize}
                className="absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize hover:bg-foreground/10 rounded-t-md"
              />
            )}
            {/* Bottom resize handle */}
            {onResizeStart && !continuesToNextDay && (
              <div
                data-resize="bottom"
                onMouseDown={handleBottomResize}
                className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize hover:bg-foreground/10 rounded-b-md"
              />
            )}
            {/* Content */}
            <div
              className={cn(
                "flex h-full flex-col overflow-hidden px-2",
                isCompact ? "py-0.5" : "py-1"
              )}
            >
              {/* Title row with external indicator */}
              <div className="flex items-center gap-1 min-w-0">
                {!isVeryCompact && (
                  <CalendarDays className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                )}
                <p className={cn(
                  "truncate font-medium text-foreground/80",
                  isCompact ? "text-xs" : "text-sm"
                )}>
                  {event.title}
                </p>
                {/* `htmlLink` is intentionally not surfaced here as a
                    "click to open" affordance — clicking the event opens
                    the in-app detail sheet. The detail sheet has an
                    explicit "Open in Google Calendar" action. */}
              </div>

              {/* Time range - muted text, hide if too compact */}
              {!isCompact && (
                <p className="truncate text-xs text-muted-foreground/70">
                  {format(startTime, "h:mm")} - {format(endTime, "h:mm a")}
                </p>
              )}

              {/* Location - only show if space available */}
              {!isCompact && event.location && (
                <p className="truncate text-xs text-muted-foreground/60">
                  {event.location}
                </p>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{event.title}</p>
            <p className="text-xs text-muted-foreground">
              {format(startTime, "MMM d, h:mm a")} -{" "}
              {isSameDay(startTime, endTime)
                ? format(endTime, "h:mm a")
                : format(endTime, "MMM d, h:mm a")}
            </p>
            {(continuesFromPriorDay || continuesToNextDay) && (
              <p className="text-xs text-muted-foreground/80 italic">
                {continuesFromPriorDay && continuesToNextDay
                  ? "Continues across days"
                  : continuesFromPriorDay
                    ? "Continues from earlier"
                    : "Continues tomorrow"}
              </p>
            )}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span>{calendarName}</span>
            </div>
            {event.location && (
              <p className="text-xs text-muted-foreground">📍 {event.location}</p>
            )}
            {event.htmlLink && (
              <p className="text-xs text-primary">Click to open in calendar</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * AllDayEvent component for displaying all-day events as banners
 */
interface AllDayEventProps {
  event: CalendarEvent;
  onClick?: () => void;
  className?: string;
}

export function AllDayEvent({
  event,
  onClick,
  className,
}: AllDayEventProps) {
  const color = getEventColor(event);
  const calendarName = event.calendar?.name || "External Calendar";

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div
            data-all-day-event
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium cursor-pointer transition-all",
              "hover:brightness-90",
              className
            )}
            style={{
              backgroundColor: hexToRgba(color, 0.15),
              borderLeft: `3px solid ${hexToRgba(color, 0.6)}`,
            }}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                onClick?.();
              }
            }}
          >
            <CalendarDays className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
            <span className="truncate text-foreground/80">{event.title}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="space-y-1">
            <p className="font-medium">{event.title}</p>
            <p className="text-xs text-muted-foreground">All day event</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div 
                className="h-2 w-2 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span>{calendarName}</span>
            </div>
            {event.location && (
              <p className="text-xs text-muted-foreground">📍 {event.location}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
