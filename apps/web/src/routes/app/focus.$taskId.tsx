import * as React from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Check, X, Calendar } from "lucide-react";
import { format, parse } from "date-fns";
import { useTask, useUpdateTask, useTasks } from "@/hooks/useTasks";
import { Button } from "@/components/ui";
import {
  FocusTimer,
  FocusSubtasks,
  FocusNotes,
  CalendarSidebar,
} from "@/components/focus";
import type { FocusTimerRef } from "@/components/focus/focus-timer";
import { shouldIgnoreShortcut } from "@/hooks/useKeyboardShortcuts";
import { cn } from "@/lib/utils";
import { InlinePrioritySelector } from "@/components/kanban/priority-selector";
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

  const [notes, setNotes] = React.useState("");
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [wasCompleted, setWasCompleted] = React.useState(false);
  const [editingTitle, setEditingTitle] = React.useState(false);
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

  // Handle keyboard shortcuts (Esc to close, Space to toggle timer, E/W for time editing)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we should ignore (typing in input/textarea)
      if (shouldIgnoreShortcut(e)) return;

      // Esc to close focus mode
      if (e.key === "Escape") {
        navigate({ to: "/app" });
        return;
      }

      // Space to toggle timer
      if (
        (e.key === " " || e.code === "Space") &&
        !e.shiftKey &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        e.preventDefault();
        timerRef.current?.toggle();
        return;
      }

      // E to edit actual time (only when timer is not running)
      if (e.key === "e" || e.key === "E") {
        if (!timerRef.current?.isRunning) {
          e.preventDefault();
          timerRef.current?.openActualTimeDropdown();
        }
        return;
      }

      // W to edit planned time
      if (e.key === "w" || e.key === "W") {
        e.preventDefault();
        timerRef.current?.openPlannedTimeDropdown();
        return;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

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
      updateTask.mutate({
        id: task.id,
        data: { completedAt: task.completedAt ? null : new Date() },
      });
    }
  }, [task, updateTask]);

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
    navigate({ to: "/app" });
  }, [navigate]);

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

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-auto">
      {/* Top bar - minimal */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="mx-auto max-w-3xl px-6 h-12 flex items-center justify-between">
          <button
            onClick={handleClose}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main content - centered with generous top padding */}
      <div className="mx-auto max-w-3xl px-6 pt-16 pb-12">
        {/* Task header row - checkbox, title, time tracking, start button */}
        <div className="flex items-center gap-4 mb-10">
          {/* Large checkbox */}
          <button
            onClick={handleToggleComplete}
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all",
              isCompleted
                ? "border-primary bg-primary text-primary-foreground scale-110"
                : "border-muted-foreground/30 hover:border-primary hover:scale-105"
            )}
          >
            {isCompleted && <Check className="h-4 w-4" strokeWidth={2.5} />}
          </button>

          {/* Title - click to edit */}
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
              className={cn(
                "flex-1 text-xl font-semibold bg-transparent border-none outline-none",
                "focus:ring-0 placeholder:text-muted-foreground/50",
                isCompleted && "line-through text-muted-foreground"
              )}
              placeholder="Task title..."
            />
          ) : (
            <h1
              onClick={() => !isCompleted && setEditingTitle(true)}
              className={cn(
                "flex-1 text-xl font-semibold leading-tight cursor-text",
                isCompleted && "line-through text-muted-foreground"
              )}
            >
              {task.title}
            </h1>
          )}

          {/* Timer section - inline with title */}
          <FocusTimer
            taskId={task.id}
            plannedMins={task.estimatedMins}
            actualMins={task.actualMins ?? null}
            onActualMinsChange={handleActualMinsChange}
            onPlannedMinsChange={handlePlannedMinsChange}
            timerRef={timerRef}
            compact
          />
        </div>

        {/* Task metadata - priority and date */}
        <div className="flex items-center gap-4 mb-8 -mt-4">
          <InlinePrioritySelector
            priority={task.priority}
            onChange={handlePriorityChange}
          />
          {task.scheduledDate && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{format(parse(task.scheduledDate, "yyyy-MM-dd", new Date()), "EEE, MMM d")}</span>
            </div>
          )}
        </div>

        {/* Subtasks section */}
        <div className="mb-8">
          <FocusSubtasks taskId={task.id} />
        </div>

        {/* Notes section */}
        <div className="mb-12">
          <FocusNotes notes={notes} onChange={handleNotesChange} />
        </div>

        {/* Keyboard hints */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground/50">
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
              Space
            </kbd>{" "}
            timer
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
              Esc
            </kbd>{" "}
            close
          </span>
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
