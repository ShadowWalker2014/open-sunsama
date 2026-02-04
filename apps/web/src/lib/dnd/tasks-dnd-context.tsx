import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  closestCenter,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import type { Task } from "@open-sunsama/types";
import { useMoveTask, useReorderTasks, taskKeys } from "@/hooks/useTasks";
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
  const queryClient = useQueryClient();
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  const [activeOverColumn, setActiveOverColumn] = React.useState<string | null>(
    null
  );

  const moveTask = useMoveTask();
  const reorderTasks = useReorderTasks();

  // Drag and drop sensors with keyboard support for accessibility
  // Using delay + distance to ensure clicks register before drag starts
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
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
        return overIdStr.replace("day-", "") || null;
      }

      // Otherwise it's a task ID - return null (handled separately)
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
      setActiveOverColumn(targetDate === "backlog" ? null : targetDate);
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

      if (!task) return;

      const overId = String(over.id);

      // Get source column from drag data
      // The columnId must be set in useSortable data for both task cards and backlog tasks
      const sourceColumn = String(
        active.data.current?.columnId || task.scheduledDate || "backlog"
      );

      // Determine destination column
      let destinationColumn: string;
      let overTask: Task | undefined;

      // Check if dropped on a task or a column
      if (isTaskId(over.id)) {
        // Dropped on another task
        overTask = over.data.current?.task as Task | undefined;
        destinationColumn = String(
          over.data.current?.columnId ?? overTask?.scheduledDate ?? "backlog"
        );
      } else {
        // Dropped on a column or backlog - extract from ID
        const targetDate = findTargetColumnDate(over.id);
        if (!targetDate) return;
        destinationColumn =
          targetDate === "backlog" ? "backlog" : String(targetDate);
      }

      // Check if columns changed
      const columnChanged = sourceColumn !== destinationColumn;
      const isSameTask = taskId === overId;

      // OPTIMIZATION: Do nothing if dropped on self in the same column
      if (isSameTask && !columnChanged) {
        return;
      }

      // When columns change, we need to move the task to the new column
      if (columnChanged) {
        const targetDate =
          destinationColumn === "backlog" ? null : destinationColumn;

        // Move the task to the new column
        moveTask.mutate({
          id: taskId,
          targetDate,
        });

        // If dropped on a specific task in the destination column,
        // we should reorder the task to the correct position after the move
        // This requires fetching the tasks after the move and reordering
        // For now, we just accept that the task will be at the end until the user reorders
        return;
      }

      // Same column but different position - reorder within column
      if (!columnChanged && overTask && !isSameTask) {
        // Get all tasks in this column from the cache
        const isBacklog = sourceColumn === "backlog";
        const queryKey = isBacklog
          ? taskKeys.list({ backlog: true })
          : taskKeys.list({
              scheduledDate: sourceColumn,
            });

        const columnTasks = queryClient.getQueryData<Task[]>(queryKey);

        if (columnTasks) {
          // Sort by position to get current order
          const sortedTasks = [...columnTasks].sort(
            (a, b) => (a.position ?? 0) - (b.position ?? 0)
          );

          // Find indices of active and over tasks
          const activeIndex = sortedTasks.findIndex((t) => t.id === taskId);
          const overIndex = sortedTasks.findIndex((t) => t.id === overId);

          if (
            activeIndex !== -1 &&
            overIndex !== -1 &&
            activeIndex !== overIndex
          ) {
            // Reorder using arrayMove
            const reorderedTasks = arrayMove(
              sortedTasks,
              activeIndex,
              overIndex
            );
            const reorderedIds = reorderedTasks.map((t) => t.id);

            // Call reorder API
            const dateParam = isBacklog ? "backlog" : sourceColumn;
            reorderTasks.mutate({
              date: dateParam,
              taskIds: reorderedIds,
            });
          }
        }
      }
    },
    [findTargetColumnDate, moveTask, reorderTasks, isTaskId, queryClient]
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
