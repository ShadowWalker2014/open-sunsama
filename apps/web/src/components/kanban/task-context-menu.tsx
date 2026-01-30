import * as React from "react";
import { format, addDays, startOfWeek } from "date-fns";
import {
  Focus,
  Calendar,
  ArrowUp,
  ArrowDown,
  CalendarArrowUp,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Archive,
} from "lucide-react";
import type { Task } from "@open-sunsama/types";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui";
import {
  useUpdateTask,
  useDeleteTask,
  useCreateTask,
  useReorderTasks,
  useTasks,
} from "@/hooks/useTasks";
import { useQuickSchedule } from "@/hooks";
import { useSubtasks } from "@/hooks/useSubtasks";
import { formatShortcut, SHORTCUTS } from "@/hooks/useKeyboardShortcuts";
import { toast } from "@/hooks/use-toast";

interface TaskContextMenuProps {
  task: Task;
  children: React.ReactNode;
  onEdit?: () => void;
  onFocus?: () => void;
}

export function TaskContextMenu({
  task,
  children,
  onEdit,
  onFocus,
}: TaskContextMenuProps) {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createTask = useCreateTask();
  const reorderTasks = useReorderTasks();
  const quickSchedule = useQuickSchedule();

  // Fetch tasks for the same date/backlog to support reordering
  const { data: tasksInSameList } = useTasks(
    task.scheduledDate
      ? { scheduledDate: task.scheduledDate }
      : { backlog: true }
  );

  // Fetch subtasks to check if the task has any
  const { data: subtasks } = useSubtasks(task.id);
  const hasSubtasks = subtasks && subtasks.length > 0;

  // Track hide subtasks state (placeholder - not persisted yet)
  const [hideSubtasks, setHideSubtasks] = React.useState(false);

  const handleFocus = () => {
    // onFocus and onEdit do the same thing - open task detail
    if (onFocus) {
      onFocus();
    } else if (onEdit) {
      onEdit();
    }
  };

  const handleAddToCalendar = async () => {
    const date = task.scheduledDate || format(new Date(), "yyyy-MM-dd");
    await quickSchedule.mutateAsync({
      taskId: task.id,
      startTime: `${date}T09:00:00`,
      durationMins: task.estimatedMins ?? undefined,
    });
  };

  const handleMoveToTop = async () => {
    if (!tasksInSameList || tasksInSameList.length === 0) return;

    // Get all incomplete tasks sorted by position
    const incompleteTasks = tasksInSameList
      .filter((t) => !t.completedAt)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    // Move current task to top
    const newOrder = [
      task.id,
      ...incompleteTasks.filter((t) => t.id !== task.id).map((t) => t.id),
    ];

    const dateKey = task.scheduledDate || "backlog";
    await reorderTasks.mutateAsync({ date: dateKey, taskIds: newOrder });

    toast({
      title: "Task moved to top",
      description: `"${task.title}" moved to top of the list.`,
    });
  };

  const handleMoveToBottom = async () => {
    if (!tasksInSameList || tasksInSameList.length === 0) return;

    // Get all incomplete tasks sorted by position
    const incompleteTasks = tasksInSameList
      .filter((t) => !t.completedAt)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    // Move current task to bottom
    const newOrder = [
      ...incompleteTasks.filter((t) => t.id !== task.id).map((t) => t.id),
      task.id,
    ];

    const dateKey = task.scheduledDate || "backlog";
    await reorderTasks.mutateAsync({ date: dateKey, taskIds: newOrder });

    toast({
      title: "Task moved to bottom",
      description: `"${task.title}" moved to bottom of the list.`,
    });
  };

  const handleDeferToNextWeek = async () => {
    // Calculate next Monday
    const today = new Date();
    const nextMonday = addDays(startOfWeek(today, { weekStartsOn: 1 }), 7);
    const nextMondayStr = format(nextMonday, "yyyy-MM-dd");

    await updateTask.mutateAsync({
      id: task.id,
      data: { scheduledDate: nextMondayStr },
    });

    toast({
      title: "Task deferred",
      description: `"${task.title}" moved to ${format(nextMonday, "EEEE, MMM d")}.`,
    });
  };

  const handleDeferToBacklog = async () => {
    if (task.scheduledDate === null) return;

    await updateTask.mutateAsync({
      id: task.id,
      data: { scheduledDate: null },
    });

    toast({
      title: "Task deferred",
      description: `"${task.title}" moved to backlog.`,
    });
  };

  const handleToggleHideSubtasks = () => {
    setHideSubtasks(!hideSubtasks);
    toast({
      title: hideSubtasks ? "Subtasks shown" : "Subtasks hidden",
      description: "This preference is not persisted yet.",
    });
  };

  const handleDuplicate = async () => {
    await createTask.mutateAsync({
      title: task.title,
      notes: task.notes ?? undefined,
      priority: task.priority,
      scheduledDate: task.scheduledDate ?? undefined,
      estimatedMins: task.estimatedMins ?? undefined,
    });

    toast({
      title: "Task duplicated",
      description: `A copy of "${task.title}" has been created.`,
    });
  };

  const handleDelete = async () => {
    const deletedTask = task;

    await deleteTask.mutateAsync(task.id);

    toast({
      title: "Task removed",
      description: `"${deletedTask.title}" has been removed.`,
      action: (
        <button
          className="text-primary hover:underline text-sm font-medium"
          onClick={async () => {
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
      <ContextMenuContent className="w-56">
        {/* Focus */}
        <ContextMenuItem onClick={handleFocus}>
          <Focus className="mr-2 h-4 w-4" />
          Focus
          <ContextMenuShortcut>{SHORTCUTS.focus && formatShortcut(SHORTCUTS.focus)}</ContextMenuShortcut>
        </ContextMenuItem>

        {/* Add to calendar */}
        <ContextMenuItem onClick={handleAddToCalendar}>
          <Calendar className="mr-2 h-4 w-4" />
          Add to calendar
          <ContextMenuShortcut>{SHORTCUTS.addToCalendar && formatShortcut(SHORTCUTS.addToCalendar)}</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Move to top */}
        <ContextMenuItem onClick={handleMoveToTop}>
          <ArrowUp className="mr-2 h-4 w-4" />
          Move to top
          <ContextMenuShortcut>{SHORTCUTS.moveToTop && formatShortcut(SHORTCUTS.moveToTop)}</ContextMenuShortcut>
        </ContextMenuItem>

        {/* Move to bottom */}
        <ContextMenuItem onClick={handleMoveToBottom}>
          <ArrowDown className="mr-2 h-4 w-4" />
          Move to bottom
          <ContextMenuShortcut>{SHORTCUTS.moveToBottom && formatShortcut(SHORTCUTS.moveToBottom)}</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Defer to next week */}
        <ContextMenuItem onClick={handleDeferToNextWeek}>
          <CalendarArrowUp className="mr-2 h-4 w-4" />
          Defer to next week
          <ContextMenuShortcut>{SHORTCUTS.deferToNextWeek && formatShortcut(SHORTCUTS.deferToNextWeek)}</ContextMenuShortcut>
        </ContextMenuItem>

        {/* Defer to backlog - with submenu indicator */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Archive className="mr-2 h-4 w-4" />
            Defer to backlog
            <ContextMenuShortcut className="ml-auto mr-2">
              {SHORTCUTS.moveToBacklog && formatShortcut(SHORTCUTS.moveToBacklog)}
            </ContextMenuShortcut>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onClick={handleDeferToBacklog}>
              Move to backlog now
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        {/* Hide subtasks - only show if task has subtasks */}
        {hasSubtasks && (
          <ContextMenuItem onClick={handleToggleHideSubtasks}>
            {hideSubtasks ? (
              <Eye className="mr-2 h-4 w-4" />
            ) : (
              <EyeOff className="mr-2 h-4 w-4" />
            )}
            {hideSubtasks ? "Show subtasks" : "Hide subtasks"}
            <ContextMenuShortcut>{SHORTCUTS.hideSubtasks && formatShortcut(SHORTCUTS.hideSubtasks)}</ContextMenuShortcut>
          </ContextMenuItem>
        )}

        {/* Duplicate */}
        <ContextMenuItem onClick={handleDuplicate}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
          <ContextMenuShortcut>{SHORTCUTS.duplicate && formatShortcut(SHORTCUTS.duplicate)}</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Remove from tasks */}
        <ContextMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Remove from tasks
          <ContextMenuShortcut>{SHORTCUTS.deleteTask && formatShortcut(SHORTCUTS.deleteTask)}</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
