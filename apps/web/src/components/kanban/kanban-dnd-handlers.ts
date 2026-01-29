import type { Task } from "@open-sunsama/types";
import type {
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";

interface DndHandlersOptions {
  setActiveTask: (task: Task | null) => void;
  setOverId: (id: string | null) => void;
  moveTask: {
    mutateAsync: (params: { id: string; targetDate: string | null }) => Promise<unknown>;
  };
}

export function createDndHandlers(options: DndHandlersOptions) {
  const { setActiveTask, setOverId, moveTask } = options;

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = active.data.current?.task as Task | undefined;
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over?.id as string ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setOverId(null);

    if (!over || !active.data.current?.task) return;

    const task = active.data.current.task as Task;
    const overId = over.id as string;

    // Check if dropped on a day column
    if (overId.startsWith("day-")) {
      const targetDate = overId.replace("day-", "");
      
      // Only move if the date is different
      if (targetDate !== task.scheduledDate) {
        await moveTask.mutateAsync({
          id: task.id,
          targetDate,
        });
      }
    } else if (over.data.current?.type === "task") {
      // Dropped on another task - reorder within the same day
      const overTask = over.data.current.task as Task;
      
      if (task.scheduledDate === overTask.scheduledDate) {
        // Same day reorder - handled by SortableContext
        // We need to call reorder API here
        if (task.scheduledDate) {
          // Get all tasks for this day and reorder
          // This is simplified - in a real app you'd get the full list
        }
      } else {
        // Different day - move task
        await moveTask.mutateAsync({
          id: task.id,
          targetDate: overTask.scheduledDate,
        });
      }
    }
  };

  const handleDragCancel = () => {
    setActiveTask(null);
    setOverId(null);
  };

  return {
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
}
