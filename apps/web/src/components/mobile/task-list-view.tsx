import * as React from "react";
import {
  format,
  addDays,
  subDays,
  startOfDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameMonth,
  isSameDay,
  isToday,
  subMonths,
  addMonths,
} from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight, Inbox, Menu, Plus } from "lucide-react";
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
import { useTasks, useReorderTasks } from "@/hooks/useTasks";
import { MobileTaskCardWithActualTime } from "./mobile-task-card";
import { SortableMobileTaskCard } from "./sortable-mobile-task-card";
import { TaskModal } from "@/components/kanban/task-modal";
import { AddTaskModal } from "@/components/kanban/add-task-modal";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface MobileTaskListViewProps {
  /** The date to show tasks for (defaults to today) */
  date?: Date;
  className?: string;
}

/**
 * Mobile-optimized task list view matching Sunsama mobile design.
 * Features sticky header, progress bar, and scrollable task list.
 */
export function MobileTaskListView({ date, className }: MobileTaskListViewProps) {
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [swipeDirection, setSwipeDirection] = React.useState<'left' | 'right' | null>(null);
  
  // Stateful date for swipe navigation
  const [currentDate, setCurrentDate] = React.useState<Date>(() => date ?? startOfDay(new Date()));
  const dateString = format(currentDate, "yyyy-MM-dd");
  
  // Date navigation
  const goToNextDay = () => {
    setSwipeDirection('left');
    setCurrentDate(d => addDays(d, 1));
    setTimeout(() => setSwipeDirection(null), 200);
  };
  const goToPreviousDay = () => {
    setSwipeDirection('right');
    setCurrentDate(d => subDays(d, 1));
    setTimeout(() => setSwipeDirection(null), 200);
  };
  const goToDate = (newDate: Date) => setCurrentDate(startOfDay(newDate));
  
  // Swipe gesture handling
  const touchStartX = React.useRef<number | null>(null);
  const touchStartY = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

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
  const { data: tasks, isLoading } = useTasks({ scheduledDate: dateString });
  
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
    const all = tasks ?? [];
    const pending = all.filter((task) => !task.completedAt).sort((a, b) => a.position - b.position);
    const completed = all.filter((task) => task.completedAt);
    return { pendingTasks: pending, completedTasks: completed };
  }, [tasks]);
  
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
  
  // Format date for header
  const dayName = format(currentDate, "EEEE");
  const monthDay = format(currentDate, "MMMM d");
  
  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border/40">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left side: Menu + Date */}
          <div className="flex items-center gap-3">
            {/* Hamburger menu - opens sidebar sheet */}
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <button
                  className="flex items-center justify-center w-10 h-10 -ml-2 rounded-lg active:bg-muted/50 transition-colors"
                  aria-label="Open backlog"
                >
                  <Menu className="h-5 w-5 text-muted-foreground" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <MobileBacklogSidebar onClose={() => setIsSidebarOpen(false)} />
              </SheetContent>
            </Sheet>
            
            {/* Date display - tap to pick date */}
            <MobileDatePicker value={currentDate} onChange={goToDate}>
              <button className="text-left active:opacity-70 transition-opacity">
                <h1 className="text-lg font-semibold leading-tight">{dayName}</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  {monthDay}
                  <ChevronDown className="h-3 w-3" />
                </p>
              </button>
            </MobileDatePicker>
          </div>
          
          {/* Right side: Total time badge */}
          <div className="text-sm text-muted-foreground tabular-nums">
            {stats.totalEstimatedMins > 0 ? formatDuration(stats.totalEstimatedMins) : "0:00"}
          </div>
        </div>
        
        {/* Progress bar - very thin */}
        <div className="h-1 bg-muted/30">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${stats.progressPercent}%` }}
          />
        </div>
      </header>
      
      {/* Scrollable task list */}
      <main
        className={cn(
          "flex-1 overflow-y-auto pb-24 transition-opacity duration-200",
          swipeDirection && "opacity-90"
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
              No tasks for today
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
          "fixed right-4 bottom-24 z-50",
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
      
      {/* Add task modal */}
      <AddTaskModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        scheduledDate={dateString}
      />
    </div>
  );
}

// --- MobileDatePicker ---

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function MobileDatePicker({
  value,
  onChange,
  children,
}: {
  value: Date;
  onChange: (date: Date) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [viewMonth, setViewMonth] = React.useState(() => startOfMonth(value));

  // Reset view month when value changes
  React.useEffect(() => {
    setViewMonth(startOfMonth(value));
  }, [value]);

  const calendarDays = React.useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDayOfWeek = getDay(monthStart);
    const paddingBefore: (Date | null)[] = Array(startDayOfWeek).fill(null);
    const totalDays = paddingBefore.length + daysInMonth.length;
    const paddingAfter: (Date | null)[] = Array(
      totalDays % 7 === 0 ? 0 : 7 - (totalDays % 7)
    ).fill(null);
    return [...paddingBefore, ...daysInMonth, ...paddingAfter];
  }, [viewMonth]);

  const handleSelect = (date: Date) => {
    onChange(date);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start" sideOffset={8}>
        {/* Quick Navigation */}
        <div className="p-3 border-b border-border/50 flex items-center gap-2">
          <button
            onClick={() => {
              onChange(startOfDay(new Date()));
              setOpen(false);
            }}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
              isSameDay(value, new Date())
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-foreground"
            )}
          >
            Today
          </button>
          <button
            onClick={() => {
              onChange(addDays(startOfDay(new Date()), 1));
              setOpen(false);
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors"
          >
            Tomorrow
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const dayOfWeek = today.getDay();
              const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
              onChange(addDays(startOfDay(today), daysUntilMonday));
              setOpen(false);
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors"
          >
            Next Mon
          </button>
        </div>

        {/* Calendar */}
        <div className="p-3">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setViewMonth(subMonths(viewMonth, 1))}
              className="p-1.5 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium">
              {format(viewMonth, "MMMM yyyy")}
            </span>
            <button
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              className="p-1.5 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="h-8 flex items-center justify-center text-xs text-muted-foreground/60 font-medium"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="h-9" />;
              }

              const isCurrentMonth = isSameMonth(day, viewMonth);
              const isSelected = isSameDay(day, value);
              const isTodayDate = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleSelect(day)}
                  className={cn(
                    "h-9 w-full flex items-center justify-center text-sm rounded-md transition-colors",
                    !isCurrentMonth && "text-muted-foreground/30",
                    isCurrentMonth &&
                      !isSelected &&
                      !isTodayDate &&
                      "text-foreground hover:bg-muted/50",
                    isTodayDate &&
                      !isSelected &&
                      "bg-primary/15 text-primary font-medium",
                    isSelected &&
                      "bg-primary text-primary-foreground font-medium"
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// --- MobileBacklogSidebar ---

function MobileBacklogSidebar({ onClose }: { onClose: () => void }) {
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
