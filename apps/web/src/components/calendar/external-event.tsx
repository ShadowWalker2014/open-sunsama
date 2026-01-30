import * as React from "react";
import { format, differenceInMinutes } from "date-fns";
import type { CalendarEvent } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { ExternalLink, CalendarDays } from "lucide-react";
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

interface ExternalEventProps {
  event: CalendarEvent;
  onClick?: () => void;
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
  onClick,
  className,
}: ExternalEventProps) {
  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);
  const color = getEventColor(event);

  // Calculate position and size
  const top = calculateYFromTime(startTime);
  const durationMins = differenceInMinutes(endTime, startTime);
  const height = (durationMins / 60) * HOUR_HEIGHT;

  // Determine if event is too short to show full content
  const isCompact = height < 48;
  const isVeryCompact = height < 28;

  const handleClick = () => {
    // Open external link in new tab if available
    if (event.htmlLink) {
      window.open(event.htmlLink, "_blank", "noopener,noreferrer");
    }
    onClick?.();
  };

  const calendarName = event.calendar?.name || "External Calendar";

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div
            data-external-event
            className={cn(
              "absolute left-1 right-1 z-5 my-0.5 rounded-md border-l-[3px] transition-all select-none",
              "hover:brightness-90 hover:z-15",
              "cursor-pointer",
              className
            )}
            style={{
              top: `${top}px`,
              height: `${Math.max(height - 4, 20)}px`, // Account for margin
              backgroundColor: hexToRgba(color, 0.1),
              borderColor: hexToRgba(color, 0.5),
            }}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            aria-label={`External event: ${event.title} from ${format(startTime, "h:mm a")} to ${format(endTime, "h:mm a")}`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleClick();
              }
            }}
          >
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
                {event.htmlLink && !isCompact && (
                  <ExternalLink className="h-3 w-3 flex-shrink-0 text-muted-foreground ml-auto" />
                )}
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
              {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
            </p>
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

  const handleClick = () => {
    if (event.htmlLink) {
      window.open(event.htmlLink, "_blank", "noopener,noreferrer");
    }
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
                handleClick();
              }
            }}
          >
            <CalendarDays className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
            <span className="truncate text-foreground/80">{event.title}</span>
            {event.htmlLink && (
              <ExternalLink className="h-3 w-3 flex-shrink-0 text-muted-foreground ml-auto" />
            )}
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
