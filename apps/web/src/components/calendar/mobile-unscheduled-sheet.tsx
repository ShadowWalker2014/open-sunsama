import * as React from "react";
import { ListTodo, ChevronUp, ChevronDown } from "lucide-react";
import type { Task } from "@chronoflow/types";
import { cn } from "@/lib/utils";
import {
  Badge,
  ScrollArea,
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui";
import { UnscheduledTaskItem, TaskItemSkeleton } from "./unscheduled-task-item";

interface MobileUnscheduledSheetProps {
  tasks: Task[];
  isLoading: boolean;
  onTaskDragStart?: (task: Task, e: React.MouseEvent) => void;
  onTaskClick?: (task: Task) => void;
}

/**
 * Mobile bottom sheet for unscheduled tasks
 */
export function MobileUnscheduledSheet({
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
