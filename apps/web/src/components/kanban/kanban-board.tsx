import * as React from "react";
import {
  addDays,
  subDays,
  startOfDay,
  isToday,
  format,
} from "date-fns";
import { useVirtualizer } from "@tanstack/react-virtual";
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
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import type { Task } from "@chronoflow/types";
import { useMoveTask, useReorderTasks } from "@/hooks/useTasks";
import { DayColumn } from "./day-column";
import { TaskCard } from "./task-card";
import { TaskModal } from "./task-modal";
import { KanbanBoardToolbar, useSortPreference } from "./kanban-board-toolbar";
import { columnPriorityCollision } from "@/lib/dnd/collision-detection";

// Number of days to show at a time
const VISIBLE_DAYS = 7;
// Number of days to load on each side (for smooth scrolling)
const BUFFER_DAYS = 14;
// Column width in pixels
const COLUMN_WIDTH = 280;

/**
 * Linear-style infinite horizontal kanban board with day columns.
 */
export function KanbanBoard() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [centerDate, setCenterDate] = React.useState(() => startOfDay(new Date()));
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  const [activeOverColumn, setActiveOverColumn] = React.useState<string | null>(null);
  const [sortBy, onSortChange] = useSortPreference();

  const moveTask = useMoveTask();
  const reorderTasks = useReorderTasks();

  // Generate array of dates for the viewport
  const dates = React.useMemo(() => {
    const result: { date: Date; dateString: string }[] = [];
    const startDate = subDays(centerDate, BUFFER_DAYS);
    const totalDays = VISIBLE_DAYS + BUFFER_DAYS * 2;

    for (let i = 0; i < totalDays; i++) {
      const date = addDays(startDate, i);
      result.push({
        date,
        dateString: format(date, "yyyy-MM-dd"),
      });
    }
    return result;
  }, [centerDate]);

  // Setup virtualizer for horizontal scrolling
  const virtualizer = useVirtualizer({
    count: dates.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => COLUMN_WIDTH,
    horizontal: true,
    overscan: 3,
  });

  // Scroll to today on mount - align to left edge
  React.useEffect(() => {
    const todayIndex = dates.findIndex((d) => isToday(d.date));
    if (todayIndex >= 0) {
      virtualizer.scrollToIndex(todayIndex, { align: "start" });
    }
  }, []);

  // Handle navigation
  const navigatePrevious = () => {
    const scrollOffset = virtualizer.scrollOffset ?? 0;
    const targetOffset = Math.max(0, scrollOffset - COLUMN_WIDTH * VISIBLE_DAYS);
    containerRef.current?.scrollTo({
      left: targetOffset,
      behavior: "smooth",
    });
  };

  const navigateNext = () => {
    const scrollOffset = virtualizer.scrollOffset ?? 0;
    const targetOffset = scrollOffset + COLUMN_WIDTH * VISIBLE_DAYS;
    containerRef.current?.scrollTo({
      left: targetOffset,
      behavior: "smooth",
    });
  };

  const navigateToToday = () => {
    const todayIndex = dates.findIndex((d) => isToday(d.date));
    if (todayIndex >= 0) {
      virtualizer.scrollToIndex(todayIndex, { align: "start", behavior: "smooth" });
    }
  };

  // Load more days when scrolling near edges
  const handleScroll = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const scrollRight = scrollWidth - scrollLeft - clientWidth;

    if (scrollLeft < COLUMN_WIDTH * 3) {
      setCenterDate((prev) => subDays(prev, 7));
    }

    if (scrollRight < COLUMN_WIDTH * 3) {
      setCenterDate((prev) => addDays(prev, 7));
    }
  }, []);

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
  const isTaskId = React.useCallback((id: string | number | undefined): boolean => {
    if (!id) return false;
    const idStr = String(id);
    return !idStr.startsWith("day-");
  }, []);

  // DnD Event Handlers
  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    const { active } = event;
    const task = active.data.current?.task as Task | undefined;
    if (task) {
      setActiveTask(task);
      setActiveOverColumn(task.scheduledDate || null);
    }
  }, []);

  const handleDragOver = React.useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setActiveOverColumn(null);
      return;
    }
    const targetDate = findTargetColumnDate(over.id);
    setActiveOverColumn(targetDate);
  }, [findTargetColumnDate]);

  const handleDragEnd = React.useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveTask(null);
    setActiveOverColumn(null);

    if (!over) return;

    const taskId = String(active.id);
    const overId = String(over.id);
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
      if (overTask && task.scheduledDate === overTask.scheduledDate) {
        // Reordering within the same column
        // The actual reorder is handled by the sortable context
        // We just need to persist the new order
        // For now, rely on optimistic updates from sortable context
        // The API call will be made by the useTasks hook when needed
      }
    }
  }, [findTargetColumnDate, isTaskId, moveTask]);

  const handleDragCancel = React.useCallback(() => {
    setActiveTask(null);
    setActiveOverColumn(null);
  }, []);

  // Calculate visible date range for header
  const visibleItems = virtualizer.getVirtualItems();
  const firstVisibleItem = visibleItems[0];
  const lastVisibleItem = visibleItems[visibleItems.length - 1];
  const firstVisibleDate = firstVisibleItem
    ? dates[firstVisibleItem.index]?.date ?? null
    : null;
  const lastVisibleDate = lastVisibleItem
    ? dates[lastVisibleItem.index]?.date ?? null
    : null;

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
        <DragOverlay
          modifiers={[snapCenterToCursor]}
          dropAnimation={null}
        >
          {activeTask && (
            <div className="w-[260px] pointer-events-none">
              <TaskCard
                task={activeTask}
                onSelect={() => {}}
                isDragging
              />
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
