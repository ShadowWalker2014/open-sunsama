import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import type { Task } from "@open-sunsama/types";
import { useMoveTask, useReorderTasks } from "@/hooks/useTasks";
import { TaskCard } from "@/components/kanban/task-card";
import { taskPriorityCollision } from "./collision-detection";

interface TasksDndContextValue {
  activeTask: Task | null;
  activeOverColumn: string | null;
  isDragging: boolean;
}

const TasksDndContext = React.createContext<TasksDndContextValue | null>(null);

export function useTasksDnd() {
  const context = React.useContext(TasksDndContext);
  if (!context) {
    throw new Error("useTasksDnd must be used within a TasksDndProvider");
  }
  return context;
}

interface TasksDndProviderProps {
  children: React.ReactNode;
}

/**
 * Shared DnD context for tasks that enables:
 * - Dragging tasks between kanban day columns
 * - Reordering tasks within columns
 * - Dragging backlog tasks to schedule them
 * - Reordering tasks within the backlog
 */
export function TasksDndProvider({ children }: TasksDndProviderProps) {
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  const [activeOverColumn, setActiveOverColumn] = React.useState<string | null>(null);

  const moveTask = useMoveTask();
  const reorderTasks = useReorderTasks();

  // Drag and drop sensors with keyboard support for accessibility
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Find target column from over ID
  const findTargetColumnDate = React.useCallback(
    (overId: string | number | undefined): string | null | "backlog" => {
      if (!overId) return null;
      const overIdStr = String(overId);

      // Check if it's the backlog drop target
      if (overIdStr === "backlog") {
        return "backlog";
      }

      // Check if it's a column ID (day-YYYY-MM-DD)
      if (overIdStr.startsWith("day-")) {
        return overIdStr.replace("day-", "");
      }

      // Otherwise it's a task ID - return null (handled by sortable context)
      return null;
    },
    []
  );

  // Check if an ID is a task (not a column or backlog)
  const isTaskId = React.useCallback(
    (id: string | number | undefined): boolean => {
      if (!id) return false;
      const idStr = String(id);
      return !idStr.startsWith("day-") && idStr !== "backlog";
    },
    []
  );

  // DnD Event Handlers
  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    const { active } = event;
    const task = active.data.current?.task as Task | undefined;
    if (task) {
      setActiveTask(task);
      setActiveOverColumn(task.scheduledDate || null);
    }
  }, []);

  const handleDragOver = React.useCallback(
    (event: DragOverEvent) => {
      const { over } = event;
      if (!over) {
        setActiveOverColumn(null);
        return;
      }
      const targetDate = findTargetColumnDate(over.id);
      setActiveOverColumn(targetDate);
    },
    [findTargetColumnDate]
  );

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveTask(null);
      setActiveOverColumn(null);

      if (!over) return;

      const taskId = String(active.id);
      const task = active.data.current?.task as Task | undefined;
      const sourceContainer = active.data.current?.source as string | undefined;

      if (!task) return;

      // Check if dropped on a column (not a task)
      const targetDate = findTargetColumnDate(over.id);

      if (targetDate) {
        // Handle backlog - unschedule the task
        if (targetDate === "backlog") {
          // Only unschedule if task is currently scheduled
          if (task.scheduledDate !== null) {
            moveTask.mutate({
              id: taskId,
              targetDate: null, // null = unscheduled
            });
          }
          return;
        }

        // Moving to a different column/date
        if (task.scheduledDate !== targetDate) {
          moveTask.mutate({
            id: taskId,
            targetDate,
          });
        }
        return;
      }

      // Check if dropped on another task (reordering within same container)
      if (isTaskId(over.id)) {
        const overTask = over.data.current?.task as Task | undefined;
        const overSource = over.data.current?.source as string | undefined;

        if (!overTask) return;

        // If dropped on a task in a different column, move to that column
        if (task.scheduledDate !== overTask.scheduledDate) {
          moveTask.mutate({
            id: taskId,
            targetDate: overTask.scheduledDate,
          });
          return;
        }

        // Both tasks are in the backlog (no scheduledDate)
        const isBacklogReorder =
          sourceContainer === "backlog" && overSource === "backlog";

        // Reordering within the same column or backlog
        if (task.id !== overTask.id) {
          // Get the sortable items from the active element's sortable context
          const sortableData = active.data.current?.sortable;
          const containerTasks = sortableData?.items as string[] | undefined;

          if (containerTasks) {
            const oldIndex = containerTasks.indexOf(task.id);
            const newIndex = containerTasks.indexOf(overTask.id);

            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
              // Reorder the task IDs using arrayMove for correct ordering
              const newTaskIds = arrayMove(containerTasks, oldIndex, newIndex);

              // Determine the date parameter for reorder API
              // For backlog tasks, use "backlog" as the date
              const reorderDate = isBacklogReorder
                ? "backlog"
                : task.scheduledDate;

              if (reorderDate) {
                // Persist the new order via API with optimistic update
                reorderTasks.mutate({
                  date: reorderDate,
                  taskIds: newTaskIds,
                });
              }
            }
          }
        }
      }
    },
    [findTargetColumnDate, isTaskId, moveTask, reorderTasks]
  );

  const handleDragCancel = React.useCallback(() => {
    setActiveTask(null);
    setActiveOverColumn(null);
  }, []);

  const contextValue = React.useMemo(
    () => ({ activeTask, activeOverColumn, isDragging: !!activeTask }),
    [activeTask, activeOverColumn]
  );

  return (
    <TasksDndContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={taskPriorityCollision}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {children}

        {/* Drag Overlay - follows cursor with fixed width matching column */}
        <DragOverlay modifiers={[snapCenterToCursor]} dropAnimation={null}>
          {activeTask && (
            <div className="w-[264px] pointer-events-none">
              <TaskCard task={activeTask} onSelect={() => {}} isDragging />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </TasksDndContext.Provider>
  );
}
