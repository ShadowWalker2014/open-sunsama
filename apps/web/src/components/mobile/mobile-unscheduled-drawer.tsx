import * as React from "react";
import { Plus, Check } from "lucide-react";
import type { Task } from "@open-sunsama/types";
import { useCreateTask, useCompleteTask } from "@/hooks";
import {
  Button,
  Input,
  ScrollArea,
  Skeleton,
  SheetHeader,
  SheetTitle,
} from "@/components/ui";
import { TaskCardContent } from "@/components/kanban/task-card-content";
import { TaskContextMenu } from "@/components/kanban/task-context-menu";

// ============================================================================
// Unscheduled Tasks Drawer
// ============================================================================

interface UnscheduledTasksDrawerProps {
  tasks: Task[];
  isLoading: boolean;
  onTaskClick?: (task: Task) => void;
}

export function UnscheduledTasksDrawer({
  tasks,
  isLoading,
  onTaskClick,
}: UnscheduledTasksDrawerProps) {
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const [isAddingTask, setIsAddingTask] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const createTask = useCreateTask();
  const completeTask = useCompleteTask();

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
    <>
      {/* Header */}
      <SheetHeader className="border-b p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <SheetTitle className="text-lg">Unscheduled Tasks</SheetTitle>
            <p className="text-sm text-muted-foreground">
              {tasks.length} task{tasks.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
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
            className="mb-3 h-12 text-base"
          />
          <div className="flex gap-2">
            <Button
              type="submit"
              className="h-11 flex-1"
              disabled={!newTaskTitle.trim() || createTask.isPending}
            >
              {createTask.isPending ? "Adding..." : "Add Task"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-11"
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
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <Check className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-base font-medium">All scheduled!</p>
              <p className="text-sm text-muted-foreground mt-1">
                No unscheduled tasks for today
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <MobileUnscheduledTaskCard
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
      {!isLoading && tasks.length > 0 && (
        <div className="border-t p-3 flex-shrink-0">
          <p className="text-xs text-center text-muted-foreground">
            Tap a task to view details
          </p>
        </div>
      )}
    </>
  );
}

// ============================================================================
// Mobile Unscheduled Task Card
// ============================================================================

interface MobileUnscheduledTaskCardProps {
  task: Task;
  onTaskClick?: (task: Task) => void;
  onToggleComplete: (completed: boolean) => void;
}

function MobileUnscheduledTaskCard({
  task,
  onTaskClick,
  onToggleComplete,
}: MobileUnscheduledTaskCardProps) {
  return (
    <TaskContextMenu task={task} onEdit={() => onTaskClick?.(task)}>
      <div className="cursor-pointer">
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
