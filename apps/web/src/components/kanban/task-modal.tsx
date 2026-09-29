import { TIME_EDIT_KEYS, matchesTimeEditShortcut, usePriorityShortcut } from "@/hooks/useKeyboardShortcuts";
import * as React from "react";
import { createPortal } from "react-dom";
import {
  format,
  addMinutes,
  addDays,
  startOfWeek,
  isToday,
  isTomorrow,
  isYesterday,
  parse,
} from "date-fns";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  Repeat,
  MoreHorizontal,
  Maximize2,
  X,
  Play,
  Pause,
  Copy,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import type {
  Task,
  CreateTaskSeriesInput,
  TaskPriority,
} from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import {
  useTask,
  useUpdateTask,
  useDeleteTask,
  useCompleteTask,
  useCreateTask,
} from "@/hooks/useTasks";
import { useHoveredTask, useIsMobile } from "@/hooks";
import { useCreateSubtask, useUpdateSubtask } from "@/hooks/useSubtasks";
import { useAddTaskPosition, usePlaceNewTask } from "@/hooks/useAddTaskPosition";
import { BottomSheetContent } from "@/components/ui/bottom-sheet";
import { useTimeBlocks, useUpdateTimeBlock } from "@/hooks/useTimeBlocks";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui";
import { toast } from "@/hooks/use-toast";
import {
  TimeDropdown,
  type TimeDropdownRef,
} from "@/components/ui/time-dropdown";
import { SubtaskChecklist } from "./subtask-checklist";
import { SubtaskSizeContext } from "./subtask-size";
import {
  DatePickerPopover,
  type DatePickerPopoverRef,
} from "./task-date-picker";
import { SubtaskList, type Subtask as DraftSubtask } from "./subtask-list";
import { NotesField } from "./task-modal-form";
import { TaskAttachments } from "./task-attachments";
import { TaskSeriesBanner } from "./task-series-banner";
import { TaskSourceChips } from "./task-source-chip";
import { RepeatConfigDialog } from "./repeat-config-popover";
import { PriorityMenu } from "./priority-menu";
import { PriorityIcon, PRIORITY_META } from "@/components/ui/priority-badge";
import { WithShortcut } from "@/components/ui/with-shortcut";
import { useCreateTaskSeries } from "@/hooks/useTaskSeries";
import {
  formatClock,
  isSingleClick,
  useTaskTimerToggle,
} from "@/hooks/useTaskTimerToggle";
import { useTaskTimerDisplay } from "./task-time-badge";

// ============================================
// TaskModal Component
// ============================================

interface TaskModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Opens the modal as a composer for a new task (with `task` null): the same
   * layout as editing, but fields stay local until "Add task" creates it.
   */
  createDefaults?: { scheduledDate?: string | null };
}

export function TaskModal({
  task,
  open,
  onOpenChange,
  createDefaults,
}: TaskModalProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isCompose = !!createDefaults && !task;
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [plannedMins, setPlannedMins] = React.useState<number | null>(null);
  const subtaskInputRef = React.useRef<HTMLInputElement>(null);
  const [repeatDialogOpen, setRepeatDialogOpen] = React.useState(false);
  const [actualMins, setActualMins] = React.useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [priorityOpen, setPriorityOpen] = React.useState(false);

  // Grow the title field to fit long titles.
  React.useLayoutEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [title, open]);
  const titleRef = React.useRef<HTMLTextAreaElement>(null);

  // Composer-only state: everything a new task carries before it exists.
  const [draftPriority, setDraftPriority] = React.useState<TaskPriority>("P2");
  const [draftDate, setDraftDate] = React.useState<string | null>(null);
  const [draftSubtasks, setDraftSubtasks] = React.useState<DraftSubtask[]>([]);
  const { addPosition, setAddPosition } = useAddTaskPosition();
  const placeNewTask = usePlaceNewTask(draftDate);
  const createSubtask = useCreateSubtask();
  const updateSubtask = useUpdateSubtask();
  const [isCreating, setIsCreating] = React.useState(false);

  React.useEffect(() => {
    if (!open || !isCompose) return;
    setTitle("");
    setDescription("");
    setPlannedMins(null);
    setDraftPriority("P2");
    setDraftDate(createDefaults?.scheduledDate ?? null);
    setDraftSubtasks([]);
  }, [open, isCompose]);

  // Keep a ref to the last non-null task so the Dialog can still render content
  // during its close animation (after task prop becomes null)
  const lastTaskRef = React.useRef<Task | null>(null);
  if (task) {
    lastTaskRef.current = task;
  }
  // Clear stale ref when Dialog finishes closing
  React.useEffect(() => {
    if (!open) {
      // Wait for close animation to finish before clearing
      const timer = setTimeout(() => {
        lastTaskRef.current = null;
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [open]);

  // Refs for time dropdowns (keyboard shortcuts E/W)
  const actualTimeRef = React.useRef<TimeDropdownRef>(null);
  const plannedTimeRef = React.useRef<TimeDropdownRef>(null);
  // Ref for date picker (keyboard shortcut @)
  const datePickerRef = React.useRef<DatePickerPopoverRef>(null);

  const { setHoveredTask } = useHoveredTask();
  const createTaskSeries = useCreateTaskSeries();
  const updateTask = useUpdateTask();

  // Fetch reactive task data from query cache (updates via WebSocket + invalidation)
  // The prop `task` is a stale snapshot; this gives us live data
  const { data: freshTask } = useTask(task?.id ?? "");
  const liveTask = freshTask ?? task;

  // Live timer display — ticks every second when timer is active
  const {
    isTimerRunning,
    liveSeconds,
  } = useTaskTimerDisplay(
    liveTask ??
      ({
        timerStartedAt: null,
        timerAccumulatedSeconds: 0,
        actualMins: null,
        estimatedMins: null,
      } as any)
  );

  // Ref for timer toggle — allows keyboard handler to call the latest toggle function
  // without needing it in the effect's dependency array
  const timerToggleRef = React.useRef<() => void>(() => {});

  // Set hovered task when modal is open so keyboard shortcuts work
  React.useEffect(() => {
    if (open && task) {
      setHoveredTask(task);
    }
    return () => setHoveredTask(null);
  }, [open, task, setHoveredTask]);

  // Handle scheduled date change
  const handleScheduledDateChange = async (newDate: string | null) => {
    if (isCompose) setDraftDate(newDate);
    if (!task) return;
    await updateTask.mutateAsync({
      id: task.id,
      data: { scheduledDate: newDate },
    });
  };

  // Handle priority change
  const handlePriorityChange = async (newPriority: TaskPriority) => {
    if (isCompose) setDraftPriority(newPriority);
    if (!task) return;
    await updateTask.mutateAsync({
      id: task.id,
      data: { priority: newPriority },
    });
  };

  usePriorityShortcut(open, (priority) => {
    void handlePriorityChange(priority);
    setPriorityOpen(false);
  });

  // Handle keyboard shortcuts: F for focus, E for planned time, W for actual time, D/Z/Shift+Z for date, @ for date input
  React.useEffect(() => {
    if (!open || !task) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Space to toggle timer (same as focus mode)
      if (
        (e.key === " " || e.code === "Space") &&
        !e.repeat &&
        !e.shiftKey &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        e.preventDefault();
        timerToggleRef.current();
        return;
      }

      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        onOpenChange(false);
        navigate({ to: "/app/focus/$taskId", params: { taskId: task.id } });
        return;
      }

      if (matchesTimeEditShortcut(e, "actual")) {
        e.preventDefault();
        actualTimeRef.current?.open();
        return;
      }

      if (matchesTimeEditShortcut(e, "planned")) {
        e.preventDefault();
        plannedTimeRef.current?.open();
        return;
      }

      // D - Snooze one day (move to tomorrow)
      if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        const tomorrow = addDays(new Date(), 1);
        const formattedDate = format(tomorrow, "yyyy-MM-dd");
        handleScheduledDateChange(formattedDate);
        toast({
          title: "Snoozed one day",
          description: `"${task.title}" scheduled for ${format(tomorrow, "EEEE, MMM d")}.`,
        });
        return;
      }

      // Shift+Z - Move to next week (next Monday)
      if ((e.key === "z" || e.key === "Z") && e.shiftKey) {
        e.preventDefault();
        const today = new Date();
        const nextMonday = addDays(startOfWeek(today, { weekStartsOn: 1 }), 7);
        const formattedDate = format(nextMonday, "yyyy-MM-dd");
        handleScheduledDateChange(formattedDate);
        toast({
          title: "Moved to next week",
          description: `"${task.title}" scheduled for ${format(nextMonday, "EEEE, MMM d")}.`,
        });
        return;
      }

      // Z - Move to backlog (without shift)
      if ((e.key === "z" || e.key === "Z") && !e.shiftKey) {
        e.preventDefault();
        handleScheduledDateChange(null);
        toast({
          title: "Moved to backlog",
          description: `"${task.title}" removed from schedule.`,
        });
        return;
      }

      // @ - Focus date input
      if (e.key === "@" || (e.shiftKey && e.key === "2")) {
        e.preventDefault();
        datePickerRef.current?.open();
        setTimeout(() => datePickerRef.current?.focusInput(), 100);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, task, onOpenChange, navigate]);

  // Handle save on close
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && task) {
      const hasChanges =
        title !== task.title ||
        description !== (task.notes || "") ||
        plannedMins !== task.estimatedMins;
      // The update is optimistic, so the modal closes without waiting on it.
      if (hasChanges && title.trim()) {
        updateTask.mutate({
          id: task.id,
          data: {
            title: title.trim(),
            notes: description || null,
            estimatedMins: plannedMins,
          },
        });
      }
    }
    onOpenChange(newOpen);
  };

  const deleteTask = useDeleteTask();
  const completeTask = useCompleteTask();
  const createTask = useCreateTask();
  const updateTimeBlock = useUpdateTimeBlock();

  // Fetch time blocks for this task
  // Without a task this would list every time block the user has.
  const { data: timeBlocks = [] } = useTimeBlocks(
    task ? { taskId: task.id } : undefined,
    { enabled: !!task }
  );

  // Get the first (most relevant) time block for this task
  const activeTimeBlock = React.useMemo(() => {
    if (!timeBlocks.length) return null;
    const sorted = [...timeBlocks].sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
    return sorted[0] ?? null;
  }, [timeBlocks]);

  const isCompleted = !!task?.completedAt;

  React.useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.notes || "");
      setPlannedMins(task.estimatedMins || null);
      setActualMins(task.actualMins || null);
      setShowDeleteConfirm(false);
    }
  }, [task]);

  // Keep actualMins in sync when live task data updates (e.g., from WebSocket timer stop)
  React.useEffect(() => {
    if (liveTask && liveTask.actualMins !== undefined) {
      setActualMins(liveTask.actualMins ?? null);
    }
  }, [liveTask?.actualMins]);

  // Debounced autosave for notes - saves 1 second after user stops typing
  React.useEffect(() => {
    if (!task || !open) return;
    // Only autosave if notes actually changed from server value
    if (description === (task.notes || "")) return;

    const timeoutId = setTimeout(() => {
      updateTask.mutate({
        id: task.id,
        data: { notes: description || null },
      });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [description, task, open, updateTask]);

  const handleSave = async () => {
    if (!task || !title.trim()) return;
    await updateTask.mutateAsync({
      id: task.id,
      data: {
        title: title.trim(),
        notes: description || null,
        estimatedMins: plannedMins,
      },
    });
  };

  // Handle duration change
  const handleDurationChange = async (newDurationMins: number | null) => {
    setPlannedMins(newDurationMins);

    if (task) {
      await updateTask.mutateAsync({
        id: task.id,
        data: { estimatedMins: newDurationMins },
      });
    }

    if (activeTimeBlock && newDurationMins) {
      const blockStart = new Date(activeTimeBlock.startTime);
      const newEnd = addMinutes(blockStart, newDurationMins);
      await updateTimeBlock.mutateAsync({
        id: activeTimeBlock.id,
        data: { endTime: newEnd },
      });
    }
  };

  // Handle actual time change (manual edit via dropdown)
  const handleActualMinsChange = async (newActualMins: number | null) => {
    setActualMins(newActualMins);
    if (task) {
      await updateTask.mutateAsync({
        id: task.id,
        data: { actualMins: newActualMins ?? 0 },
      });
    }
  };

  const toggleTimer = useTaskTimerToggle();
  const handleTimerToggle = React.useCallback(() => {
    if (task) void toggleTimer(task.id);
  }, [task, toggleTimer]);

  // Keep the ref in sync so keyboard handler always calls latest version
  timerToggleRef.current = handleTimerToggle;

  const handleDelete = () => {
    if (!task) return;
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    const taskToDelete = task ?? lastTaskRef.current;
    if (!taskToDelete) return;
    setShowDeleteConfirm(false);
    await deleteTask.mutateAsync(taskToDelete.id);
    onOpenChange(false);
  };

  const handleDuplicate = async () => {
    if (!task) return;
    await createTask.mutateAsync({
      title: task.title,
      notes: task.notes ?? undefined,
      priority: task.priority,
      scheduledDate: task.scheduledDate ?? undefined,
      estimatedMins: task.estimatedMins ?? undefined,
    });
    toast({ title: "Task duplicated" });
  };

  const handleToggleComplete = async () => {
    if (!task) return;
    await completeTask.mutateAsync({ id: task.id, completed: !isCompleted });
  };


  const handleCreate = async () => {
    const trimmed = title.trim();
    if (!isCompose || !trimmed || isCreating) return;
    setIsCreating(true);
    try {
      const newTask = await createTask.mutateAsync({
        title: trimmed,
        notes: description || undefined,
        scheduledDate: draftDate ?? undefined,
        estimatedMins: plannedMins ?? undefined,
        priority: draftPriority,
      });
      // In order, so the checklist keeps the order it was typed in.
      for (const [position, st] of draftSubtasks.entries()) {
        const created = await createSubtask.mutateAsync({
          taskId: newTask.id,
          data: { title: st.title, position },
        });
        if (st.completed) {
          await updateSubtask.mutateAsync({
            taskId: newTask.id,
            subtaskId: created.id,
            data: { completed: true },
          });
        }
      }
      await placeNewTask(newTask.id, addPosition);
      onOpenChange(false);
    } finally {
      setIsCreating(false);
    }
  };

  // Use the live task for rendering, falling back to lastTaskRef during close animation
  const renderTask: Task | null =
    liveTask ??
    lastTaskRef.current ??
    (isCompose
      ? ({
          id: "draft",
          title,
          notes: description,
          priority: draftPriority,
          scheduledDate: draftDate,
          estimatedMins: plannedMins,
          actualMins: null,
          completedAt: null,
          seriesId: null,
        } as unknown as Task)
      : null);

  // If no task data at all (never opened), render nothing
  if (!renderTask) return null;

  const handleExpandToFocus = () => {
    if (!renderTask) return;
    onOpenChange(false);
    navigate({ to: "/app/focus/$taskId", params: { taskId: renderTask.id } });
  };

  const handleRepeatSave = async (config: CreateTaskSeriesInput) => {
    if (!renderTask) return;
    await createTaskSeries.mutateAsync({
      ...config,
      title: renderTask.title,
      notes: renderTask.notes ?? undefined,
      priority: renderTask.priority,
      estimatedMins: renderTask.estimatedMins ?? undefined,
    });
  };

  const iconButton = cn(
    "flex shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    isMobile ? "h-9 w-9" : "h-8 w-8"
  );
  const fieldButton =
    "flex shrink-0 flex-col items-start justify-end gap-0.5 rounded-md px-2 py-1 text-left transition-colors hover:bg-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-ring";
  const fieldLabel =
    "text-[10px] font-medium uppercase leading-3 tracking-wider text-muted-foreground/60";
  const fieldValue = "flex items-center gap-1.5 text-sm leading-5 text-muted-foreground";

  const scheduled = renderTask.scheduledDate
    ? parse(renderTask.scheduledDate, "yyyy-MM-dd", new Date())
    : null;
  const dateText = !scheduled
    ? "Backlog"
    : isToday(scheduled)
      ? "Today"
      : isTomorrow(scheduled)
        ? "Tomorrow"
        : isYesterday(scheduled)
          ? "Yesterday"
          : format(scheduled, "EEE, MMM d");

  // Properties on the left, actions on the right, like Sunsama's header.
  const header = (
    <div
      className={cn(
        "flex items-center gap-1",
        isMobile ? "px-3 pb-1 pt-1" : "px-6 pt-5"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <WithShortcut label="Start date" keys={["@"]} side="bottom">
          <span className="shrink-0">
            <DatePickerPopover
              ref={datePickerRef}
              value={renderTask.scheduledDate}
              onChange={handleScheduledDateChange}
              taskTitle={isCompose ? undefined : renderTask.title}
              className={fieldButton}
            >
              <span className={fieldLabel}>Start</span>
              <span className={cn(fieldValue, "text-foreground")}>{dateText}</span>
            </DatePickerPopover>
          </span>
        </WithShortcut>
        <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
          <PopoverTrigger asChild>
            <WithShortcut label="Priority" shortcut="editPriority" side="bottom">
              <button
                type="button"
                className={fieldButton}
                aria-label={`Priority: ${renderTask.priority} ${PRIORITY_META[renderTask.priority].description}`}
              >
                <span className={fieldValue}>
                  <PriorityIcon priority={renderTask.priority} />
                  <span className={renderTask.priority !== "P2" ? "text-foreground" : ""}>
                    {renderTask.priority} {PRIORITY_META[renderTask.priority].description}
                  </span>
                </span>
              </button>
            </WithShortcut>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <PriorityMenu
              value={renderTask.priority}
              onChange={(p) => {
                void handlePriorityChange(p);
                setPriorityOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        {!isMobile && (
          <button
            type="button"
            onClick={() => subtaskInputRef.current?.focus()}
            className="flex h-8 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            Subtasks
          </button>
        )}
        {!isCompose && (
          <>
            <DropdownMenu>
              <WithShortcut label="More actions" side="bottom">
                <DropdownMenuTrigger asChild>
                  <button type="button" className={iconButton} aria-label="More actions">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
              </WithShortcut>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={handleDuplicate}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                {!renderTask.seriesId && (
                  <DropdownMenuItem onSelect={() => setRepeatDialogOpen(true)}>
                    <Repeat className="mr-2 h-4 w-4" />
                    Repeat…
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onSelect={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <WithShortcut label="Focus mode" keys={["F"]} side="bottom">
              <button
                type="button"
                onClick={handleExpandToFocus}
                className={iconButton}
                aria-label="Open in focus mode"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </WithShortcut>
          </>
        )}
        <WithShortcut label="Close" keys={["Esc"]} side="bottom">
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className={iconButton}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </WithShortcut>
      </div>
    </div>
  );

  const timerButton = !isCompose && (
    <WithShortcut
      label={isTimerRunning ? "Stop timer" : "Start timer"}
      keys={["Space"]}
    >
      <button
        type="button"
        onClick={(e) => isSingleClick(e) && handleTimerToggle()}
        aria-label={isTimerRunning ? "Stop timer" : "Start timer"}
        className={cn(
          "flex h-9 shrink-0 items-center gap-2 rounded-md border px-3 text-xs font-medium uppercase tracking-wider transition-colors",
          isTimerRunning
            ? "border-emerald-500/70 text-emerald-500 hover:bg-emerald-500/10"
            : "border-foreground/10 text-muted-foreground hover:border-emerald-500/60 hover:text-emerald-500"
        )}
      >
        {isTimerRunning ? (
          <Pause className="h-3.5 w-3.5" />
        ) : (
          <Play className="h-3.5 w-3.5" />
        )}
        {isTimerRunning ? "Stop" : "Start"}
      </button>
    </WithShortcut>
  );

  const timeValue = "font-sans text-base font-normal tabular-nums tracking-normal";
  const actualColumn = !isCompose && (
    isTimerRunning ? (
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
          Actual
        </span>
        <span
          className={cn(
            timeValue,
            renderTask.estimatedMins && liveSeconds > renderTask.estimatedMins * 60
              ? "text-amber-500"
              : "text-emerald-500"
          )}
        >
          {formatClock(liveSeconds)}
        </span>
      </div>
    ) : (
      <TimeDropdown
        ref={actualTimeRef}
        value={actualMins}
        onChange={handleActualMinsChange}
        label="Actual"
        dropdownHeader="Actual"
        shortcutHint={TIME_EDIT_KEYS.actual.toUpperCase()}
        placeholder="0:00"
        className={timeValue}
      />
    )
  );
  const plannedColumn = (
    <TimeDropdown
      ref={plannedTimeRef}
      value={plannedMins}
      onChange={handleDurationChange}
      label="Planned"
      dropdownHeader="Planned"
      shortcutHint={isCompose ? undefined : TIME_EDIT_KEYS.planned.toUpperCase()}
      placeholder="--:--"
      className={timeValue}
    />
  );
  const times = (
    <div className="flex shrink-0 items-center gap-4">
      {actualColumn}
      {plannedColumn}
      {timerButton}
    </div>
  );

  const titleRow = (
    <div
      className={cn(
        "flex items-start gap-3",
        isMobile ? "px-5 pt-2" : "px-8 pt-6"
      )}
    >
      {isCompose ? (
        // Placeholder circle keeps the title aligned with the edit layout.
        <div className="mt-1.5 h-6 w-6 shrink-0 rounded-full border-[1.5px] border-dashed border-muted-foreground/30" />
      ) : (
        <WithShortcut label={isCompleted ? "Mark incomplete" : "Complete task"} shortcut="completeTask">
          <button
            type="button"
            role="checkbox"
            aria-checked={isCompleted}
            aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
            className={cn(
              "mt-1.5 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] transition-all active:scale-90",
              isCompleted
                ? "border-emerald-500 bg-emerald-500 text-white"
                : "border-muted-foreground/40 text-muted-foreground/40 hover:border-emerald-500 hover:text-emerald-500"
            )}
            onClick={handleToggleComplete}
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </button>
        </WithShortcut>
      )}

      <textarea
        ref={titleRef}
        autoFocus={isCompose}
        value={title}
        // Titles are one line; pasted line breaks become spaces.
        onChange={(e) => setTitle(e.target.value.replace(/[\r\n]+/g, " "))}
        onBlur={() => !isCompose && title !== renderTask.title && handleSave()}
        onKeyDown={(e) => {
          // Enter creates (composer) or saves and closes (editor).
          if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (isCompose) void handleCreate();
            else handleOpenChange(false);
          }
        }}
        enterKeyHint={isCompose ? "send" : "done"}
        rows={1}
        className={cn(
          "min-w-0 flex-1 resize-none overflow-hidden border-none bg-transparent p-0 font-medium tracking-tight leading-snug shadow-none placeholder:text-muted-foreground/45 focus:outline-none focus:ring-0",
          isMobile ? "text-xl" : "text-2xl leading-8",
          isCompleted && "text-muted-foreground line-through"
        )}
        placeholder={isCompose ? "What needs to be done?" : "Task title"}
        aria-label="Task title"
      />

      {!isMobile && <div className="pt-0.5">{times}</div>}
    </div>
  );

  // Subtasks line up under the title's checkbox, as in Sunsama.
  const subtasks = (
    <SubtaskSizeContext.Provider value="lg">
    <div className={isMobile ? "pl-[22px] pr-5 pt-2" : "pl-[34px] pr-8 pt-3"}>
      {isCompose ? (
        <SubtaskList
          subtasks={draftSubtasks}
          onSubtasksChange={setDraftSubtasks}
          addInputRef={subtaskInputRef}
        />
      ) : (
        <SubtaskChecklist
          key={renderTask.id}
          taskId={renderTask.id}
          addInputRef={subtaskInputRef}
          showHeader={false}
        />
      )}
    </div>
    </SubtaskSizeContext.Provider>
  );

  const notes = (
    <div
      className={cn(
        // Notes start where the title text starts.
        "space-y-4 border-t border-foreground/10",
        isMobile ? "mt-3 pb-6 pl-12 pr-5 pt-4" : "mt-5 pb-8 pl-[60px] pr-8 pt-6"
      )}
    >
      <NotesField
        notes={description}
        onChange={setDescription}
        onBlur={() => {
          if (!isCompose && description !== (renderTask.notes || "")) handleSave();
        }}
        placeholder="Notes…"
        minHeight={isMobile ? "96px" : "140px"}
      />
      {!isCompose && <TaskAttachments taskId={renderTask.id} />}
    </div>
  );

  const content = (
    <>
      {header}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {!isCompose && renderTask.seriesId && (
          <div className={isMobile ? "px-5 pt-2" : "px-6 pt-2"}>
            <TaskSeriesBanner task={renderTask} />
          </div>
        )}
        {titleRow}
        {isMobile && <div className="px-5 pt-3">{times}</div>}
        {!isCompose && !!renderTask.externalLinks?.length && (
          <div className={isMobile ? "px-5 pt-3" : "px-8 pt-3"}>
            <TaskSourceChips links={renderTask.externalLinks} showRefresh />
          </div>
        )}
        {subtasks}
        {notes}
      </div>
    </>
  );

  const canCreate = !!title.trim() && !isCreating;
  const composeFooter = isCompose && (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2 border-t border-border/40",
        isMobile ? "px-4 py-3" : "px-4 py-3 sm:px-6"
      )}
    >
      <button
        type="button"
        // Keep the keyboard up: don't let the tap steal focus from the title.
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => setAddPosition(addPosition === "top" ? "bottom" : "top")}
        aria-label={addPosition === "top" ? "Adding to top of the day" : "Adding to bottom of the day"}
        className={cn(
          "flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors",
          addPosition === "top"
            ? "border-primary/50 bg-primary/5 text-primary"
            : "border-border text-muted-foreground"
        )}
      >
        {addPosition === "top" ? (
          <ArrowUp className="h-3.5 w-3.5" />
        ) : (
          <ArrowDown className="h-3.5 w-3.5" />
        )}
        {addPosition === "top" ? "Top" : "Bottom"}
      </button>
      <div className="flex-1" />
      <button
        type="button"
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => void handleCreate()}
        disabled={!canCreate}
        className={cn(
          "flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-all active:scale-[0.97]",
          canCreate
            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isCreating ? "Adding…" : "Add task"}
      </button>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {isMobile ? (
          <BottomSheetContent
            onDismiss={() => handleOpenChange(false)}
            aria-describedby={undefined}
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              if (isCompose) titleRef.current?.focus({ preventScroll: true });
            }}
          >
            <DialogTitle className="sr-only">
              {isCompose ? "New task" : renderTask.title || "Task"}
            </DialogTitle>
            {content}
            {composeFooter}
          </BottomSheetContent>
        ) : (
          <DialogContent
            className="top-[8vh] flex max-h-[84vh] max-w-3xl translate-y-0 flex-col gap-0 overflow-hidden rounded-xl border-border/40 bg-surface p-0 shadow-2xl outline-none [&>button]:hidden"
            aria-describedby={undefined}
            // Don't land focus on the first control (it would show a focus
            // ring and its tooltip); the composer focuses its title itself.
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              if (isCompose) titleRef.current?.focus({ preventScroll: true });
            }}
          >
            {/* The visible title is an editable field; screen readers get it here. */}
            <DialogTitle className="sr-only">
              {isCompose ? "New task" : renderTask.title || "Task"}
            </DialogTitle>
            {content}
            {composeFooter}
          </DialogContent>
        )}

        {/* Repeat Config Dialog */}
        {renderTask && !renderTask.seriesId && (
          <RepeatConfigDialog
            title={renderTask.title}
            initialConfig={{
              notes: renderTask.notes ?? undefined,
              priority: renderTask.priority,
              estimatedMins: renderTask.estimatedMins ?? undefined,
            }}
            onSave={handleRepeatSave}
            open={repeatDialogOpen}
            onOpenChange={setRepeatDialogOpen}
          />
        )}
      </Dialog>

      {/* Delete confirmation rendered via portal outside Radix Dialog tree.
        Uses onPointerDown instead of onClick because Radix Dialog's FocusScope
        traps focus at the document level — it intercepts between pointerdown
        and click, yanking focus back into the dialog before click fires.
        onPointerDown fires before the focus trap kicks in.
        pointer-events-auto: the open modal Dialog sets `pointer-events: none`
        on <body>, which this portal would otherwise inherit. */}
      {showDeleteConfirm &&
        createPortal(
          <div
            className="pointer-events-auto fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
            onPointerDown={() => setShowDeleteConfirm(false)}
          >
            <div
              className="bg-background rounded-lg border shadow-lg p-6 max-w-sm mx-4 space-y-4"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div>
                <h3 className="text-base font-semibold">Delete task</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Are you sure you want to delete this task? This action cannot
                  be undone.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onPointerDown={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-sm font-medium rounded-md hover:bg-muted active:bg-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onPointerDown={handleDeleteConfirm}
                  className="px-3 py-1.5 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80 transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
