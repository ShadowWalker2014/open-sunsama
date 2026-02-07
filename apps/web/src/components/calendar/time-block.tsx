import * as React from "react";
import { format, differenceInMinutes } from "date-fns";
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
  onEditBlock?: () => void;
  onDragStart?: (e: React.MouseEvent) => void;
  onResizeStart?: (e: React.MouseEvent, edge: "top" | "bottom") => void;
  onViewTask?: (taskId: string) => void;
  isSelected?: boolean;
  isDragging?: boolean;
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
 * Get color classes based on task status or custom color
 * Returns semi-transparent backgrounds for a clean Sunsama-like look
 */
function getBlockColors(block: TimeBlockType): {
  bg: string;
  border: string;
  text: string;
  textMuted: string;
} {
  // Default blue color
  const baseColor = block.color || "#3B82F6";
  
  return {
    bg: hexToRgba(baseColor, 0.15),
    border: hexToRgba(baseColor, 0.6),
    text: "inherit", // Use foreground color
    textMuted: "inherit", // Use muted-foreground via class
  };
}

/**
 * TimeBlock component for displaying scheduled time blocks on the timeline
 */
export function TimeBlock({
  block,
  onClick,
  onEditBlock,
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
      onEditBlock={onEditBlock}
      onViewTask={onViewTask}
    >
      <div
        data-time-block
        className={cn(
          "absolute left-1 right-1 z-10 my-0.5 rounded-md border-l-[3px] transition-all select-none",
          "hover:brightness-95 hover:z-20",
          isSelected && "ring-2 ring-primary ring-offset-1",
          isDragging && "opacity-50 cursor-grabbing",
          !isDragging && "cursor-grab",
          className
        )}
        style={{
          top: `${top}px`,
          height: `${Math.max(height - 4, 20)}px`, // Account for margin
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
        >
          {/* Title - dark text for readability */}
          <p className={cn(
            "truncate font-medium text-foreground",
            isCompact ? "text-xs" : "text-sm"
          )}>
            {block.title}
          </p>

          {/* Time range - muted text, hide if too compact */}
          {!isCompact && (
            <p className="truncate text-xs text-muted-foreground">
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
  const baseColor = color || "#3B82F6";
  
  return (
    <div
      className="absolute left-1 right-1 z-30 my-0.5 rounded-md border-2 border-dashed pointer-events-none"
      style={{
        top: `${top}px`,
        height: `${Math.max(height - 4, 20)}px`,
        borderColor: hexToRgba(baseColor, 0.6),
        backgroundColor: hexToRgba(baseColor, 0.2),
      }}
    >
      <div className="flex h-full flex-col overflow-hidden px-2 py-1">
        <p className="truncate text-sm font-medium text-foreground">
          {title}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {format(startTime, "h:mm")} - {format(endTime, "h:mm a")}
        </p>
      </div>
    </div>
  );
}
