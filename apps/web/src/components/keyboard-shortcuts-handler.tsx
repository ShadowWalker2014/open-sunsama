import * as React from "react";
import {
  SHORTCUTS,
  matchesShortcut,
  shouldIgnoreShortcut,
  useHoveredTask,
  useShortcutsModal,
} from "@/hooks/useKeyboardShortcuts";
import { useCompleteTask, useDeleteTask, useMoveTask, useReorderTasks, useTasks } from "@/hooks/useTasks";
import { useSubtasks, useUpdateSubtask } from "@/hooks/useSubtasks";
import { toast } from "@/hooks/use-toast";

interface KeyboardShortcutsHandlerProps {
  onAddTask: () => void;
  onNavigateToday: () => void;
  onNavigateNext: () => void;
  onNavigatePrevious: () => void;
  onEditEstimate?: (taskId: string) => void;
}

/**
 * Global keyboard shortcuts handler.
 * Renders nothing - just listens for keyboard events.
 */
export function KeyboardShortcutsHandler({
  onAddTask,
  onNavigateToday,
  onNavigateNext,
  onNavigatePrevious,
  onEditEstimate,
}: KeyboardShortcutsHandlerProps) {
  const { hoveredTask, hoveredSubtaskId } = useHoveredTask();
  const { setShowShortcutsModal } = useShortcutsModal();
  
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();
  const moveTask = useMoveTask();
  const updateSubtask = useUpdateSubtask();
  
  // Fetch tasks for the hovered task's date to enable move to top/bottom
  const { data: tasksInColumn } = useTasks(
    hoveredTask?.scheduledDate 
      ? { scheduledDate: hoveredTask.scheduledDate }
      : hoveredTask && !hoveredTask.scheduledDate
      ? { backlog: true }
      : undefined
  );
  
  // Fetch subtasks for the hovered task
  const { data: subtasks } = useSubtasks(hoveredTask?.id ?? "");
  
  const reorderTasks = useReorderTasks();

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Ignore if typing in input
      if (shouldIgnoreShortcut(event)) return;

      // Show shortcuts modal (Shift + ?)
      if (SHORTCUTS.showShortcuts && matchesShortcut(event, SHORTCUTS.showShortcuts)) {
        event.preventDefault();
        setShowShortcutsModal(true);
        return;
      }

      // Add task (A)
      if (SHORTCUTS.addTask && matchesShortcut(event, SHORTCUTS.addTask)) {
        event.preventDefault();
        onAddTask();
        return;
      }

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

      // Move to top (Cmd + Shift + Up)
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

      // Move to bottom (Cmd + Shift + Down)
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
    onAddTask,
    onNavigateToday,
    onNavigateNext,
    onNavigatePrevious,
    onEditEstimate,
    setShowShortcutsModal,
    completeTask,
    deleteTask,
    moveTask,
    updateSubtask,
    reorderTasks,
  ]);

  return null; // This component renders nothing
}
