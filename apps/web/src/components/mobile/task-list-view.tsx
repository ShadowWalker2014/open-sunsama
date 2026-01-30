import * as React from "react";
import { format } from "date-fns";
import { Menu, Plus } from "lucide-react";
import type { Task } from "@open-sunsama/types";
import { cn, formatDuration } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";
import { MobileTaskCardWithActualTime } from "./mobile-task-card";
import { TaskModal } from "@/components/kanban/task-modal";
import { AddTaskModal } from "@/components/kanban/add-task-modal";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

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
  
  // Use provided date or default to today
  const currentDate = date ?? new Date();
  const dateString = format(currentDate, "yyyy-MM-dd");
  
  // Fetch tasks for the current date
  const { data: tasks, isLoading } = useTasks({ scheduledDate: dateString });
  
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
                <Sidebar className="w-full h-full border-none" />
              </SheetContent>
            </Sheet>
            
            {/* Date display */}
            <div>
              <h1 className="text-lg font-semibold leading-tight">{dayName}</h1>
              <p className="text-sm text-muted-foreground">{monthDay}</p>
            </div>
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
      <main className="flex-1 overflow-y-auto pb-24">
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
            {/* Pending tasks */}
            {pendingTasks.map((task) => (
              <MobileTaskCardWithActualTime
                key={task.id}
                task={task}
                onTaskClick={handleTaskClick}
                actualMins={task.actualMins}
              />
            ))}
            
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
