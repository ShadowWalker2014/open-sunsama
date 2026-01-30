import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  SHORTCUTS,
  matchesShortcut,
  shouldIgnoreShortcut,
  useHoveredTask,
} from "@/hooks/useKeyboardShortcuts";
import { useCompleteTask, useCreateTask, useDeleteTask, useMoveTask, useReorderTasks, useTasks, useUpdateTask } from "@/hooks/useTasks";
import { useSubtasks, useUpdateSubtask } from "@/hooks/useSubtasks";
import { useAutoSchedule } from "@/hooks";
import { toast } from "@/hooks/use-toast";
import { addDays, startOfWeek, format } from "date-fns";
import type { Task } from "@open-sunsama/types";

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
  const { hoveredTask, hoveredSubtaskId } = useHoveredTask();
  
  const completeTask = useCompleteTask();
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();
  const moveTask = useMoveTask();
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
      if (SHORTCUTS.focusToday && matchesShortcut(event, SHORTCUTS.focusToday)) {
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
      if (SHORTCUTS.previousDay && matchesShortcut(event, SHORTCUTS.previousDay)) {
        event.preventDefault();
        onNavigatePrevious();
        return;
      }

      // === Task-specific shortcuts (require hovering) ===
      
      // Complete task/subtask (C)
      if (SHORTCUTS.completeTask && matchesShortcut(event, SHORTCUTS.completeTask)) {
        event.preventDefault();
        
        // Check if hovering a subtask first
        if (hoveredTask && hoveredSubtaskId && subtasks) {
          const subtask = subtasks.find(s => s.id === hoveredSubtaskId);
          if (subtask) {
            updateSubtask.mutate({
              taskId: hoveredTask.id,
              subtaskId: hoveredSubtaskId,
              data: { completed: !subtask.completed },
            });
            toast({
              title: subtask.completed ? "Subtask uncompleted" : "Subtask completed",
              description: `"${subtask.title}"`,
            });
            return;
          }
        }
        
        // Complete the hovered task
        if (hoveredTask) {
          const isCompleted = !!hoveredTask.completedAt;
          completeTask.mutate({
            id: hoveredTask.id,
            completed: !isCompleted,
          });
          toast({
            title: isCompleted ? "Task uncompleted" : "Task completed",
            description: `"${hoveredTask.title}"`,
          });
        }
        return;
      }

      // Delete task (Cmd + Delete/Backspace)
      if (SHORTCUTS.deleteTask && matchesShortcut(event, SHORTCUTS.deleteTask)) {
        if (hoveredTask) {
          event.preventDefault();
          if (confirm(`Delete "${hoveredTask.title}"?`)) {
            deleteTask.mutate(hoveredTask.id);
          }
        }
        return;
      }

      // Edit estimate (E)
      if (SHORTCUTS.editEstimate && matchesShortcut(event, SHORTCUTS.editEstimate)) {
        if (hoveredTask && onEditEstimate) {
          event.preventDefault();
          onEditEstimate(hoveredTask.id);
        }
        return;
      }

      // Move to backlog (Z)
      if (SHORTCUTS.moveToBacklog && matchesShortcut(event, SHORTCUTS.moveToBacklog)) {
        if (hoveredTask && hoveredTask.scheduledDate) {
          event.preventDefault();
          moveTask.mutate({
            id: hoveredTask.id,
            targetDate: null,
          });
          toast({
            title: "Moved to backlog",
            description: `"${hoveredTask.title}"`,
          });
        }
        return;
      }

      // Defer to next week (Shift + Z)
      if (SHORTCUTS.deferToNextWeek && matchesShortcut(event, SHORTCUTS.deferToNextWeek)) {
        if (hoveredTask) {
          event.preventDefault();
          const nextMonday = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 7);
          moveTask.mutate({
            id: hoveredTask.id,
            targetDate: format(nextMonday, "yyyy-MM-dd"),
          });
          toast({
            title: "Deferred to next week",
            description: `"${hoveredTask.title}"`,
          });
        }
        return;
      }

      // Focus (F) - Go directly to focus mode
      if (SHORTCUTS.focus && matchesShortcut(event, SHORTCUTS.focus)) {
        if (hoveredTask) {
          event.preventDefault();
          navigate({ to: "/app/focus/$taskId", params: { taskId: hoveredTask.id } });
        }
        return;
      }

      // Add to Calendar (X)
      if (SHORTCUTS.addToCalendar && matchesShortcut(event, SHORTCUTS.addToCalendar)) {
        if (hoveredTask) {
          event.preventDefault();
          autoSchedule.mutate({ taskId: hoveredTask.id });
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
      if (SHORTCUTS.hideSubtasks && matchesShortcut(event, SHORTCUTS.hideSubtasks)) {
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
            .filter(t => !t.completedAt)
            .sort((a, b) => a.position - b.position);
          
          const firstTask = pendingTasks[0];
          if (pendingTasks.length > 1 && firstTask && firstTask.id !== hoveredTask.id) {
            const taskIds = pendingTasks.map(t => t.id);
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
      if (SHORTCUTS.moveToBottom && matchesShortcut(event, SHORTCUTS.moveToBottom)) {
        if (hoveredTask && tasksInColumn) {
          event.preventDefault();
          const pendingTasks = tasksInColumn
            .filter(t => !t.completedAt)
            .sort((a, b) => a.position - b.position);
          
          const lastTask = pendingTasks[pendingTasks.length - 1];
          if (pendingTasks.length > 1 && lastTask && lastTask.id !== hoveredTask.id) {
            const taskIds = pendingTasks.map(t => t.id);
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
    moveTask,
    updateTask,
    updateSubtask,
    reorderTasks,
    autoSchedule,
  ]);

  return null; // This component renders nothing
}
