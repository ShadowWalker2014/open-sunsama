import * as React from "react";
import { Check, Clock } from "lucide-react";
import type {
  Task,
  Subtask,
  TaskPriority,
  UpdateTaskInput,
} from "@open-sunsama/types";
import { cn, formatDuration } from "@/lib/utils";
import { useHoveredTask, TIME_EDIT_KEYS } from "@/hooks/useKeyboardShortcuts";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TaskTimeBadge } from "./task-time-badge";
import { DurationPicker } from "@/components/ui/duration-picker";
import { WithShortcut } from "@/components/ui/with-shortcut";
import { EDIT_ESTIMATE_EVENT } from "@/components/task-shortcuts-handler";
import { PRIORITY_META } from "@/components/ui/priority-badge";
import { PriorityMenu } from "./priority-menu";

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
  /** The time is projected from the day's order, not a calendar block. */
  timeIsProjected?: boolean;
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
  timeIsProjected = false,
  tag,
  tagColor,
  subtasks,
  onToggleSubtask,
  subtasksHidden,
  onUpdateTask,
}: TaskCardContentProps) {
  const { setHoveredTask } = useHoveredTask();

  // "E" while hovering a card opens its planned-time picker.
  React.useEffect(() => {
    const open = (e: Event) => {
      if ((e as CustomEvent<string>).detail === task.id) setDurationOpen(true);
    };
    window.addEventListener(EDIT_ESTIMATE_EVENT, open);
    return () => window.removeEventListener(EDIT_ESTIMATE_EVENT, open);
  }, [task.id]);
  const [priorityOpen, setPriorityOpen] = React.useState(false);
  const [durationOpen, setDurationOpen] = React.useState(false);

  const handlePriorityChange = (priority: TaskPriority) => {
    onUpdateTask?.({ priority });
    setPriorityOpen(false);
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

  const hasEstimateOnly =
    (!task.actualMins || task.actualMins === 0) &&
    !task.timerStartedAt &&
    !!task.estimatedMins;
  const hasTimeInfo =
    hasEstimateOnly || !!task.timerStartedAt || (task.actualMins ?? 0) > 0;

  const estimatePicker = (
    trigger: React.ReactNode,
    align: "start" | "end" = "end"
  ) => (
    <Popover open={durationOpen} onOpenChange={setDurationOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align={align}
        onClick={(e) => e.stopPropagation()}
      >
        <DurationPicker
          value={task.estimatedMins}
          shortcut={TIME_EDIT_KEYS.planned.toUpperCase()}
          onChange={(mins) => {
            onUpdateTask?.({ estimatedMins: mins });
            setDurationOpen(false);
          }}
          onClose={() => setDurationOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );

  const priorityChip = (
    <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
      <PopoverTrigger asChild>
        <WithShortcut
          label={`${task.priority} · ${PRIORITY_META[task.priority].description}`}
          keys={["0", "1", "2", "3"]}
        >
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            aria-label={`${task.priority} · ${PRIORITY_META[task.priority].description}`}
            className={cn(
              "shrink-0 rounded px-1.5 py-px text-[10px] font-semibold transition-[opacity,box-shadow] hover:ring-1 hover:ring-foreground/20 focus:outline-hidden",
              PRIORITY_CHIP[task.priority],
              // Normal is the default, so it only shows on hover.
              task.priority === "P2" &&
                "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
            )}
          >
            {task.priority}
          </button>
        </WithShortcut>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <PriorityMenu value={task.priority} onChange={handlePriorityChange} />
      </PopoverContent>
    </Popover>
  );

  const timeChip = hasEstimateOnly ? (
    estimatePicker(
      <WithShortcut label="Planned time" shortcut="editEstimate">
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 rounded bg-black/[0.06] px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground transition-colors hover:text-foreground dark:bg-black/30"
        >
          {formatDuration(task.estimatedMins!)}
        </button>
      </WithShortcut>
    )
  ) : hasTimeInfo ? (
    estimatePicker(
      <WithShortcut label="Planned time" shortcut="editEstimate">
        <button type="button" aria-label="Edit planned time" onClick={(e) => e.stopPropagation()}>
          <TaskTimeBadge task={task} isCompleted={isCompleted}
            className="pointer-events-none shrink-0 bg-black/[0.06] dark:bg-black/30" />
        </button>
      </WithShortcut>
    )
  ) : (
    estimatePicker(
      <WithShortcut label="Planned time" shortcut="editEstimate">
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          aria-label="Set planned time"
          className="-mr-1 flex h-5 w-6 shrink-0 items-center justify-center rounded text-muted-foreground/70 opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100 data-[state=open]:opacity-100"
        >
          <Clock className="h-3.5 w-3.5" />
        </button>
      </WithShortcut>
    )
  );

  const hasSubtasks = !!subtasks?.length && !subtasksHidden;
  const showMeta = !!formattedTime || task.priority !== "P2" || !!tag;

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-1 rounded-lg px-3 py-2 transition-[background-color,box-shadow,opacity] duration-150",
        "bg-surface hover:bg-surface-hover",
        !isDragging && !isCompleted && "shadow-card",
        "cursor-grab active:cursor-grabbing touch-none select-none",
        isDragging &&
          "shadow-xl ring-1 ring-primary/30 rotate-[0.5deg] cursor-grabbing",
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
      {/* Checkbox, title, and the time on the right: one line to scan. */}
      <div className="flex items-start gap-2.5">
        <WithShortcut
          label={isCompleted ? "Mark incomplete" : "Complete task"}
          shortcut="completeTask"
        >
          <button
            type="button"
            className={cn(
              "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors duration-150",
              isCompleted
                ? "border-emerald-500 bg-emerald-500 text-white"
                : "border-muted-foreground/40 text-transparent hover:border-emerald-500 hover:text-emerald-500"
            )}
            onClick={onToggleComplete}
            role="checkbox"
            aria-checked={isCompleted}
            aria-label={isCompleted ? "Mark incomplete" : "Complete task"}
          >
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
          </button>
        </WithShortcut>
        <p
          className={cn(
            "min-w-0 flex-1 break-words text-sm leading-5 text-foreground line-clamp-3",
            isCompleted && "text-muted-foreground line-through"
          )}
        >
          {task.title}
        </p>
        {timeChip}
      </div>

      {/* When it starts, how urgent it is, and its channel. */}
      {showMeta && (
        <div className="flex h-4 items-center gap-2 pl-6">
          {formattedTime && (
            <span
              className={cn(
                "text-[11px] font-medium tabular-nums",
                timeIsProjected
                  ? "text-muted-foreground/60"
                  : "text-muted-foreground"
              )}
              title={
                timeIsProjected
                  ? "Projected start, from the order of the day's list"
                  : "Blocked on the calendar"
              }
            >
              {formattedTime}
            </span>
          )}
          {priorityChip}
          {tag && (
            <span
              className="ml-auto text-[11px]"
              style={{ color: tagColor || "hsl(var(--muted-foreground))" }}
            >
              # {tag}
            </span>
          )}
        </div>
      )}

      {hasSubtasks && (
        <div className="pl-6">
          <SubtaskChecklistPreview
            subtasks={subtasks!}
            onToggleSubtask={onToggleSubtask}
          />
        </div>
      )}
    </div>
  );
}

const PRIORITY_CHIP: Record<TaskPriority, string> = {
  P0: "bg-red-500/15 text-red-500 dark:text-red-400",
  P1: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  P2: "bg-blue-500/10 text-blue-500 dark:text-blue-400",
  P3: "bg-muted text-muted-foreground",
};

// Long checklists show this many rows until "+N more" is clicked.
const SUBTASK_PREVIEW = 4;

/**
 * The subtasks, right on the card: each can be ticked without opening the
 * task. Long lists fold after a few rows.
 */
export function SubtaskChecklistPreview({
  subtasks,
  onToggleSubtask,
}: {
  subtasks: Pick<Subtask, "id" | "title" | "completed">[];
  onToggleSubtask?: (subtaskId: string) => void;
}) {
  const [showAll, setShowAll] = React.useState(false);
  // One more row costs the same space as the "+1 more" line, so show it.
  const fold = !showAll && subtasks.length > SUBTASK_PREVIEW + 1;
  const visible = fold ? subtasks.slice(0, SUBTASK_PREVIEW) : subtasks;

  return (
    <ul className="space-y-px">
      {visible.map((subtask) => (
        <li key={subtask.id}>
          <button
            type="button"
            role="checkbox"
            aria-checked={subtask.completed}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSubtask?.(subtask.id);
            }}
            className="group/subtask -mx-1 flex w-[calc(100%+0.5rem)] items-start gap-2 rounded px-1 py-0.5 text-left transition-colors hover:bg-muted/40"
          >
            <span
              className={cn(
                "mt-px flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-colors",
                subtask.completed
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-muted-foreground/40 text-transparent group-hover/subtask:border-emerald-500 group-hover/subtask:text-emerald-500"
              )}
            >
              <Check className="h-2 w-2" strokeWidth={3.5} />
            </span>
            <span
              className={cn(
                "min-w-0 break-words text-[13px] leading-4 text-muted-foreground",
                subtask.completed && "text-muted-foreground/60 line-through"
              )}
            >
              {subtask.title}
            </span>
          </button>
        </li>
      ))}
      {fold && (
        <li>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowAll(true);
            }}
            className="pl-[1.375rem] text-[11px] text-muted-foreground/70 transition-colors hover:text-foreground"
          >
            +{subtasks.length - SUBTASK_PREVIEW} more
          </button>
        </li>
      )}
    </ul>
  );
}
