import * as React from "react";
import { format, addDays, subDays, isToday } from "date-fns";
import { Inbox, Menu, Plus } from "lucide-react";
import { useSearch } from "@tanstack/react-router";
import type { Task } from "@open-sunsama/types";
import {
  DndContext,
  closestCenter,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { cn, formatDuration } from "@/lib/utils";
import { ViewSearch } from "@/components/ui";
import {
  parseSortOption,
  type SortOption,
} from "@/components/kanban/kanban-board-toolbar";
import {
  MobileViewControls,
  type MobileTasksViewMode,
} from "./mobile-view-controls";
import { useTasks, useReorderTasks } from "@/hooks/useTasks";
import { MobileTaskCardWithActualTime } from "./mobile-task-card";
import { SortableMobileTaskCard } from "./sortable-mobile-task-card";
import { TaskModal } from "@/components/kanban/task-modal.lazy";
import { MobileDateHeader } from "./mobile-date-header";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

/** P0 first — matches the desktop day column's ordering. */
const PRIORITY_RANK: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

interface MobileTaskListViewProps {
  /** The day on screen; owned by the parent so list and board stay in sync. */
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  className?: string;
  /** List/board switch + sort order, rendered in the header when provided. */
  viewMode?: MobileTasksViewMode;
  onViewModeChange?: (mode: MobileTasksViewMode) => void;
  sortBy?: SortOption;
  onSortChange?: (sort: SortOption) => void;
}

/**
 * Mobile-optimized task list view matching Sunsama mobile design.
 * Features sticky header, progress bar, and scrollable task list.
 */
export function MobileTaskListView({
  selectedDate: currentDate,
  onSelectDate,
  className,
  viewMode,
  onViewModeChange,
  sortBy = "position",
  onSortChange,
}: MobileTaskListViewProps) {
  // Open the backlog sheet when arriving via `/app/tasks?backlog=1`
  // (mobile "More → Backlog"). Initialize the open state straight from the
  // param — clearing the param via navigate would remount this view and
  // reset the state, so we just leave it.
  const { backlog } = useSearch({ strict: false }) as { backlog?: string };

  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(!!backlog);
  const dateString = format(currentDate, "yyyy-MM-dd");

  // Which way the day list slides in: forward days enter from the right.
  const previousDate = React.useRef(currentDate);
  const slideFrom =
    currentDate > previousDate.current ? "right" : currentDate < previousDate.current ? "left" : null;
  React.useEffect(() => {
    previousDate.current = currentDate;
  }, [currentDate]);

  const goToNextDay = () => onSelectDate(addDays(currentDate, 1));
  const goToPreviousDay = () => onSelectDate(subDays(currentDate, 1));
  
  // Swipe gesture handling
  const touchStartX = React.useRef<number | null>(null);
  const touchStartY = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touch = e.changedTouches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    // Only trigger if horizontal swipe is dominant (not vertical scroll)
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX > 0) {
        goToPreviousDay(); // Swipe right = previous day
      } else {
        goToNextDay(); // Swipe left = next day
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };
  
  // Fetch tasks for the current date
  // Same cache key as the board's DayColumn and the week strip's dots.
  const { data: tasks, isLoading } = useTasks({ scheduledDate: dateString, limit: 200 });

  // Same in-view card search as the desktop board toolbar.
  const [searchQuery, setSearchQuery] = React.useState("");
  
  // DnD setup for reordering
  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  );
  
  const reorderTasks = useReorderTasks();
  
  // Separate pending and completed tasks
  const { pendingTasks, completedTasks } = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const all = (tasks ?? []).filter((task) => {
      if (!query) return true;
      const notes = task.notes?.replace(/<[^>]*>/g, " ") ?? "";
      return (
        task.title.toLowerCase().includes(query) ||
        notes.toLowerCase().includes(query)
      );
    });
    // Same sort options as the desktop board; "Manual" keeps drag order.
    const { field, direction } = parseSortOption(sortBy);
    const pending = all
      .filter((task) => !task.completedAt)
      .sort((a, b) => {
        if (field === "priority") {
          const rank = (t: typeof a) => PRIORITY_RANK[t.priority] ?? 2;
          const diff =
            direction === "desc" ? rank(a) - rank(b) : rank(b) - rank(a);
          if (diff !== 0) return diff;
          return a.position - b.position;
        }
        if (field === "createdAt") {
          const diff =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          return direction === "desc" ? -diff : diff;
        }
        return a.position - b.position;
      });
    const completed = all.filter((task) => task.completedAt);
    return { pendingTasks: pending, completedTasks: completed };
  }, [tasks, searchQuery, sortBy]);
  
  // Calculate progress statistics
  const stats = React.useMemo(() => {
    const allTasks = tasks ?? [];
    
    // Total estimated time
    const totalEstimatedMins = allTasks.reduce(
      (sum, task) => sum + (task.estimatedMins ?? 0),
      0
    );
    
    // Completed estimated time
    const completedEstimatedMins = allTasks
      .filter((task) => task.completedAt)
      .reduce((sum, task) => sum + (task.estimatedMins ?? 0), 0);
    
    // Calculate progress percentage
    const progressPercent = totalEstimatedMins > 0
      ? Math.min((completedEstimatedMins / totalEstimatedMins) * 100, 100)
      : 0;
    
    return {
      totalEstimatedMins,
      completedEstimatedMins,
      progressPercent,
      taskCount: allTasks.length,
      completedCount: completedTasks.length,
    };
  }, [tasks, completedTasks]);
  
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };
  
  const handleAddTask = () => {
    setIsAddModalOpen(true);
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    if (sortBy !== "position") return; // reordering only means something in manual order
    const oldIndex = pendingTasks.findIndex((t) => t.id === active.id);
    const newIndex = pendingTasks.findIndex((t) => t.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(pendingTasks, oldIndex, newIndex);
      
      reorderTasks.mutate({
        date: dateString,
        taskIds: newOrder.map((t) => t.id),
      });
    }
  };
  
  
  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      <MobileDateHeader
        selectedDate={currentDate}
        onSelectDate={onSelectDate}
        hideStrip={!!searchQuery}
        leading={
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <button
                className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors active:bg-muted/50"
                aria-label="Open backlog"
              >
                <Menu className="h-5 w-5 text-muted-foreground" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <MobileBacklogSidebar />
            </SheetContent>
          </Sheet>
        }
        trailing={
          <>
            <ViewSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search tasks…"
            />
            {!searchQuery && viewMode && onViewModeChange && onSortChange && (
              <MobileViewControls
                viewMode={viewMode}
                onViewModeChange={onViewModeChange}
                sortBy={sortBy}
                onSortChange={onSortChange}
              />
            )}
          </>
        }
      >
        {/* Day progress: planned time completed so far */}
        <div className="h-[3px] bg-muted/40">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${stats.progressPercent}%` }}
          />
        </div>
      </MobileDateHeader>

      {/* Scrollable task list */}
      <main
        key={dateString}
        className={cn(
          "pb-under-fab flex-1 overflow-y-auto transition-opacity duration-200",
          slideFrom === "right" && "animate-[day-in-right_240ms_cubic-bezier(0.32,0.72,0,1)]",
          slideFrom === "left" && "animate-[day-in-left_240ms_cubic-bezier(0.32,0.72,0,1)]"
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {isLoading ? (
          // Loading skeleton
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-5 h-5 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : pendingTasks.length === 0 && completedTasks.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h2 className="text-lg font-medium text-muted-foreground mb-1">
              {isToday(currentDate)
                ? "No tasks for today"
                : `No tasks for ${format(currentDate, "EEEE, MMM d")}`}
            </h2>
            <p className="text-sm text-muted-foreground/70">
              Tap the + button to add your first task
            </p>
          </div>
        ) : (
          <>
            {/* Pending tasks with drag-and-drop reordering */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={pendingTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {pendingTasks.map((task) => (
                  <SortableMobileTaskCard
                    key={task.id}
                    task={task}
                    onTaskClick={handleTaskClick}
                  />
                ))}
              </SortableContext>
            </DndContext>
            
            {/* Completed tasks section */}
            {completedTasks.length > 0 && (
              <div className="pt-2">
                <div className="px-4 py-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Completed ({completedTasks.length})
                  </p>
                </div>
                {completedTasks.map((task) => (
                  <MobileTaskCardWithActualTime
                    key={task.id}
                    task={task}
                    onTaskClick={handleTaskClick}
                    actualMins={task.actualMins}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
      
      {/* Floating add button */}
      <button
        onClick={handleAddTask}
        className={cn(
          "fab-above-nav fixed right-4 z-50",
          "flex items-center justify-center w-14 h-14",
          "rounded-full bg-primary text-primary-foreground shadow-lg",
          "active:scale-95 transition-transform",
          "lg:hidden" // Hide on desktop
        )}
        aria-label="Add task"
      >
        <Plus className="h-6 w-6" />
      </button>
      
      {/* Task detail modal */}
      <TaskModal
        task={selectedTask}
        open={selectedTask !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null);
        }}
      />
      
      {/* New task: the same sheet used to edit tasks */}
      <TaskModal
        task={null}
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        createDefaults={{ scheduledDate: dateString }}
      />
    </div>
  );
}

// --- MobileBacklogSidebar ---
function MobileBacklogSidebar() {
  const { data: tasks, isLoading } = useTasks({ backlog: true, limit: 500 });
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);

  const pendingBacklogTasks = React.useMemo(() => {
    return (tasks ?? [])
      .filter((task) => !task.completedAt)
      .sort((a, b) => a.position - b.position);
  }, [tasks]);

  const completedBacklogTasks = React.useMemo(() => {
    return (tasks ?? []).filter((task) => task.completedAt);
  }, [tasks]);

  return (
    <>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Backlog</span>
            {pendingBacklogTasks.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {pendingBacklogTasks.length}
              </span>
            )}
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded" />
              ))}
            </div>
          ) : pendingBacklogTasks.length === 0 && completedBacklogTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">No unscheduled tasks</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Tasks without a date appear here
              </p>
            </div>
          ) : (
            <>
              {pendingBacklogTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => {
                    setSelectedTask(task);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-muted/50 active:bg-muted transition-colors"
                >
                  <p className="text-sm truncate">{task.title}</p>
                  {task.estimatedMins && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDuration(task.estimatedMins)}
                    </p>
                  )}
                </button>
              ))}

              {completedBacklogTasks.length > 0 && (
                <div className="pt-3 mt-3 border-t border-border/40">
                  <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                    Completed ({completedBacklogTasks.length})
                  </p>
                  {completedBacklogTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => {
                        setSelectedTask(task);
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-muted/50 active:bg-muted transition-colors opacity-60"
                    >
                      <p className="text-sm truncate line-through">{task.title}</p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Task detail modal */}
      <TaskModal
        task={selectedTask}
        open={selectedTask !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null);
        }}
      />
    </>
  );
}
