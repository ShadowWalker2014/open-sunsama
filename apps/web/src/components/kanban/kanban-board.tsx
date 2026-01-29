import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import type { Task } from "@chronoflow/types";
import { useMoveTask, useReorderTasks } from "@/hooks/useTasks";
import { useKanbanDates } from "@/hooks/useKanbanDates";
import { DayColumn } from "./day-column";
import { TaskCard } from "./task-card";
import { TaskModal } from "./task-modal";
import { KanbanBoardToolbar, useSortPreference } from "./kanban-board-toolbar";
import { columnPriorityCollision } from "@/lib/dnd/collision-detection";

/**
 * Linear-style infinite horizontal kanban board with day columns.
 */
export function KanbanBoard() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  const [activeOverColumn, setActiveOverColumn] = React.useState<string | null>(null);
  const [sortBy, onSortChange] = useSortPreference();

  const moveTask = useMoveTask();
  const reorderTasks = useReorderTasks();

  // Use the kanban dates hook for date management and navigation
  const {
    dates,
    virtualizer,
    navigatePrevious,
    navigateNext,
    navigateToToday,
    handleScroll,
    firstVisibleDate,
    lastVisibleDate,
  } = useKanbanDates({ containerRef });

  // Drag and drop sensors
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
    })
  );

  // Find target column from over ID
  const findTargetColumnDate = React.useCallback(
    (overId: string | number | undefined): string | null => {
      if (!overId) return null;
      const overIdStr = String(overId);

      // Check if it's a column ID (day-YYYY-MM-DD)
      if (overIdStr.startsWith("day-")) {
        return overIdStr.replace("day-", "");
      }

      // Otherwise it's a task ID - return null (handled by sortable context)
      return null;
    },
    []
  );

  // Check if an ID is a task (not a column)
  const isTaskId = React.useCallback(
    (id: string | number | undefined): boolean => {
      if (!id) return false;
      const idStr = String(id);
      return !idStr.startsWith("day-");
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

      if (!task) return;

      // Check if dropped on a column
      const targetDate = findTargetColumnDate(over.id);

      if (targetDate) {
        // Moving to a different column
        if (task.scheduledDate !== targetDate) {
          moveTask.mutate({
            id: taskId,
            targetDate,
          });
        }
        return;
      }

      // Check if dropped on another task (reordering within same column)
      if (isTaskId(over.id)) {
        const overTask = over.data.current?.task as Task | undefined;
        if (overTask && task.scheduledDate === overTask.scheduledDate && task.id !== overTask.id) {
          // Get the sortable items from the active or over element's sortable context
          // dnd-kit stores items in the sortable data
          const sortableData = active.data.current?.sortable || over.data.current?.sortable;
          const columnTasks = sortableData?.items as string[] | undefined;
          
          if (columnTasks && task.scheduledDate) {
            const oldIndex = columnTasks.indexOf(task.id);
            const newIndex = columnTasks.indexOf(overTask.id);
            
            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
              // Reorder the task IDs
              const newTaskIds = arrayMove(columnTasks, oldIndex, newIndex);
              
              // Persist the new order via API with optimistic update
              reorderTasks.mutate({
                date: task.scheduledDate,
                taskIds: newTaskIds,
              });
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

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Toolbar */}
      <KanbanBoardToolbar
        firstVisibleDate={firstVisibleDate}
        lastVisibleDate={lastVisibleDate}
        onNavigatePrevious={navigatePrevious}
        onNavigateNext={navigateNext}
        onNavigateToday={navigateToToday}
        sortBy={sortBy}
        onSortChange={onSortChange}
      />

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={columnPriorityCollision}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div
          ref={containerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden"
          onScroll={handleScroll}
        >
          <div
            className="relative h-full"
            style={{
              width: `${virtualizer.getTotalSize()}px`,
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const dateInfo = dates[virtualItem.index];
              if (!dateInfo) return null;

              return (
                <div
                  key={dateInfo.dateString}
                  className="absolute left-0 top-0 h-full"
                  style={{
                    width: `${virtualItem.size}px`,
                    transform: `translateX(${virtualItem.start}px)`,
                  }}
                >
                  <DayColumn
                    date={dateInfo.date}
                    dateString={dateInfo.dateString}
                    onSelectTask={setSelectedTask}
                    isOver={activeOverColumn === dateInfo.dateString}
                    activeTaskId={activeTask?.id}
                    sortBy={sortBy}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Drag Overlay - follows cursor */}
        <DragOverlay modifiers={[snapCenterToCursor]} dropAnimation={null}>
          {activeTask && (
            <div className="w-[260px] pointer-events-none">
              <TaskCard task={activeTask} onSelect={() => {}} isDragging />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Task Detail Modal */}
      <TaskModal
        task={selectedTask}
        open={selectedTask !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null);
        }}
      />
    </div>
  );
}
