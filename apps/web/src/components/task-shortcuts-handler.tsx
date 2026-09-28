import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  SHORTCUTS,
  matchesShortcut,
  shouldIgnoreShortcut,
  useHoveredTask,
} from "@/hooks/useKeyboardShortcuts";
import {
  useCompleteTask,
  useCreateTask,
  useDeleteTask,
  useReorderTasks,
  useTasks,
  useUpdateTask,
} from "@/hooks/useTasks";
import { useSubtasks, useUpdateSubtask } from "@/hooks/useSubtasks";
import { useAutoSchedule } from "@/hooks";
import { taskKeys } from "@/lib/query-keys";
import { toast } from "@/hooks/use-toast";
import { addDays, startOfWeek, startOfDay, format, parseISO } from "date-fns";
import type { Task, TaskPriority } from "@open-sunsama/types";

/** Asks the card with this task id to open its planned-time picker. */
export const EDIT_ESTIMATE_EVENT = "open-sunsama:edit-estimate";

interface TaskShortcutsHandlerProps {
  onNavigateToday: () => void;
  onNavigateNext: () => void;
  onNavigatePrevious: () => void;
  onEditEstimate?: (taskId: string) => void;
  onSelect?: (task: Task) => void;
}

/**
 * Task-specific keyboard shortcuts handler.
 * Only handles shortcuts that require being on the tasks page with a hovered task.
 * Renders nothing - just listens for keyboard events.
 */
export function TaskShortcutsHandler({
  onNavigateToday,
  onNavigateNext,
  onNavigatePrevious,
  onEditEstimate,
  onSelect,
}: TaskShortcutsHandlerProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hoveredTask, hoveredSubtaskId } = useHoveredTask();

  // The hovered task is a snapshot captured at mouse-enter time, so its
  // `completedAt` can be stale (e.g. right after completing it without moving
  // the cursor). Resolve the freshest copy from the caches so toggling always
  // flips the *current* state — letting `c` uncomplete a just-completed task.
  const getFreshTask = React.useCallback(
    (task: Task): Task => {
      const detail = queryClient.getQueryData<Task>(taskKeys.detail(task.id));
      if (detail) return detail;

      const lists = queryClient.getQueriesData<Task[]>({
        queryKey: taskKeys.lists(),
      });
      for (const [, data] of lists) {
        const found = data?.find((t) => t.id === task.id);
        if (found) return found;
      }

      // List view stores tasks in the infinite-search cache, not lists().
      const infinite = queryClient.getQueriesData({
        queryKey: ["tasks", "search", "infinite"],
      });
      for (const [, data] of infinite) {
        if (!data || typeof data !== "object" || !("pages" in data)) continue;
        const pages = (data as { pages: Array<{ data: Task[] }> }).pages;
        for (const page of pages) {
          const found = page.data?.find((t) => t.id === task.id);
          if (found) return found;
        }
      }

      return task;
    },
    [queryClient]
  );

  const completeTask = useCompleteTask();
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();
  const updateTask = useUpdateTask();
  const updateSubtask = useUpdateSubtask();
  const autoSchedule = useAutoSchedule();

  // Fetch tasks for the hovered task's column to enable move to top/bottom
  // Query is disabled when no task is hovered (passes undefined)
  const columnFilters = React.useMemo(() => {
    if (!hoveredTask) return undefined;
    return hoveredTask.scheduledDate
      ? { scheduledDate: hoveredTask.scheduledDate }
      : { backlog: true };
  }, [hoveredTask?.id, hoveredTask?.scheduledDate]);

  const { data: tasksInColumn } = useTasks(columnFilters);

  // Fetch subtasks for the hovered task
  const { data: subtasks } = useSubtasks(hoveredTask?.id ?? "");

  const reorderTasks = useReorderTasks();

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Ignore if typing in input
      if (shouldIgnoreShortcut(event)) return;

      // Navigation shortcuts (don't require hovering)

      // Focus today (Shift + Space)
      if (
        SHORTCUTS.focusToday &&
        matchesShortcut(event, SHORTCUTS.focusToday)
      ) {
        event.preventDefault();
        onNavigateToday();
        return;
      }

      // Next day (Shift + Right)
      if (SHORTCUTS.nextDay && matchesShortcut(event, SHORTCUTS.nextDay)) {
        event.preventDefault();
        onNavigateNext();
        return;
      }

      // Previous day (Shift + Left)
      if (
        SHORTCUTS.previousDay &&
        matchesShortcut(event, SHORTCUTS.previousDay)
      ) {
        event.preventDefault();
        onNavigatePrevious();
        return;
      }

      // === Task-specific shortcuts (require hovering) ===

      // Complete task/subtask (C)
      if (
        SHORTCUTS.completeTask &&
        matchesShortcut(event, SHORTCUTS.completeTask)
      ) {
        event.preventDefault();

        // Check if hovering a subtask first
        if (hoveredTask && hoveredSubtaskId && subtasks) {
          const subtask = subtasks.find((s) => s.id === hoveredSubtaskId);
          if (subtask) {
            updateSubtask.mutate({
              taskId: hoveredTask.id,
              subtaskId: hoveredSubtaskId,
              data: { completed: !subtask.completed },
            });
            toast({
              title: subtask.completed
                ? "Subtask uncompleted"
                : "Subtask completed",
              description: `"${subtask.title}"`,
            });
            return;
          }
        }

        // Complete the hovered task (toggle against its freshest state).
        if (hoveredTask) {
          const current = getFreshTask(hoveredTask);
          const isCompleted = !!current.completedAt;
          completeTask.mutate({
            id: current.id,
            completed: !isCompleted,
          });
          toast({
            title: isCompleted ? "Task uncompleted" : "Task completed",
            description: `"${current.title}"`,
          });
        }
        return;
      }

      // Priority (0–3) on the hovered task
      if (
        hoveredTask &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        ["0", "1", "2", "3"].includes(event.key)
      ) {
        event.preventDefault();
        updateTask.mutate({
          id: hoveredTask.id,
          data: { priority: `P${event.key}` as TaskPriority },
        });
        return;
      }

      // Delete task (Cmd + Delete/Backspace)
      if (
        SHORTCUTS.deleteTask &&
        matchesShortcut(event, SHORTCUTS.deleteTask)
      ) {
        if (hoveredTask) {
          event.preventDefault();
          deleteTask.mutate(hoveredTask.id);
        }
        return;
      }

      // Edit estimate (E)
      if (
        SHORTCUTS.editEstimate &&
        matchesShortcut(event, SHORTCUTS.editEstimate)
      ) {
        if (hoveredTask) {
          event.preventDefault();
          if (onEditEstimate) onEditEstimate(hoveredTask.id);
          // Cards open their own planned-time picker.
          else window.dispatchEvent(new CustomEvent(EDIT_ESTIMATE_EVENT, { detail: hoveredTask.id }));
        }
        return;
      }

      // Move to backlog (Z)
      if (
        SHORTCUTS.moveToBacklog &&
        matchesShortcut(event, SHORTCUTS.moveToBacklog)
      ) {
        if (hoveredTask && hoveredTask.scheduledDate) {
          event.preventDefault();
          updateTask.mutate(
            { id: hoveredTask.id, data: { scheduledDate: null } },
            {
              onSuccess: () => {
                toast({
                  title: "Moved to backlog",
                  description: `"${hoveredTask.title}"`,
                });
              },
            }
          );
        }
        return;
      }

      // Defer to tomorrow (D)
      if (
        SHORTCUTS.deferToTomorrow &&
        matchesShortcut(event, SHORTCUTS.deferToTomorrow)
      ) {
        if (hoveredTask) {
          event.preventDefault();
          const currentDate = hoveredTask.scheduledDate
            ? parseISO(hoveredTask.scheduledDate)
            : startOfDay(new Date());
          const tomorrow = addDays(currentDate, 1);
          const targetDate = format(tomorrow, "yyyy-MM-dd");
          updateTask.mutate(
            { id: hoveredTask.id, data: { scheduledDate: targetDate } },
            {
              onSuccess: () => {
                toast({
                  title: "Deferred to tomorrow",
                  description: `"${hoveredTask.title}" moved to ${format(tomorrow, "MMM d")}`,
                });
              },
            }
          );
        }
        return;
      }

      // Defer to next week (Shift + Z)
      if (
        SHORTCUTS.deferToNextWeek &&
        matchesShortcut(event, SHORTCUTS.deferToNextWeek)
      ) {
        if (hoveredTask) {
          event.preventDefault();
          // Use the task's scheduled date as reference, not today's date
          const referenceDate = hoveredTask.scheduledDate
            ? parseISO(hoveredTask.scheduledDate)
            : new Date();
          const nextMonday = addDays(
            startOfWeek(referenceDate, { weekStartsOn: 1 }),
            7
          );
          updateTask.mutate(
            {
              id: hoveredTask.id,
              data: { scheduledDate: format(nextMonday, "yyyy-MM-dd") },
            },
            {
              onSuccess: () => {
                toast({
                  title: "Deferred to next week",
                  description: `"${hoveredTask.title}" → ${format(nextMonday, "MMM d")}`,
                });
              },
            }
          );
        }
        return;
      }

      // Focus (F) - Go directly to focus mode
      if (SHORTCUTS.focus && matchesShortcut(event, SHORTCUTS.focus)) {
        if (hoveredTask) {
          event.preventDefault();
          navigate({
            to: "/app/focus/$taskId",
            params: { taskId: hoveredTask.id },
          });
        }
        return;
      }

      // Add to Calendar (X)
      if (
        SHORTCUTS.addToCalendar &&
        matchesShortcut(event, SHORTCUTS.addToCalendar)
      ) {
        if (hoveredTask) {
          event.preventDefault();
          const today = format(new Date(), "yyyy-MM-dd");
          const isToday = hoveredTask.scheduledDate === today || !hoveredTask.scheduledDate;
          let currentTime: string | undefined;
          if (isToday) {
            const now = new Date();
            currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          }
          autoSchedule.mutate({ taskId: hoveredTask.id, currentTime });
          toast({
            title: "Added to calendar",
            description: `"${hoveredTask.title}"`,
          });
        }
        return;
      }

      // Duplicate (Cmd + D)
      if (SHORTCUTS.duplicate && matchesShortcut(event, SHORTCUTS.duplicate)) {
        if (hoveredTask) {
          event.preventDefault();
          createTask.mutate({
            title: hoveredTask.title,
            priority: hoveredTask.priority,
            scheduledDate: hoveredTask.scheduledDate ?? undefined,
            estimatedMins: hoveredTask.estimatedMins ?? undefined,
            notes: hoveredTask.notes ?? undefined,
          });
          toast({
            title: "Task duplicated",
            description: `"${hoveredTask.title}"`,
          });
        }
        return;
      }

      // Hide subtasks (H) - toggle subtasks visibility
      if (
        SHORTCUTS.hideSubtasks &&
        matchesShortcut(event, SHORTCUTS.hideSubtasks)
      ) {
        if (hoveredTask && subtasks && subtasks.length > 0) {
          event.preventDefault();
          const newHiddenState = !hoveredTask.subtasksHidden;
          updateTask.mutate({
            id: hoveredTask.id,
            data: { subtasksHidden: newHiddenState },
          });
          toast({
            title: newHiddenState ? "Subtasks hidden" : "Subtasks shown",
            description: `"${hoveredTask.title}"`,
          });
        }
        return;
      }

      // Move to top (Alt + Shift + Up)
      if (SHORTCUTS.moveToTop && matchesShortcut(event, SHORTCUTS.moveToTop)) {
        if (hoveredTask && tasksInColumn) {
          event.preventDefault();
          const pendingTasks = tasksInColumn
            .filter((t) => !t.completedAt)
            .sort((a, b) => a.position - b.position);

          const firstTask = pendingTasks[0];
          if (
            pendingTasks.length > 1 &&
            firstTask &&
            firstTask.id !== hoveredTask.id
          ) {
            const taskIds = pendingTasks.map((t) => t.id);
            const currentIndex = taskIds.indexOf(hoveredTask.id);
            if (currentIndex > 0) {
              // Move to position 0
              taskIds.splice(currentIndex, 1);
              taskIds.unshift(hoveredTask.id);

              reorderTasks.mutate({
                date: hoveredTask.scheduledDate || "backlog",
                taskIds,
              });
              toast({
                title: "Moved to top",
                description: `"${hoveredTask.title}"`,
              });
            }
          }
        }
        return;
      }

      // Move to bottom (Alt + Shift + Down)
      if (
        SHORTCUTS.moveToBottom &&
        matchesShortcut(event, SHORTCUTS.moveToBottom)
      ) {
        if (hoveredTask && tasksInColumn) {
          event.preventDefault();
          const pendingTasks = tasksInColumn
            .filter((t) => !t.completedAt)
            .sort((a, b) => a.position - b.position);

          const lastTask = pendingTasks[pendingTasks.length - 1];
          if (
            pendingTasks.length > 1 &&
            lastTask &&
            lastTask.id !== hoveredTask.id
          ) {
            const taskIds = pendingTasks.map((t) => t.id);
            const currentIndex = taskIds.indexOf(hoveredTask.id);
            if (currentIndex < taskIds.length - 1) {
              // Move to end
              taskIds.splice(currentIndex, 1);
              taskIds.push(hoveredTask.id);

              reorderTasks.mutate({
                date: hoveredTask.scheduledDate || "backlog",
                taskIds,
              });
              toast({
                title: "Moved to bottom",
                description: `"${hoveredTask.title}"`,
              });
            }
          }
        }
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    hoveredTask,
    hoveredSubtaskId,
    subtasks,
    tasksInColumn,
    onNavigateToday,
    onNavigateNext,
    onNavigatePrevious,
    onEditEstimate,
    onSelect,
    completeTask,
    createTask,
    deleteTask,
    updateTask,
    updateSubtask,
    reorderTasks,
    autoSchedule,
    getFreshTask,
  ]);

  return null; // This component renders nothing
}
