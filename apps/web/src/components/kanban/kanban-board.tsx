import * as React from "react";
import {
  format,
  addDays,
  subDays,
  startOfDay,
  isToday,
} from "date-fns";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import type { Task } from "@chronoflow/types";
import { useMoveTask } from "@/hooks/useTasks";
import { Button } from "@/components/ui";
import { DayColumn } from "./day-column";
import { TaskCard } from "./task-card";
import { TaskDetailPanel } from "./task-detail-panel";

// Number of days to show at a time
const VISIBLE_DAYS = 7;
// Number of days to load on each side (for smooth scrolling)
const BUFFER_DAYS = 14;
// Column width in pixels
const COLUMN_WIDTH = 280;

/**
 * Infinite horizontal kanban board with day columns.
 * Features virtualization for performance and drag-and-drop for task management.
 */
export function KanbanBoard() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [centerDate, setCenterDate] = React.useState(() => startOfDay(new Date()));
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);

  const moveTask = useMoveTask();

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

  // Scroll to today on mount
  React.useEffect(() => {
    const todayIndex = dates.findIndex((d) => isToday(d.date));
    if (todayIndex >= 0) {
      virtualizer.scrollToIndex(todayIndex, { align: "center" });
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
      virtualizer.scrollToIndex(todayIndex, { align: "center", behavior: "smooth" });
    }
  };

  // Load more days when scrolling near edges
  const handleScroll = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const scrollRight = scrollWidth - scrollLeft - clientWidth;

    // If we're near the start, shift the center date back
    if (scrollLeft < COLUMN_WIDTH * 3) {
      setCenterDate((prev) => subDays(prev, 7));
    }

    // If we're near the end, shift the center date forward
    if (scrollRight < COLUMN_WIDTH * 3) {
      setCenterDate((prev) => addDays(prev, 7));
    }
  }, []);

  // Drag and drop sensors with touch support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms press delay for touch
        tolerance: 8, // 8px movement tolerance during delay
      },
    })
  );

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

  // Calculate visible date range for header
  const visibleItems = virtualizer.getVirtualItems();
  const firstVisibleItem = visibleItems[0];
  const lastVisibleItem = visibleItems[visibleItems.length - 1];
  const firstVisibleDate = firstVisibleItem !== undefined
    ? dates[firstVisibleItem.index]?.date ?? null
    : null;
  const lastVisibleDate = lastVisibleItem !== undefined
    ? dates[lastVisibleItem.index]?.date ?? null
    : null;

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Navigation Arrows */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={navigatePrevious}
              title="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={navigateToToday}>
              <CalendarDays className="mr-2 h-4 w-4" />
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={navigateNext}
              title="Next week"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Current Date Range */}
          {firstVisibleDate && lastVisibleDate && (
            <h2 className="text-lg font-semibold">
              {format(firstVisibleDate, "MMM d")} -{" "}
              {format(lastVisibleDate, "MMM d, yyyy")}
            </h2>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
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
                    isOver={overId === `day-${dateInfo.dateString}`}
                    activeTaskId={activeTask?.id}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTask && (
            <div className="w-[260px] opacity-90">
              <TaskCard
                task={activeTask}
                onSelect={() => {}}
                isDragging
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Task Detail Panel */}
      <TaskDetailPanel
        task={selectedTask}
        open={selectedTask !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null);
        }}
      />
    </div>
  );
}
