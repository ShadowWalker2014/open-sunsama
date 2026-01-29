import * as React from "react";
import { format, isToday, isTomorrow, isPast, isYesterday } from "date-fns";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ArrowUpDown } from "lucide-react";
import type { Task } from "@chronoflow/types";
import { useTasks } from "@/hooks/useTasks";
import { cn, formatDurationHMM } from "@/lib/utils";
import { ScrollArea, Skeleton } from "@/components/ui";
import { SortableTaskCard, TaskCard, TaskCardPlaceholder } from "./task-card";
import { AddTaskInline } from "./add-task-inline";
import { type SortOption, parseSortOption } from "./kanban-board-toolbar";

// Priority order for sorting (lower number = higher priority)
const PRIORITY_ORDER: Record<string, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
};

interface DayColumnProps {
  date: Date;
  dateString: string;
  onSelectTask: (task: Task) => void;
  isOver?: boolean;
  activeTaskId?: string | null;
  sortBy?: SortOption;
}

/**
 * Linear-style day column with clean header and task list.
 */
export function DayColumn({
  date,
  dateString,
  onSelectTask,
  isOver,
  activeTaskId,
  sortBy = "position",
}: DayColumnProps) {
  const { data: tasks, isLoading } = useTasks({ scheduledDate: dateString });

  const { setNodeRef, isOver: isOverDroppable } = useDroppable({
    id: `day-${dateString}`,
    data: {
      type: "column",
      date: dateString,
    },
  });

  const today = isToday(date);
  const tomorrow = isTomorrow(date);
  const yesterday = isYesterday(date);
  const pastDay = isPast(date) && !today && !yesterday;
  const isDropTarget = isOver || isOverDroppable;

  // Sort function based on sortBy with direction support
  const sortTasks = React.useCallback(
    (taskList: Task[]) => {
      const sorted = [...taskList];
      const { field, direction } = parseSortOption(sortBy);
      
      switch (field) {
        case "priority":
          return sorted.sort((a, b) => {
            const priorityA = PRIORITY_ORDER[a.priority] ?? 2;
            const priorityB = PRIORITY_ORDER[b.priority] ?? 2;
            const priorityDiff = direction === "desc" 
              ? priorityA - priorityB  // High to Low (P0=0 first)
              : priorityB - priorityA; // Low to High (P3=3 first)
            if (priorityDiff !== 0) return priorityDiff;
            return a.position - b.position;
          });
        case "createdAt":
          return sorted.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return direction === "desc" 
              ? dateB - dateA  // Newest first
              : dateA - dateB; // Oldest first
          });
        case "position":
        default:
          return sorted.sort((a, b) => a.position - b.position);
      }
    },
    [sortBy]
  );

  // Separate pending and completed tasks
  const pendingTasks = React.useMemo(
    () => sortTasks(tasks?.filter((t) => !t.completedAt) ?? []),
    [tasks, sortTasks]
  );
  const completedTasks = React.useMemo(
    () => tasks?.filter((t) => t.completedAt) ?? [],
    [tasks]
  );

  // Task IDs for sortable context
  const taskIds = React.useMemo(
    () => pendingTasks.map((t) => t.id),
    [pendingTasks]
  );

  // Calculate total estimated time for all tasks (pending + completed)
  const totalEstimatedMins = React.useMemo(
    () => [...pendingTasks, ...completedTasks].reduce((sum, t) => sum + (t.estimatedMins ?? 0), 0),
    [pendingTasks, completedTasks]
  );

  // Calculate progress for today column
  const totalTasks = pendingTasks.length + completedTasks.length;
  const progressPercent = totalTasks > 0 
    ? Math.round((completedTasks.length / totalTasks) * 100) 
    : 0;

  // Get day label - "Today", "Tomorrow", or day name like "Thursday"
  const getDayLabel = () => {
    if (today) return "Today";
    if (tomorrow) return "Tomorrow";
    if (yesterday) return "Yesterday";
    return format(date, "EEEE");
  };

  // Get formatted date like "January 29"
  const getFormattedDate = () => {
    return format(date, "MMMM d");
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full min-w-[280px] max-w-[280px] flex-col border-r border-border/40 transition-colors",
        // Today highlight
        today && "bg-primary/[0.02]",
        // Drop target highlight
        isDropTarget && "bg-primary/5",
        // Past days are slightly muted
        pastDay && "opacity-60"
      )}
    >
      {/* Day Header - Sunsama style */}
      <div
        className={cn(
          "sticky top-0 z-10 border-b border-border/40 bg-background/95 px-3 pt-3 pb-2 backdrop-blur-sm",
          today && "bg-primary/[0.02]"
        )}
      >
        {/* Day name - large text */}
        <div
          className={cn(
            "text-base font-semibold",
            today ? "text-primary" : "text-foreground"
          )}
        >
          {getDayLabel()}
        </div>
        
        {/* Date - smaller text below */}
        <div className="text-sm text-muted-foreground mt-0.5">
          {getFormattedDate()}
        </div>

        {/* Progress bar - only show on Today column */}
        {today && totalTasks > 0 && (
          <div className="mt-2 h-1 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Add task row with total time */}
        <div className="flex items-center justify-between mt-3">
          <AddTaskInline scheduledDate={dateString} compact />
          
          {/* Sort icon and total time */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span className="font-medium">
              {formatDurationHMM(totalEstimatedMins)}
            </span>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <div className="space-y-2 p-1">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ) : (
            <>
              {/* Pending Tasks with sortable context for reordering */}
              <SortableContext
                items={taskIds}
                strategy={verticalListSortingStrategy}
              >
                {pendingTasks.map((task) => (
                  <SortableTaskCard
                    key={task.id}
                    task={task}
                    onSelect={onSelectTask}
                    isDragging={activeTaskId === task.id}
                  />
                ))}
              </SortableContext>

              {/* Drop indicator when empty */}
              {pendingTasks.length === 0 && isDropTarget && (
                <TaskCardPlaceholder />
              )}

              {/* Empty state */}
              {pendingTasks.length === 0 && !isDropTarget && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No tasks
                  </p>
                </div>
              )}

              {/* Completed Tasks */}
              {completedTasks.length > 0 && (
                <div className="pt-3 mt-3 border-t border-border/40">
                  <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                    Completed ({completedTasks.length})
                  </p>
                  <div className="space-y-1">
                    {completedTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onSelect={onSelectTask}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

    </div>
  );
}
