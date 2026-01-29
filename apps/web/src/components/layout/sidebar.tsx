import * as React from "react";
import { Plus, GripVertical, Check, Clock, Calendar } from "lucide-react";
import { useTasks, useCreateTask } from "@/hooks/useTasks";
import { cn, formatDuration } from "@/lib/utils";
import {
  Button,
  Input,
  ScrollArea,
  Skeleton,
  Badge,
} from "@/components/ui";

interface SidebarProps {
  className?: string;
}

/**
 * Sidebar component showing the task backlog
 * Tasks without a scheduled date appear here
 */
export function Sidebar({ className }: SidebarProps) {
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const [isAddingTask, setIsAddingTask] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const { data: tasks, isLoading } = useTasks({ scheduledDate: null });
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

  return (
    <aside
      className={cn(
        "flex h-full w-80 flex-col border-r bg-background",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <h2 className="text-lg font-semibold">Backlog</h2>
          <p className="text-sm text-muted-foreground">
            {backlogTasks.length} task{backlogTasks.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsAddingTask(true)}
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">Add task</span>
        </Button>
      </div>

      {/* Quick Add Form */}
      {isAddingTask && (
        <form onSubmit={handleSubmit} className="border-b p-4">
          <Input
            ref={inputRef}
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What needs to be done?"
            className="mb-2"
          />
          <div className="flex gap-2">
            <Button
              type="submit"
              size="sm"
              disabled={!newTaskTitle.trim() || createTask.isPending}
            >
              {createTask.isPending ? "Adding..." : "Add Task"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
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
        <div className="p-2">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : backlogTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-muted p-3">
                <Check className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-sm text-muted-foreground">
                No tasks in your backlog
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {backlogTasks.map((task) => (
                <BacklogTaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}

interface BacklogTaskCardProps {
  task: {
    id: string;
    title: string;
    estimatedMins: number | null;
    scheduledDate: string | null;
  };
}

function BacklogTaskCard({ task }: BacklogTaskCardProps) {
  return (
    <div
      className="group flex cursor-grab items-start gap-2 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50 active:cursor-grabbing"
      draggable
    >
      {/* Drag Handle */}
      <div className="mt-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{task.title}</p>
        <div className="mt-1 flex items-center gap-2">
          {task.estimatedMins && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Clock className="h-3 w-3" />
              {formatDuration(task.estimatedMins)}
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Schedule Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <Calendar className="h-3.5 w-3.5" />
        <span className="sr-only">Schedule task</span>
      </Button>
    </div>
  );
}
