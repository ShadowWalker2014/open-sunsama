import * as React from "react";
import { format } from "date-fns";
import { Clock, Calendar } from "lucide-react";
import type { Task, TimeBlock } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils";
import type { DragState, DropPreview } from "@/hooks/useCalendarDnd";

interface DragOverlayProps {
  dragState: DragState | null;
  dropPreview: DropPreview | null;
}

/**
 * DragOverlay - Floating preview shown while dragging tasks or blocks
 */
export function DragOverlay({
  dragState,
  dropPreview,
}: DragOverlayProps) {
  const [position, setPosition] = React.useState<{ x: number; y: number } | null>(null);

  // Track mouse position for floating preview
  React.useEffect(() => {
    if (!dragState) {
      setPosition(null);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [dragState]);

  if (!dragState || !position) return null;

  return (
    <>
      {/* Floating card following cursor */}
      <div
        className="fixed pointer-events-none z-50"
        style={{
          left: position.x + 16,
          top: position.y + 16,
        }}
      >
        {dragState.type === "task-to-timeline" && dragState.task && (
          <TaskDragPreview task={dragState.task} dropPreview={dropPreview} />
        )}
        {(dragState.type === "move-block" ||
          dragState.type === "resize-top" ||
          dragState.type === "resize-bottom") &&
          dragState.block && (
            <BlockDragPreview
              block={dragState.block}
              dropPreview={dropPreview}
              dragType={dragState.type}
            />
          )}
      </div>

      {/* Drop zone indicator overlay */}
      {dropPreview && (
        <div
          className="fixed inset-0 pointer-events-none z-40"
          aria-hidden="true"
        >
          {/* Visual feedback that drop is valid */}
        </div>
      )}
    </>
  );
}

/**
 * Preview card for dragging a task
 */
interface TaskDragPreviewProps {
  task: Task;
  dropPreview: DropPreview | null;
}

function TaskDragPreview({ task, dropPreview }: TaskDragPreviewProps) {
  return (
    <div
      className={cn(
        "w-56 rounded-lg border bg-card shadow-xl",
        "animate-in fade-in-0 zoom-in-95 duration-150"
      )}
    >
      <div className="p-3">
        {/* Task title */}
        <p className="text-sm font-medium truncate">
          {task.title}
        </p>

        {/* Duration info */}
        {task.estimatedMins && (
          <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatDuration(task.estimatedMins)}</span>
          </div>
        )}
      </div>

      {/* Drop preview info */}
      {dropPreview && (
        <div className="border-t bg-primary/5 px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-primary">
            <Calendar className="h-3 w-3" />
            <span className="font-medium">
              {format(dropPreview.startTime, "h:mm")} -{" "}
              {format(dropPreview.endTime, "h:mm a")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Preview card for dragging/resizing a time block
 */
interface BlockDragPreviewProps {
  block: TimeBlock;
  dropPreview: DropPreview | null;
  dragType: "move-block" | "resize-top" | "resize-bottom";
}

function BlockDragPreview({ block, dropPreview, dragType }: BlockDragPreviewProps) {
  const isResizing = dragType === "resize-top" || dragType === "resize-bottom";

  return (
    <div
      className={cn(
        "w-56 rounded-lg border shadow-xl",
        "animate-in fade-in-0 zoom-in-95 duration-150"
      )}
      style={{
        backgroundColor: block.color ?? "hsl(var(--card))",
        borderColor: block.color ?? "hsl(var(--border))",
      }}
    >
      <div className="p-3">
        {/* Block title */}
        <p
          className="text-sm font-medium truncate"
          style={{ color: block.color ? "white" : undefined }}
        >
          {block.title}
        </p>

        {/* Action indicator */}
        <p
          className="text-xs mt-1 opacity-80"
          style={{ color: block.color ? "white" : "var(--muted-foreground)" }}
        >
          {isResizing ? "Resizing..." : "Moving..."}
        </p>
      </div>

      {/* New time preview */}
      {dropPreview && (
        <div
          className={cn(
            "border-t px-3 py-2",
            !block.color && "bg-accent/50"
          )}
          style={{
            borderColor: block.color ? "rgba(255,255,255,0.2)" : undefined,
            backgroundColor: block.color ? "rgba(0,0,0,0.2)" : undefined,
          }}
        >
          <div
            className="flex items-center gap-2 text-xs font-medium"
            style={{ color: block.color ? "white" : "hsl(var(--primary))" }}
          >
            <Calendar className="h-3 w-3" />
            <span>
              {format(dropPreview.startTime, "h:mm")} -{" "}
              {format(dropPreview.endTime, "h:mm a")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * TimeSlotHighlight - Highlights the target time slot when dragging over timeline
 */
interface TimeSlotHighlightProps {
  top: number;
  height: number;
  color?: string;
}

export function TimeSlotHighlight({ top, height, color }: TimeSlotHighlightProps) {
  return (
    <div
      className="absolute left-0 right-0 border-2 border-dashed rounded-md pointer-events-none"
      style={{
        top: `${top}px`,
        height: `${height}px`,
        borderColor: color ?? "hsl(var(--primary))",
        backgroundColor: color
          ? `${color}20`
          : "hsl(var(--primary) / 0.1)",
      }}
    />
  );
}
