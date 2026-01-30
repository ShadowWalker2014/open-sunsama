import * as React from "react";
import { Plus, Check, InboxIcon } from "lucide-react";
import type { Task } from "@open-sunsama/types";
import { useTasks, useCreateTask, useCompleteTask } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";
import {
  Button,
  Input,
  ScrollArea,
  Skeleton,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui";
import { TaskCardContent } from "@/components/kanban/task-card-content";
import { TaskContextMenu } from "@/components/kanban/task-context-menu";

interface MobileBacklogSheetProps {
  /** Custom trigger element. If not provided, uses default FAB button */
  trigger?: React.ReactNode;
  /** Callback when a task is clicked for editing */
  onTaskClick?: (task: Task) => void;
}

/**
 * Mobile slide-out sheet for backlog tasks
 * Opens from the left side on mobile devices
 */
export function MobileBacklogSheet({ trigger, onTaskClick }: MobileBacklogSheetProps) {
  const [open, setOpen] = React.useState(false);
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const [isAddingTask, setIsAddingTask] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Use high limit to ensure we get all backlog tasks (API default is 50)
  const { data: tasks, isLoading } = useTasks({ scheduledDate: null, limit: 500 });
  const createTask = useCreateTask();
  const completeTask = useCompleteTask();

  const backlogTasks = React.useMemo(() => {
    return tasks?.filter((task) => !task.completedAt) ?? [];
  }, [tasks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    await createTask.mutateAsync({
      title: newTaskTitle.trim(),
    });

    setNewTaskTitle("");
    setIsAddingTask(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setNewTaskTitle("");
      setIsAddingTask(false);
    }
  };

  React.useEffect(() => {
    if (isAddingTask && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingTask]);

  const defaultTrigger = (
    <Button
      variant="default"
      size="lg"
      className={cn(
        "fixed bottom-20 left-4 z-40 h-14 w-14 rounded-full shadow-lg",
        "lg:hidden", // Only show on mobile
        "active:scale-95 transition-transform"
      )}
      style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <InboxIcon className="h-6 w-6" />
      <span className="sr-only">Open Backlog</span>
      {/* Badge for task count */}
      {backlogTasks.length > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
          {backlogTasks.length > 9 ? "9+" : backlogTasks.length}
        </span>
      )}
    </Button>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger || defaultTrigger}</SheetTrigger>
      <SheetContent side="left" className="w-full max-w-sm p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="border-b p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-lg">Backlog</SheetTitle>
              <p className="text-sm text-muted-foreground">
                {backlogTasks.length} task{backlogTasks.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10" // Touch-friendly
              onClick={() => setIsAddingTask(true)}
            >
              <Plus className="h-5 w-5" />
              <span className="sr-only">Add task</span>
            </Button>
          </div>
        </SheetHeader>

        {/* Quick Add Form */}
        {isAddingTask && (
          <form onSubmit={handleSubmit} className="border-b p-4 flex-shrink-0">
            <Input
              ref={inputRef}
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What needs to be done?"
              className="mb-3 h-12 text-base" // Larger touch target
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                className="h-11 flex-1" // Touch-friendly
                disabled={!newTaskTitle.trim() || createTask.isPending}
              >
                {createTask.isPending ? "Adding..." : "Add Task"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-11" // Touch-friendly
                onClick={() => {
                  setNewTaskTitle("");
                  setIsAddingTask(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Task List */}
        <ScrollArea className="flex-1">
          <div className="p-3">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : backlogTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 rounded-full bg-muted p-4">
                  <Check className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-base font-medium">All caught up!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  No tasks in your backlog
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {backlogTasks.map((task) => (
                  <MobileBacklogTaskCard
                    key={task.id}
                    task={task}
                    onTaskClick={onTaskClick}
                    onToggleComplete={(completed) =>
                      completeTask.mutate({ id: task.id, completed })
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer hint */}
        {!isLoading && backlogTasks.length > 0 && (
          <div className="border-t p-3 flex-shrink-0">
            <p className="text-xs text-center text-muted-foreground">
              Tap and hold to drag tasks to schedule them
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

interface MobileBacklogTaskCardProps {
  task: Task;
  onTaskClick?: (task: Task) => void;
  onToggleComplete: (completed: boolean) => void;
}

function MobileBacklogTaskCard({
  task,
  onTaskClick,
  onToggleComplete,
}: MobileBacklogTaskCardProps) {
  return (
    <TaskContextMenu task={task} onEdit={() => onTaskClick?.(task)}>
      <div className="cursor-grab active:cursor-grabbing">
        <TaskCardContent
          task={task}
          isCompleted={!!task.completedAt}
          isHovered={false}
          onToggleComplete={(e) => {
            e.stopPropagation();
            onToggleComplete(!task.completedAt);
          }}
          onClick={() => onTaskClick?.(task)}
          onHoverChange={() => {}}
        />
      </div>
    </TaskContextMenu>
  );
}
