import * as React from "react";
import { Plus, GripVertical, Check, Clock, InboxIcon } from "lucide-react";
import { useTasks, useCreateTask } from "@/hooks/useTasks";
import { cn, formatDuration } from "@/lib/utils";
import {
  Button,
  Input,
  ScrollArea,
  Skeleton,
  Badge,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui";

interface MobileBacklogSheetProps {
  /** Custom trigger element. If not provided, uses default FAB button */
  trigger?: React.ReactNode;
}

/**
 * Mobile slide-out sheet for backlog tasks
 * Opens from the left side on mobile devices
 */
export function MobileBacklogSheet({ trigger }: MobileBacklogSheetProps) {
  const [open, setOpen] = React.useState(false);
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const [isAddingTask, setIsAddingTask] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Use high limit to ensure we get all backlog tasks (API default is 50)
  const { data: tasks, isLoading } = useTasks({ scheduledDate: null, limit: 500 });
  const createTask = useCreateTask();

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
                  <MobileBacklogTaskCard key={task.id} task={task} />
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
  task: {
    id: string;
    title: string;
    estimatedMins: number | null;
    scheduledDate: string | null;
  };
}

function MobileBacklogTaskCard({ task }: MobileBacklogTaskCardProps) {
  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors",
        "active:bg-accent/50", // Touch feedback
        "min-h-[60px]" // Touch-friendly height
      )}
    >
      {/* Drag Handle - visible on mobile */}
      <div className="mt-0.5 text-muted-foreground">
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug">{task.title}</p>
        <div className="mt-2 flex items-center gap-2">
          {task.estimatedMins && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Clock className="h-3 w-3" />
              {formatDuration(task.estimatedMins)}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
