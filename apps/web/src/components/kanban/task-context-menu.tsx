import * as React from "react";
import { format } from "date-fns";
import { Pencil, Trash2, Sun, Archive } from "lucide-react";
import type { Task, TaskPriority } from "@chronoflow/types";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui";
import { PriorityIcon } from "@/components/ui/priority-badge";
import { useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { toast } from "@/hooks/use-toast";

interface TaskContextMenuProps {
  task: Task;
  children: React.ReactNode;
  onEdit?: () => void;
}

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "P0", label: "Urgent" },
  { value: "P1", label: "High" },
  { value: "P2", label: "Medium" },
  { value: "P3", label: "Low" },
];

export function TaskContextMenu({
  task,
  children,
  onEdit,
}: TaskContextMenuProps) {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const handleSetPriority = async (priority: TaskPriority) => {
    if (task.priority === priority) return;
    
    await updateTask.mutateAsync({
      id: task.id,
      data: { priority },
    });
    
    toast({
      title: "Priority updated",
      description: `Task priority set to ${priority}`,
    });
  };

  const handleMoveToToday = async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    if (task.scheduledDate === today) return;

    await updateTask.mutateAsync({
      id: task.id,
      data: { scheduledDate: today },
    });

    toast({
      title: "Moved to Today",
      description: `"${task.title}" has been moved to today.`,
    });
  };

  const handleMoveToBacklog = async () => {
    if (task.scheduledDate === null) return;

    await updateTask.mutateAsync({
      id: task.id,
      data: { scheduledDate: null },
    });

    toast({
      title: "Moved to Backlog",
      description: `"${task.title}" has been moved to backlog.`,
    });
  };

  const handleDelete = async () => {
    const deletedTask = task;
    
    await deleteTask.mutateAsync(task.id);

    toast({
      title: "Task deleted",
      description: `"${deletedTask.title}" has been deleted.`,
      action: (
        <button
          className="text-primary hover:underline text-sm font-medium"
          onClick={async () => {
            // Undo not implemented yet - would need to recreate the task
            toast({
              title: "Cannot undo",
              description: "Task deletion cannot be undone.",
            });
          }}
        >
          Undo
        </button>
      ),
    });
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {/* Edit */}
        <ContextMenuItem onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </ContextMenuItem>

        {/* Priority submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <PriorityIcon priority={task.priority} className="mr-2" />
            Set Priority
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-40">
            {PRIORITIES.map((p) => (
              <ContextMenuItem
                key={p.value}
                onClick={() => handleSetPriority(p.value)}
                className={task.priority === p.value ? "bg-accent" : ""}
              >
                <PriorityIcon priority={p.value} className="mr-2" />
                {p.label}
                {task.priority === p.value && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    Current
                  </span>
                )}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        {/* Move to Today */}
        <ContextMenuItem onClick={handleMoveToToday}>
          <Sun className="mr-2 h-4 w-4" />
          Move to Today
        </ContextMenuItem>

        {/* Move to Backlog */}
        <ContextMenuItem onClick={handleMoveToBacklog}>
          <Archive className="mr-2 h-4 w-4" />
          Move to Backlog
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Delete */}
        <ContextMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
