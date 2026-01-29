import * as React from "react";
import { Clock, GripVertical, ListTodo, ChevronUp, ChevronDown } from "lucide-react";
import type { Task } from "@chronoflow/types";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils";
import {
  Badge,
  ScrollArea,
  Skeleton,
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui";

interface UnscheduledTasksProps {
  tasks: Task[];
  isLoading?: boolean;
  onTaskDragStart?: (task: Task, e: React.MouseEvent) => void;
  onTaskClick?: (task: Task) => void;
  className?: string;
}

/**
 * UnscheduledTasksPanel - Left panel showing tasks scheduled for today but not time-blocked
 * On mobile, this becomes a bottom sheet that can be toggled
 */
export function UnscheduledTasksPanel({
  tasks,
  isLoading = false,
  onTaskDragStart,
  onTaskClick,
  className,
}: UnscheduledTasksProps) {
  const taskCount = tasks.length;

  // Desktop panel content
  const panelContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Unscheduled</h3>
        </div>
        {taskCount > 0 && (
          <Badge variant="secondary" className="h-5 min-w-[20px] justify-center">
            {taskCount}
          </Badge>
        )}
      </div>

      {/* Task List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {isLoading ? (
            // Loading skeletons
            <>
              <TaskItemSkeleton />
              <TaskItemSkeleton />
              <TaskItemSkeleton />
            </>
          ) : tasks.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <ListTodo className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No unscheduled tasks
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Drag tasks here from the backlog or create new ones
              </p>
            </div>
          ) : (
            // Task items
            tasks.map((task) => (
              <UnscheduledTaskItem
                key={task.id}
                task={task}
                onDragStart={(e) => onTaskDragStart?.(task, e)}
                onClick={() => onTaskClick?.(task)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer with instructions */}
      {!isLoading && tasks.length > 0 && (
        <div className="border-t px-4 py-2">
          <p className="text-xs text-muted-foreground text-center">
            Drag tasks to the timeline to schedule them
          </p>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop panel - hidden on mobile */}
      <div
        className={cn(
          "hidden md:flex w-72 flex-col border-r bg-muted/30",
          className
        )}
      >
        {panelContent}
      </div>

      {/* Mobile bottom sheet trigger */}
      <MobileUnscheduledSheet
        tasks={tasks}
        isLoading={isLoading}
        onTaskDragStart={onTaskDragStart}
        onTaskClick={onTaskClick}
      />
    </>
  );
}

/**
 * Mobile bottom sheet for unscheduled tasks
 */
interface MobileUnscheduledSheetProps {
  tasks: Task[];
  isLoading: boolean;
  onTaskDragStart?: (task: Task, e: React.MouseEvent) => void;
  onTaskClick?: (task: Task) => void;
}

function MobileUnscheduledSheet({
  tasks,
  isLoading,
  onTaskDragStart,
  onTaskClick,
}: MobileUnscheduledSheetProps) {
  const [open, setOpen] = React.useState(false);
  const taskCount = tasks.length;

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "fixed bottom-20 right-4 z-40 h-12 px-4 rounded-full shadow-lg",
              "bg-background/95 backdrop-blur",
              "active:scale-95 transition-transform"
            )}
            style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <ListTodo className="h-5 w-5 mr-2" />
            <span className="font-medium">Tasks</span>
            {taskCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 min-w-[20px]">
                {taskCount}
              </Badge>
            )}
            {open ? (
              <ChevronDown className="h-4 w-4 ml-1" />
            ) : (
              <ChevronUp className="h-4 w-4 ml-1" />
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[60vh] rounded-t-2xl p-0">
          <SheetHeader className="border-b px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-muted-foreground" />
                <SheetTitle className="text-sm font-semibold">
                  Unscheduled Tasks
                </SheetTitle>
              </div>
              {taskCount > 0 && (
                <Badge variant="secondary" className="h-5 min-w-[20px] justify-center">
                  {taskCount}
                </Badge>
              )}
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(60vh-60px)]">
            <div className="p-3 space-y-2">
              {isLoading ? (
                <>
                  <TaskItemSkeleton />
                  <TaskItemSkeleton />
                  <TaskItemSkeleton />
                </>
              ) : tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="rounded-full bg-muted p-4 mb-3">
                    <ListTodo className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No unscheduled tasks for today
                  </p>
                </div>
              ) : (
                tasks.map((task) => (
                  <UnscheduledTaskItem
                    key={task.id}
                    task={task}
                    onDragStart={(e) => onTaskDragStart?.(task, e)}
                    onClick={() => {
                      onTaskClick?.(task);
                      setOpen(false);
                    }}
                    isMobile
                  />
                ))
              )}
            </div>
          </ScrollArea>

          {/* Mobile drag hint */}
          {!isLoading && tasks.length > 0 && (
            <div className="border-t px-4 py-3 bg-muted/30">
              <p className="text-xs text-muted-foreground text-center">
                Tap a task to view details, or drag to the timeline
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/**
 * Individual unscheduled task item
 */
interface UnscheduledTaskItemProps {
  task: Task;
  onDragStart?: (e: React.MouseEvent) => void;
  onClick?: () => void;
  isMobile?: boolean;
}

function UnscheduledTaskItem({
  task,
  onDragStart,
  onClick,
  isMobile = false,
}: UnscheduledTaskItemProps) {
  const [isDragging, setIsDragging] = React.useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    onDragStart?.(e);

    // Add global mouse up listener to reset dragging state
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    // Let the user scroll without triggering drag
    // Drag is initiated by holding
  };

  return (
    <div
      className={cn(
        "group relative rounded-lg border bg-card transition-all",
        // Larger padding on mobile for touch targets
        isMobile ? "p-4 min-h-[60px]" : "p-3",
        "hover:shadow-md hover:border-primary/30",
        "active:bg-accent/30", // Touch feedback
        isDragging && "opacity-50 cursor-grabbing shadow-lg",
        !isDragging && "cursor-grab"
      )}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Task: ${task.title}`}
    >
      {/* Drag handle indicator - always visible on mobile */}
      <div
        className={cn(
          "absolute left-1 top-1/2 -translate-y-1/2 transition-opacity",
          isMobile ? "opacity-40" : "opacity-0 group-hover:opacity-40"
        )}
      >
        <GripVertical className={cn(isMobile ? "h-5 w-5" : "h-4 w-4", "text-muted-foreground")} />
      </div>

      {/* Content */}
      <div className={cn(isMobile ? "pl-5" : "pl-4")}>
        {/* Title */}
        <p className={cn(
          "font-medium truncate pr-2",
          isMobile ? "text-base" : "text-sm"
        )}>
          {task.title}
        </p>

        {/* Estimated duration */}
        {task.estimatedMins && (
          <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatDuration(task.estimatedMins)}</span>
          </div>
        )}

        {/* Notes preview */}
        {task.notes && (
          <p className="mt-1.5 text-xs text-muted-foreground truncate">
            {task.notes}
          </p>
        )}
      </div>

      {/* Visual indicator that this can be dragged - hidden on mobile */}
      {!isMobile && (
        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            Drag to schedule
          </Badge>
        </div>
      )}
    </div>
  );
}

/**
 * Loading skeleton for task items
 */
function TaskItemSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-3">
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  );
}
