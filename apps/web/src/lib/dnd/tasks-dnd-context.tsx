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

      // Check if dropped on a task (within-column reordering)
      if (isTaskId(over.id)) {
        const overTask = over.data.current?.task as Task | undefined;

        if (overTask) {
          // Check if same column
          const isBacklogTask = task.scheduledDate === null;
          const isOverBacklog = overTask.scheduledDate === null;

          const sameColumn =
            isBacklogTask === isOverBacklog &&
            (!isBacklogTask
              ? task.scheduledDate === overTask.scheduledDate
              : true);

          if (sameColumn && taskId !== overId) {
            // Get all tasks in this column from the cache
            const queryKey = isBacklogTask
              ? taskKeys.list({ backlog: true })
              : taskKeys.list({
                  scheduledDate: task.scheduledDate ?? undefined,
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

              if (activeIndex !== -1 && overIndex !== -1) {
                // Reorder using arrayMove
                const reorderedTasks = arrayMove(
                  sortedTasks,
                  activeIndex,
                  overIndex
                );
                const reorderedIds = reorderedTasks.map((t) => t.id);

                // Call reorder API
                const dateParam = isBacklogTask
                  ? "backlog"
                  : (task.scheduledDate ?? "backlog");
                reorderTasks.mutate({
                  date: dateParam,
                  taskIds: reorderedIds,
                });
              }
            }
          }
        }
        return;
      }

      // Dropped on a column or backlog
      const targetDate = findTargetColumnDate(over.id);

      if (!targetDate) return;

      const isBacklogDrop = targetDate === "backlog";
      const isBacklogTask = task.scheduledDate === null;

      // Check if column changed
      const columnChanged =
        isBacklogDrop !== isBacklogTask || targetDate !== task.scheduledDate;

      if (!columnChanged) {
        // Same column drop on column droppable - no action needed
        return;
      }

      // Column changed - update task's scheduledDate
      if (isBacklogDrop) {
        // Moving to backlog
        moveTask.mutate({
          id: taskId,
          targetDate: null, // null = unscheduled/backlog
        });
      } else {
        // Moving to a specific date
        moveTask.mutate({
          id: taskId,
          targetDate,
        });
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
