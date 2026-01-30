import * as React from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useTask, useUpdateTask, useTasks } from "@/hooks/useTasks";
import { Button } from "@/components/ui";
import {
  FocusHeader,
  FocusTimer,
  FocusSubtasks,
  FocusNotes,
  CalendarSidebar,
} from "@/components/focus";

/**
 * Full-screen focus mode view for a single task
 * Provides distraction-free environment with timer tracking
 */
export default function FocusPage() {
  const { taskId } = useParams({ from: "/app/focus/$taskId" });
  const navigate = useNavigate();
  const { data: task, isLoading, error } = useTask(taskId);
  const updateTask = useUpdateTask();

  const [notes, setNotes] = React.useState("");
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [wasCompleted, setWasCompleted] = React.useState(false);

  // Fetch today's tasks to find next incomplete task
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: todayTasks = [] } = useTasks({ scheduledDate: today });

  // Get incomplete tasks sorted by position (excluding current)
  const nextIncompleteTask = React.useMemo(() => {
    const incompleteTasks = todayTasks
      .filter(t => !t.completedAt && t.id !== taskId)
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
          navigate({ to: "/app/focus/$taskId", params: { taskId: nextIncompleteTask.id } });
        } else {
          navigate({ to: "/app/focus/complete" });
        }
      }, 600);
      return () => clearTimeout(timer);
    }
    if (!task?.completedAt) {
      setWasCompleted(false);
    }
  }, [task?.completedAt, wasCompleted, nextIncompleteTask, navigate]);

  // Sync notes with task data
  React.useEffect(() => {
    if (task?.notes) {
      setNotes(task.notes);
    }
  }, [task?.notes]);

  // Handle Esc key to close
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate({ to: "/app" });
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

  const handleTitleChange = React.useCallback(
    (title: string) => {
      if (task) {
        updateTask.mutate({ id: task.id, data: { title } });
      }
    },
    [task, updateTask]
  );

  const handleToggleComplete = React.useCallback(() => {
    if (task) {
      updateTask.mutate({
        id: task.id,
        data: { completedAt: task.completedAt ? null : new Date() },
      });
    }
  }, [task, updateTask]);

  const handleActualMinsChange = React.useCallback(
    (mins: number) => {
      if (task) {
        updateTask.mutate({ id: task.id, data: { actualMins: mins } });
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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error || !task) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background">
        <p className="text-lg text-muted-foreground">Task not found</p>
        <Button variant="outline" onClick={handleClose}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to tasks
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-auto">
      <div className="mx-auto max-w-3xl px-6 py-4">
        {/* Header with title and close */}
        <FocusHeader
          title={task.title}
          priority={task.priority}
          isCompleted={!!task.completedAt}
          onTitleChange={handleTitleChange}
          onToggleComplete={handleToggleComplete}
          onClose={handleClose}
        />

        {/* Timer section */}
        <FocusTimer
          taskId={task.id}
          plannedMins={task.estimatedMins}
          actualMins={task.actualMins ?? null}
          onActualMinsChange={handleActualMinsChange}
        />

        {/* Divider */}
        <div className="border-t my-6" />

        {/* Subtasks section */}
        <FocusSubtasks taskId={task.id} />

        {/* Divider */}
        <div className="border-t my-6" />

        {/* Notes section */}
        <FocusNotes notes={notes} onChange={handleNotesChange} />

        {/* Spacer for scroll */}
        <div className="h-20" />
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
