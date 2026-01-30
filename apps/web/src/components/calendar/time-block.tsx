import * as React from "react";
import { format, differenceInMinutes } from "date-fns";
import { GripVertical } from "lucide-react";
import type { TimeBlock as TimeBlockType } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import {
  calculateYFromTime,
  HOUR_HEIGHT,
} from "@/hooks/useCalendarDnd";
import { TimeBlockContextMenu } from "./time-block-context-menu";

interface TimeBlockProps {
  block: TimeBlockType;
  onClick?: () => void;
  onDragStart?: (e: React.MouseEvent) => void;
  onResizeStart?: (e: React.MouseEvent, edge: "top" | "bottom") => void;
  onViewTask?: (taskId: string) => void;
  isSelected?: boolean;
  isDragging?: boolean;
  className?: string;
}

/**
 * Get color classes based on task status or custom color
 */
function getBlockColors(block: TimeBlockType): {
  bg: string;
  border: string;
  text: string;
} {
  if (block.color) {
    return {
      bg: block.color,
      border: block.color,
      text: "white",
    };
  }

  // Default to primary color
  return {
    bg: "hsl(var(--primary))",
    border: "hsl(var(--primary))",
    text: "hsl(var(--primary-foreground))",
  };
}

/**
 * TimeBlock component for displaying scheduled time blocks on the timeline
 */
export function TimeBlock({
  block,
  onClick,
  onDragStart,
  onResizeStart,
  onViewTask,
  isSelected = false,
  isDragging = false,
  className,
}: TimeBlockProps) {
  const startTime = new Date(block.startTime);
  const endTime = new Date(block.endTime);

  // Calculate position and size
  const top = calculateYFromTime(startTime);
  const durationMins = differenceInMinutes(endTime, startTime);
  const height = (durationMins / 60) * HOUR_HEIGHT;

  // Get colors
  const colors = getBlockColors(block);

  // Determine if block is too short to show full content
  const isCompact = height < 48;

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't start drag if clicking on resize handles
    if ((e.target as HTMLElement).dataset.resize) {
      return;
    }
    onDragStart?.(e);
  };

  const handleTopResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    onResizeStart?.(e, "top");
  };

  const handleBottomResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    onResizeStart?.(e, "bottom");
  };

  return (
    <TimeBlockContextMenu
      timeBlock={block}
      onEdit={onClick}
      onViewTask={onViewTask}
    >
      <div
        data-time-block
        className={cn(
          "absolute left-1 right-1 z-10 rounded-md border-l-4 shadow-sm transition-all select-none",
          "hover:shadow-md hover:z-20",
          isSelected && "ring-2 ring-primary ring-offset-1",
          isDragging && "opacity-50 cursor-grabbing",
          !isDragging && "cursor-grab",
          className
        )}
        style={{
          top: `${top}px`,
          height: `${Math.max(height, 24)}px`,
          backgroundColor: colors.bg,
          borderColor: colors.border,
        }}
        onClick={onClick}
        onMouseDown={handleMouseDown}
        role="button"
        tabIndex={0}
        aria-label={`Time block: ${block.title} from ${format(startTime, "h:mm a")} to ${format(endTime, "h:mm a")}`}
      >
        {/* Top resize handle - Larger touch target on mobile */}
        <div
          data-resize="top"
          className={cn(
            "absolute top-0 left-0 right-0 cursor-ns-resize hover:bg-black/10 rounded-t-sm",
            "h-3 sm:h-2", // Larger on mobile for touch
            "-mt-1 sm:mt-0" // Extend beyond block for easier touch
          )}
          onMouseDown={handleTopResize}
        />

        {/* Content */}
        <div
          className={cn(
            "flex h-full flex-col overflow-hidden px-2",
            isCompact ? "py-0.5" : "py-1"
          )}
          style={{ color: colors.text }}
        >
          {/* Drag handle indicator */}
          <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-60">
            <GripVertical className="h-3 w-3" />
          </div>

          {/* Title */}
          <p className={cn(
            "truncate font-medium",
            isCompact ? "text-xs" : "text-sm"
          )}>
            {block.title}
          </p>

          {/* Time range - hide if too compact */}
          {!isCompact && (
            <p className="truncate text-xs opacity-80">
              {format(startTime, "h:mm")} - {format(endTime, "h:mm a")}
            </p>
          )}
        </div>

        {/* Bottom resize handle - Larger touch target on mobile */}
        <div
          data-resize="bottom"
          className={cn(
            "absolute bottom-0 left-0 right-0 cursor-ns-resize hover:bg-black/10 rounded-b-sm",
            "h-3 sm:h-2", // Larger on mobile for touch
            "-mb-1 sm:mb-0" // Extend beyond block for easier touch
          )}
          onMouseDown={handleBottomResize}
        />
      </div>
    </TimeBlockContextMenu>
  );
}

/**
 * TimeBlockPreview - Ghost preview shown while dragging
 */
interface TimeBlockPreviewProps {
  title: string;
  startTime: Date;
  endTime: Date;
  top: number;
  height: number;
  color?: string;
}

export function TimeBlockPreview({
  title,
  startTime,
  endTime,
  top,
  height,
  color,
}: TimeBlockPreviewProps) {
  return (
    <div
      className="absolute left-1 right-1 z-30 rounded-md border-2 border-dashed border-primary/60 bg-primary/20 pointer-events-none"
      style={{
        top: `${top}px`,
        height: `${Math.max(height, 24)}px`,
        ...(color && {
          borderColor: color,
          backgroundColor: `${color}33`,
        }),
      }}
    >
      <div className="flex h-full flex-col overflow-hidden px-2 py-1">
        <p className="truncate text-sm font-medium text-primary">
          {title}
        </p>
        <p className="truncate text-xs text-primary/70">
          {format(startTime, "h:mm")} - {format(endTime, "h:mm a")}
        </p>
      </div>
    </div>
  );
}
