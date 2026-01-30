import * as React from "react";
import { Check } from "lucide-react";
import type { Task, Subtask, TaskPriority, UpdateTaskInput } from "@open-sunsama/types";
import { cn, formatDuration } from "@/lib/utils";
import { useHoveredTask } from "@/hooks/useKeyboardShortcuts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: "P0", label: "P0", color: "bg-red-500/15 text-red-600 dark:text-red-400" },
  { value: "P1", label: "P1", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  { value: "P2", label: "P2", color: "bg-blue-500/10 text-blue-500 dark:text-blue-400" },
  { value: "P3", label: "P3", color: "bg-slate-500/10 text-slate-500 dark:text-slate-400" },
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

// Priority style classes
const PRIORITY_STYLES: Record<TaskPriority, string> = {
  P0: "bg-red-500/15 text-red-600 dark:text-red-400",
  P1: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  P2: "bg-blue-500/10 text-blue-500 dark:text-blue-400",
  P3: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
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
    const date = typeof scheduledTime === "string" ? new Date(scheduledTime) : scheduledTime;
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).toLowerCase();
  }, [scheduledTime]);

  // Get first 3 subtasks for preview
  const subtasksPreview = subtasks?.slice(0, 3);
  const hasMoreSubtasks = subtasks && subtasks.length > 3;

  return (
    <div
      className={cn(
        // Base styles - Sunsama-inspired card
        "group relative flex flex-col gap-1.5 rounded-lg px-3 py-2.5 transition-all duration-200",
        // Background and border
        "bg-card hover:bg-card/80",
        "border border-border/40 hover:border-border/60",
        // Cursor
        "cursor-grab active:cursor-grabbing",
        // Touch support
        "touch-none select-none",
        // DragOverlay state (elevated)
        isDragging && "shadow-xl ring-2 ring-primary/20 rotate-[0.5deg] cursor-grabbing",
        // Completed state - muted styling with smooth transition
        isCompleted && "opacity-50 hover:opacity-60 bg-card/50",
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
      {/* Time row (if scheduled) - above checkbox/title like Sunsama */}
      {formattedTime && !isCompleted && (
        <span className="text-[11px] text-muted-foreground">
          {formattedTime}
        </span>
      )}

      {/* Main row: Checkbox, Title, Duration */}
      <div className="flex items-start gap-2.5">
        {/* Circle Checkbox */}
        <div
          className={cn(
            "relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-all duration-150",
            "cursor-pointer",
            isCompleted
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/40 hover:border-primary hover:bg-primary/10"
          )}
          onClick={onToggleComplete}
          role="checkbox"
          aria-checked={isCompleted}
        >
          {isCompleted && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
        </div>

        {/* Title */}
        <p
          className={cn(
            "min-w-0 flex-1 text-sm leading-snug text-foreground",
            isCompleted && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </p>

        {/* Duration badge - inline editable */}
        <Popover open={durationOpen} onOpenChange={setDurationOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDurationOpen(true);
              }}
              className={cn(
                "shrink-0 rounded px-1.5 py-0.5 text-[11px] tabular-nums",
                "bg-muted/50 text-muted-foreground",
                "transition-all duration-150",
                "hover:ring-1 hover:ring-primary/30 hover:bg-muted/70",
                "focus:outline-none focus:ring-1 focus:ring-primary/50",
                isCompleted && "opacity-50"
              )}
            >
              {task.estimatedMins != null && task.estimatedMins > 0
                ? formatDuration(task.estimatedMins)
                : "—"}
            </button>
          </PopoverTrigger>
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
                    task.estimatedMins === preset.value && "bg-accent text-accent-foreground font-medium"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Priority indicator - inline editable */}
        <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPriorityOpen(true);
              }}
              className={cn(
                "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium",
                "transition-all duration-150",
                "hover:ring-1 hover:ring-primary/30",
                "focus:outline-none focus:ring-1 focus:ring-primary/50",
                PRIORITY_STYLES[task.priority]
              )}
            >
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
                  <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", option.color)}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Subtasks preview - inline with small checkboxes */}
      {subtasksPreview && subtasksPreview.length > 0 && !isCompleted && !subtasksHidden && (
        <div className="pl-6 space-y-1">
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
            <span className="text-[10px] text-muted-foreground/50 pl-4">
              +{subtasks!.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Bottom row: Tag/Project (right-aligned) */}
      {tag && !isCompleted && (
        <div className="flex justify-end">
          <span
            className="text-[11px] px-1.5 py-0.5 rounded"
            style={{ 
              color: tagColor || 'hsl(var(--muted-foreground))',
              backgroundColor: tagColor ? `${tagColor}15` : 'transparent'
            }}
          >
            # {tag}
          </span>
        </div>
      )}
    </div>
  );
}
