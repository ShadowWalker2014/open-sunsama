import * as React from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Check, X, Calendar, MoreHorizontal, Trash2, Copy } from "lucide-react";
import { format, parse, addDays, startOfWeek } from "date-fns";
import { useTask, useUpdateTask, useTasks, useCreateTask, useDeleteTask, useCompleteTask } from "@/hooks/useTasks";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import {
  FocusTimer,
  FocusSubtasks,
  CalendarSidebar,
} from "@/components/focus";
import { NotesField } from "@/components/ui/notes-field";
import { WithShortcut } from "@/components/ui/with-shortcut";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PriorityIcon, PRIORITY_META } from "@/components/ui/priority-badge";
import { PriorityMenu } from "@/components/kanban/priority-menu";
import { SubtaskSizeContext } from "@/components/kanban/subtask-size";
import type { FocusTimerRef } from "@/components/focus/focus-timer";
import { shouldIgnoreShortcut, matchesTimeEditShortcut } from "@/hooks/useKeyboardShortcuts";
import { cn } from "@/lib/utils";
import { TaskSeriesBanner } from "@/components/kanban/task-series-banner";
import { toast } from "@/hooks/use-toast";
import type { TaskPriority } from "@open-sunsama/types";

/**
 * Full-screen focus mode view for a single task
 * Clean, minimal design focused on the task at hand
 */
export default function FocusPage() {
  const { taskId } = useParams({ from: "/app/focus/$taskId" });
  const navigate = useNavigate();
  const { data: task, isLoading, error } = useTask(taskId);
  const updateTask = useUpdateTask();
  const completeTask = useCompleteTask();

  const [notes, setNotes] = React.useState("");
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [wasCompleted, setWasCompleted] = React.useState(false);
  const [editingTitle, setEditingTitle] = React.useState(false);
  const [priorityOpen, setPriorityOpen] = React.useState(false);
  const [titleValue, setTitleValue] = React.useState("");
  const titleInputRef = React.useRef<HTMLInputElement>(null);

  // Timer ref to expose toggle function for keyboard shortcut
  const timerRef = React.useRef<FocusTimerRef | null>(null);

  // Fetch today's tasks to find next incomplete task
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: todayTasks = [] } = useTasks({ scheduledDate: today });

  // Get incomplete tasks sorted by position (excluding current)
  const nextIncompleteTask = React.useMemo(() => {
    const incompleteTasks = todayTasks
      .filter((t) => !t.completedAt && t.id !== taskId)
      .sort((a, b) => a.position - b.position);
    return incompleteTasks[0] ?? null;
  }, [todayTasks, taskId]);

  // Track if task was just completed to trigger auto-navigation
  React.useEffect(() => {
    if (task?.completedAt && !wasCompleted) {
      setWasCompleted(true);
      // Small delay for visual feedback before switching
      const timer = setTimeout(() => {
        if (nextIncompleteTask) {
          navigate({
            to: "/app/focus/$taskId",
            params: { taskId: nextIncompleteTask.id },
          });
        } else {
          navigate({ to: "/app/focus/complete" });
        }
      }, 800);
      return () => clearTimeout(timer);
    }
    if (!task?.completedAt) {
      setWasCompleted(false);
    }
    return undefined;
  }, [task?.completedAt, wasCompleted, nextIncompleteTask, navigate]);

  // Sync notes and title with task data
  React.useEffect(() => {
    if (task?.notes) {
      setNotes(task.notes);
    }
    if (task?.title) {
      setTitleValue(task.title);
    }
  }, [task?.notes, task?.title]);

  // --- Handlers needed by keyboard shortcuts (must be declared before useEffect) ---
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();

  const handleScheduledDateChange = React.useCallback(
    (newDate: string | null) => {
      if (task) {
        updateTask.mutate({ id: task.id, data: { scheduledDate: newDate } });
      }
    },
    [task, updateTask]
  );

  const goBack = React.useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate({ to: "/app" });
    }
  }, [navigate]);

  const handleDelete = React.useCallback(() => {
    if (!task) return;
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTask.mutate(task.id);
      goBack();
    }
  }, [task, deleteTask, goBack]);

  const handleDuplicate = React.useCallback(() => {
    if (!task) return;
    createTask.mutate({
      title: task.title,
      notes: task.notes ?? undefined,
      priority: task.priority,
      scheduledDate: task.scheduledDate ?? undefined,
      estimatedMins: task.estimatedMins ?? undefined,
    });
    toast({ title: "Task duplicated" });
  }, [task, createTask]);

  // Handle keyboard shortcuts (Esc to close, Space to toggle timer, E/W for time editing)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we should ignore (typing in input/textarea)
      if (shouldIgnoreShortcut(e)) return;

      // Esc to close focus mode (popovers and menus keep their own Escape)
      if (e.key === "Escape") {
        goBack();
        return;
      }

      // Space to toggle timer
      if (
        (e.key === " " || e.code === "Space") &&
        !e.repeat &&
        !e.shiftKey &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        e.preventDefault();
        timerRef.current?.toggle();
        return;
      }

      // W to edit actual time (only when timer is not running)
      if (matchesTimeEditShortcut(e, "actual")) {
        if (!timerRef.current?.isRunning) {
          e.preventDefault();
          timerRef.current?.openActualTimeDropdown();
        }
        return;
      }

      // E to edit planned time
      if (matchesTimeEditShortcut(e, "planned")) {
        e.preventDefault();
        timerRef.current?.openPlannedTimeDropdown();
        return;
      }

      // D - Snooze one day
      if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        const tomorrow = addDays(new Date(), 1);
        handleScheduledDateChange(format(tomorrow, "yyyy-MM-dd"));
        toast({ title: "Snoozed one day", description: `Scheduled for ${format(tomorrow, "EEEE, MMM d")}.` });
        return;
      }

      // Shift+Z - Move to next week
      if ((e.key === "z" || e.key === "Z") && e.shiftKey) {
        e.preventDefault();
        const nextMonday = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 7);
        handleScheduledDateChange(format(nextMonday, "yyyy-MM-dd"));
        toast({ title: "Moved to next week", description: `Scheduled for ${format(nextMonday, "EEEE, MMM d")}.` });
        return;
      }

      // Z - Move to backlog
      if ((e.key === "z" || e.key === "Z") && !e.shiftKey) {
        e.preventDefault();
        handleScheduledDateChange(null);
        toast({ title: "Moved to backlog" });
        return;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, goBack, handleScheduledDateChange]);

  // Auto-save notes on blur with debounce
  const saveNotesTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleNotesChange = React.useCallback(
    (newNotes: string) => {
      setNotes(newNotes);

      // Debounce the save
      if (saveNotesTimeoutRef.current) {
        clearTimeout(saveNotesTimeoutRef.current);
      }

      saveNotesTimeoutRef.current = setTimeout(() => {
        if (task && newNotes !== task.notes) {
          updateTask.mutate({
            id: task.id,
            data: { notes: newNotes || null },
          });
        }
      }, 1000);
    },
    [task, updateTask]
  );

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (saveNotesTimeoutRef.current) {
        clearTimeout(saveNotesTimeoutRef.current);
      }
    };
  }, []);

  const handleTitleSave = React.useCallback(() => {
    const trimmed = titleValue.trim();
    if (task && trimmed && trimmed !== task.title) {
      updateTask.mutate({ id: task.id, data: { title: trimmed } });
    }
    setEditingTitle(false);
  }, [task, titleValue, updateTask]);

  const handleToggleComplete = React.useCallback(() => {
    if (task) {
      // Use completeTask (POST /tasks/:id/complete) which auto-stops
      // any running timer and saves actualMins on the server
      completeTask.mutate({ id: task.id, completed: !task.completedAt });
    }
  }, [task, completeTask]);

  const handleActualMinsChange = React.useCallback(
    (mins: number | null) => {
      if (task) {
        updateTask.mutate({ id: task.id, data: { actualMins: mins } });
      }
    },
    [task, updateTask]
  );

  const handlePlannedMinsChange = React.useCallback(
    (mins: number | null) => {
      if (task) {
        updateTask.mutate({ id: task.id, data: { estimatedMins: mins } });
      }
    },
    [task, updateTask]
  );

  const handlePriorityChange = React.useCallback(
    (newPriority: TaskPriority) => {
      if (task) {
        updateTask.mutate({ id: task.id, data: { priority: newPriority } });
      }
    },
    [task, updateTask]
  );

  const handleClose = React.useCallback(() => {
    goBack();
  }, [goBack]);

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error || !task) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background">
        <p className="text-muted-foreground">Task not found</p>
        <Button variant="outline" size="sm" onClick={handleClose}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to tasks
        </Button>
      </div>
    );
  }

  const isCompleted = !!task.completedAt;

  const scheduled = task.scheduledDate
    ? parse(task.scheduledDate, "yyyy-MM-dd", new Date())
    : null;

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-surface">
      {/* Top bar: back on the left, actions on the right, no chrome. */}
      <div className="sticky top-0 z-10 flex h-14 items-center justify-between bg-surface/90 px-4 backdrop-blur-sm sm:px-6">
        <WithShortcut label="Back" keys={["Esc"]} side="bottom">
          <button
            onClick={handleClose}
            className="flex h-8 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </WithShortcut>
        <div className="flex items-center gap-0.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="More actions"
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={handleDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <WithShortcut label="Close" keys={["Esc"]} side="bottom">
            <button
              onClick={handleClose}
              aria-label="Close focus mode"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </WithShortcut>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-5 pb-16 pt-6 sm:px-10 sm:pt-[10vh]">
        {/* Title with the timer on the right, as in Sunsama's focus mode. */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <WithShortcut
              label={isCompleted ? "Mark incomplete" : "Complete task"}
              shortcut="completeTask"
            >
              <button
                onClick={handleToggleComplete}
                role="checkbox"
                aria-checked={isCompleted}
                aria-label={isCompleted ? "Mark incomplete" : "Complete task"}
                className={cn(
                  "mt-1.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-all active:scale-90",
                  isCompleted
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-muted-foreground/40 text-muted-foreground/40 hover:border-emerald-500 hover:text-emerald-500"
                )}
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </button>
            </WithShortcut>

            {editingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleSave();
                  if (e.key === "Escape") {
                    setTitleValue(task.title);
                    setEditingTitle(false);
                  }
                }}
                autoFocus
                data-escape-local="true"
                aria-label="Task title"
                className="min-w-0 flex-1 border-none bg-transparent text-[28px] font-medium leading-10 tracking-tight outline-none focus:ring-0 sm:text-[34px]"
              />
            ) : (
              <h1
                onClick={() => !isCompleted && setEditingTitle(true)}
                className={cn(
                  "min-w-0 flex-1 cursor-text break-words text-[28px] font-medium leading-10 tracking-tight sm:text-[34px]",
                  isCompleted && "text-muted-foreground line-through"
                )}
              >
                {task.title}
              </h1>
            )}
          </div>

          <div className="pl-[38px] sm:pl-0">
            <FocusTimer
              task={task}
              onActualMinsChange={handleActualMinsChange}
              onPlannedMinsChange={handlePlannedMinsChange}
              timerRef={timerRef}
            />
          </div>
        </div>

        {/* Quiet details under the title: priority and day. */}
        <div className="mt-2 flex items-center gap-1 pl-[30px] text-sm text-muted-foreground">
          <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-accent hover:text-foreground">
                <PriorityIcon priority={task.priority} />
                {task.priority} {PRIORITY_META[task.priority].description}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <PriorityMenu
                value={task.priority}
                onChange={(p) => {
                  handlePriorityChange(p);
                  setPriorityOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
          {scheduled && (
            <span className="flex items-center gap-1.5 px-2 py-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(scheduled, "EEE, MMM d")}
            </span>
          )}
        </div>

        {task.seriesId && (
          <div className="mt-4 pl-[38px]">
            <TaskSeriesBanner task={task} />
          </div>
        )}

        <SubtaskSizeContext.Provider value="lg">
          <div className="mt-5 pl-[3px]">
            <FocusSubtasks taskId={task.id} />
          </div>
        </SubtaskSizeContext.Provider>

        <div className="mt-8 pl-[30px]">
          <NotesField
            notes={notes}
            onChange={handleNotesChange}
            onBlur={() => undefined}
            placeholder="Notes…"
            minHeight="160px"
          />
        </div>
      </div>

      {/* Calendar sidebar on hover */}
      <CalendarSidebar
        isOpen={isCalendarOpen}
        onOpenChange={setIsCalendarOpen}
        currentTaskId={task.id}
      />
    </div>
  );
}
