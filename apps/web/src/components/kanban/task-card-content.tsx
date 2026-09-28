import * as React from "react";
import { Check, Clock, Flag } from "lucide-react";
import type {
  Task,
  Subtask,
  TaskPriority,
  UpdateTaskInput,
} from "@open-sunsama/types";
import { cn, formatDuration } from "@/lib/utils";
import { useHoveredTask } from "@/hooks/useKeyboardShortcuts";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TaskTimeBadge } from "./task-time-badge";

interface TaskCardContentProps {
  task: Task;
  isCompleted: boolean;
  isHovered: boolean;
  isDragging?: boolean;
  onToggleComplete: (e: React.MouseEvent) => void;
  onClick: (e: React.MouseEvent) => void;
  onHoverChange: (hovered: boolean) => void;
  className?: string;
  /** Optional scheduled time to display (Date object or ISO string) */
  scheduledTime?: Date | string | null;
  /** Optional tag/project name to display */
  tag?: string | null;
  /** Optional tag color (hex or CSS color) */
  tagColor?: string | null;
  /** Optional subtasks to display inline */
  subtasks?: Subtask[];
  /** Optional callback when a subtask is toggled */
  onToggleSubtask?: (subtaskId: string) => void;
  /** Whether subtasks should be hidden */
  subtasksHidden?: boolean;
  /** Callback to update task properties inline */
  onUpdateTask?: (data: UpdateTaskInput) => void;
}

// Priority options for inline editing
const PRIORITY_OPTIONS: {
  value: TaskPriority;
  label: string;
  color: string;
}[] = [
  {
    value: "P0",
    label: "P0",
    color: "bg-red-500/15 text-red-600 dark:text-red-400",
  },
  {
    value: "P1",
    label: "P1",
    color: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  {
    value: "P2",
    label: "P2",
    color: "bg-blue-500/10 text-blue-500 dark:text-blue-400",
  },
  {
    value: "P3",
    label: "P3",
    color: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
  },
];

// Duration presets in minutes
const DURATION_PRESETS = [
  { value: 5, label: "5m" },
  { value: 10, label: "10m" },
  { value: 15, label: "15m" },
  { value: 30, label: "30m" },
  { value: 45, label: "45m" },
  { value: 60, label: "1h" },
  { value: 90, label: "1.5h" },
  { value: 120, label: "2h" },
];

// Priority reads like Sunsama's channel tag: a small colored label.
const PRIORITY_TEXT: Record<TaskPriority, string> = {
  P0: "text-red-500",
  P1: "text-orange-500",
  P2: "text-sky-500",
  P3: "text-muted-foreground/70",
};

/**
 * Shared content component for task cards.
 * Sunsama-inspired design with circle checkbox, duration badge, and tag support.
 */
export function TaskCardContent({
  task,
  isCompleted,
  isHovered: _isHovered,
  isDragging,
  onToggleComplete,
  onClick,
  onHoverChange,
  className,
  scheduledTime,
  tag,
  tagColor,
  subtasks,
  onToggleSubtask,
  subtasksHidden,
  onUpdateTask,
}: TaskCardContentProps) {
  const { setHoveredTask } = useHoveredTask();
  const [priorityOpen, setPriorityOpen] = React.useState(false);
  const [durationOpen, setDurationOpen] = React.useState(false);

  const handlePriorityChange = (priority: TaskPriority) => {
    onUpdateTask?.({ priority });
    setPriorityOpen(false);
  };

  const handleDurationChange = (mins: number) => {
    onUpdateTask?.({ estimatedMins: mins });
    setDurationOpen(false);
  };

  // Format scheduled time to "2:50 pm" format
  const formattedTime = React.useMemo(() => {
    if (!scheduledTime) return null;
    const date =
      typeof scheduledTime === "string"
        ? new Date(scheduledTime)
        : scheduledTime;
    return date
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase();
  }, [scheduledTime]);

  // Get first 3 subtasks for preview
  const subtasksPreview = subtasks?.slice(0, 3);
  const hasMoreSubtasks = subtasks && subtasks.length > 3;

  const hasEstimateOnly =
    (!task.actualMins || task.actualMins === 0) &&
    !task.timerStartedAt &&
    !!task.estimatedMins;
  const hasTimeInfo =
    hasEstimateOnly || !!task.timerStartedAt || (task.actualMins ?? 0) > 0;

  const estimatePicker = (trigger: React.ReactNode) => (
    <Popover open={durationOpen} onOpenChange={setDurationOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="w-auto p-1"
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-4 gap-0.5">
          {DURATION_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDurationChange(preset.value);
              }}
              className={cn(
                "px-2 py-1 text-xs rounded transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                task.estimatedMins === preset.value &&
                  "bg-accent text-accent-foreground font-medium"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUpdateTask?.({ estimatedMins: null });
            setDurationOpen(false);
          }}
          className="w-full mt-1 px-2 py-1 text-xs rounded transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          Clear
        </button>
      </PopoverContent>
    </Popover>
  );

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-1 rounded-md px-3 pt-2.5 pb-2 transition-[background-color,box-shadow,opacity] duration-150",
        // Sunsama-style card: a flat raised surface with a crisp drop shadow.
        "bg-surface hover:bg-surface-hover",
        !isDragging && !isCompleted && "shadow-card",
        "cursor-grab active:cursor-grabbing touch-none select-none",
        isDragging && "shadow-xl ring-1 ring-primary/30 rotate-[0.5deg] cursor-grabbing",
        isCompleted && "opacity-50 hover:opacity-60",
        className
      )}
      onClick={onClick}
      onMouseEnter={() => {
        onHoverChange(true);
        setHoveredTask(task);
      }}
      onMouseLeave={() => {
        onHoverChange(false);
        setHoveredTask(null);
      }}
    >
      {/* Top line: scheduled time on the left, planned / actual on the right */}
      {(formattedTime || hasTimeInfo) && (
        <div className="flex h-5 items-center justify-between gap-2">
          <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
            {formattedTime}
          </span>
          <TaskTimeBadge
            task={task}
            isCompleted={isCompleted}
            className="bg-black/20 dark:bg-black/30"
          />
          {hasEstimateOnly &&
            estimatePicker(
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="rounded bg-black/[0.06] px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground transition-colors hover:text-foreground dark:bg-black/30"
              >
                {formatDuration(task.estimatedMins!)}
              </button>
            )}
        </div>
      )}

      {/* Title - wraps to multiple lines, clamps at 3 lines max */}
      <p
        className={cn(
          "text-sm font-medium leading-snug text-foreground break-words line-clamp-3",
          isCompleted && "line-through text-muted-foreground"
        )}
      >
        {task.title}
      </p>

      {/* Subtasks preview - inline with small checkboxes */}
      {subtasksPreview && subtasksPreview.length > 0 && !subtasksHidden && (
        <div className="space-y-0.5">
          {subtasksPreview.map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-start gap-1.5 group/subtask cursor-pointer hover:bg-muted/30 rounded -mx-1 px-1 py-0.5"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSubtask?.(subtask.id);
              }}
              role="checkbox"
              aria-checked={subtask.completed}
            >
              <div
                className={cn(
                  "h-3 w-3 shrink-0 mt-0.5 rounded-full flex items-center justify-center transition-colors",
                  subtask.completed
                    ? "bg-primary/60"
                    : "border border-muted-foreground/40 group-hover/subtask:border-primary group-hover/subtask:bg-primary/10"
                )}
              >
                {subtask.completed && (
                  <Check className="h-2 w-2 text-primary-foreground" strokeWidth={3} />
                )}
              </div>
              <span
                className={cn(
                  "text-xs text-muted-foreground leading-tight break-words min-w-0",
                  subtask.completed && "line-through opacity-60"
                )}
              >
                {subtask.title}
              </span>
            </div>
          ))}
          {hasMoreSubtasks && (
            <span className="text-[11px] text-muted-foreground/60">
              +{subtasks!.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Bottom row: complete, quick actions on hover, priority on the right */}
      <div className="mt-0.5 flex h-6 items-center gap-1">
        <button
          type="button"
          className={cn(
            "-ml-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors duration-150",
            isCompleted
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-muted-foreground/35 text-transparent hover:border-emerald-500 hover:text-emerald-500"
          )}
          onClick={onToggleComplete}
          role="checkbox"
          aria-checked={isCompleted}
          aria-label={isCompleted ? "Mark incomplete" : "Complete task"}
        >
          <Check className="h-3 w-3" strokeWidth={3} />
        </button>

        {!hasTimeInfo &&
          estimatePicker(
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              aria-label="Set planned time"
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/70 opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100 data-[state=open]:opacity-100"
            >
              <Clock className="h-3.5 w-3.5" />
            </button>
          )}

        {tag && (
          <span
            className="ml-auto text-[11px]"
            style={{ color: tagColor || "hsl(var(--muted-foreground))" }}
          >
            # {tag}
          </span>
        )}

        <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Priority ${task.priority}`}
              className={cn(
                "flex h-6 items-center gap-1 rounded px-1 text-[11px] font-semibold transition-colors hover:bg-muted focus:outline-none",
                !tag && "ml-auto",
                PRIORITY_TEXT[task.priority]
              )}
            >
              <Flag className="h-3 w-3" fill="currentColor" strokeWidth={0} />
              {task.priority}
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-1"
            align="end"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-0.5">
              {PRIORITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePriorityChange(option.value);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1 text-xs rounded transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    task.priority === option.value && "bg-accent"
                  )}
                >
                  <span className={cn("flex items-center gap-1 font-semibold", PRIORITY_TEXT[option.value])}>
                    <Flag className="h-3 w-3" fill="currentColor" strokeWidth={0} />
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
