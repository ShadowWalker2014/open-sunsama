import * as React from "react";
import { Search, Plus, AlertCircle } from "lucide-react";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import type { Task } from "@open-sunsama/types";
import { useInfiniteSearchTasks } from "@/hooks/useInfiniteSearchTasks";
import { useCompleteTask, useReorderTasks } from "@/hooks/useTasks";
import { TaskModal } from "@/components/kanban/task-modal";
import { AddTaskModal } from "@/components/kanban/add-task-modal";
import { TaskGroup } from "@/components/tasks/task-group";
import { TaskShortcutsHandler } from "@/components/task-shortcuts-handler";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { TaskRow } from "@/components/tasks/task-row";

type StatusFilter = "active" | "all" | "completed";

interface TaskGroups {
  overdue: Task[];
  today: Task[];
  tomorrow: Task[];
  future: Map<string, Task[]>; // keyed by date string
  noDate: Task[];
}

function groupTasksByDate(tasks: Task[]): TaskGroups {
  const groups: TaskGroups = {
    overdue: [],
    today: [],
    tomorrow: [],
    future: new Map(),
    noDate: [],
  };

  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");

  for (const task of tasks) {
    if (!task.scheduledDate) {
      groups.noDate.push(task);
      continue;
    }

    const taskDate = parseISO(task.scheduledDate);
    const isPastDate = task.scheduledDate < todayStr;

    if (isToday(taskDate)) {
      groups.today.push(task);
    } else if (isTomorrow(taskDate)) {
      groups.tomorrow.push(task);
    } else if (isPastDate) {
      // Past dates go to overdue (includes completed tasks for "all" view)
      groups.overdue.push(task);
    } else {
      // Future dates
      const existing = groups.future.get(task.scheduledDate) || [];
      existing.push(task);
      groups.future.set(task.scheduledDate, existing);
    }
  }

  // Sort each group by position, then priority
  const sortTasks = (a: Task, b: Task) => {
    if (a.position !== b.position) return a.position - b.position;
    return a.priority.localeCompare(b.priority);
  };

  groups.overdue.sort(sortTasks);
  groups.today.sort(sortTasks);
  groups.tomorrow.sort(sortTasks);
  groups.noDate.sort(sortTasks);
  groups.future.forEach((tasks) => tasks.sort(sortTasks));

  return groups;
}

function formatFutureDate(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, "EEE, MMM d");
}

export default function TasksListPage() {
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("active");
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  const [activeOverGroup, setActiveOverGroup] = React.useState<string | null>(null);
  const completeTask = useCompleteTask();
  const reorderTasks = useReorderTasks();
  const deferredQuery = React.useDeferredValue(query);

  // DnD sensors with distance-based activation
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Helper to check if an ID is a group (not a task)
  const isGroupId = React.useCallback((id: string | number | undefined): boolean => {
    if (!id) return false;
    const idStr = String(id);
    return idStr.startsWith("group-");
  }, []);

  // Helper to extract dateKey from group ID
  const getDateKeyFromGroupId = React.useCallback((id: string | number | undefined): string | null => {
    if (!id) return null;
    const idStr = String(id);
    if (idStr.startsWith("group-")) {
      return idStr.replace("group-", "") || null;
    }
    return null;
  }, []);

  const { data, isLoading, isError, error, refetch } = useInfiniteSearchTasks({
    query: deferredQuery,
    status: statusFilter,
    limit: 200, // Fetch more since we're not virtualizing
  });

  // Flatten all pages into a single array of tasks
  const tasks = React.useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.data);
  }, [data?.pages]);

  // Group tasks by date
  const groupedTasks = React.useMemo(() => groupTasksByDate(tasks), [tasks]);

  // Determine date keys for each group
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = format(tomorrowDate, "yyyy-MM-dd");

  // DnD Event Handlers
  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    const { active } = event;
    const task = active.data.current?.task as Task | undefined;
    if (task) {
      setActiveTask(task);
      const sourceDateKey = active.data.current?.columnId as string | undefined;
      setActiveOverGroup(sourceDateKey || null);
    }
  }, []);

  const handleDragOver = React.useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setActiveOverGroup(null);
      return;
    }

    // Check if over a group droppable
    const groupDateKey = getDateKeyFromGroupId(over.id);
    if (groupDateKey) {
      setActiveOverGroup(groupDateKey);
      return;
    }

    // If over a task, get the column from the task's data
    if (over.data.current?.columnId) {
      const columnId = String(over.data.current.columnId);
      setActiveOverGroup(columnId === "backlog" ? "backlog" : columnId);
    }
  }, [getDateKeyFromGroupId]);

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveTask(null);
      setActiveOverGroup(null);

      if (!over) return;

      const taskId = String(active.id);
      const task = active.data.current?.task as Task | undefined;

      if (!task) return;

      const overId = String(over.id);

      // Get source dateKey from drag data
      const sourceDateKey = String(
        active.data.current?.columnId || task.scheduledDate || "backlog"
      );

      // Determine destination dateKey
      let destinationDateKey: string;
      let overTask: Task | undefined;

      // Check if dropped on a group or a task
      if (isGroupId(over.id)) {
        // Dropped on a group container - append to end
        const groupDateKey = getDateKeyFromGroupId(over.id);
        if (!groupDateKey) return;
        destinationDateKey = groupDateKey;
      } else {
        // Dropped on another task
        overTask = over.data.current?.task as Task | undefined;
        destinationDateKey = String(
          over.data.current?.columnId ?? overTask?.scheduledDate ?? "backlog"
        );
      }

      // Check if dateKey changed
      const dateKeyChanged = sourceDateKey !== destinationDateKey;
      const isSameTask = taskId === overId;

      // Do nothing if dropped on self in the same group
      if (isSameTask && !dateKeyChanged) {
        return;
      }

      // Get destination group's tasks from the grouped data
      const getDestinationTasks = (dateKey: string): Task[] => {
        if (dateKey === "backlog") {
          return groupedTasks.noDate;
        }
        if (dateKey === todayStr) {
          return groupedTasks.today;
        }
        if (dateKey === tomorrowStr) {
          return groupedTasks.tomorrow;
        }
        // Check if it's in overdue (could be any past date)
        const overdueTask = groupedTasks.overdue.find((t) => t.scheduledDate === dateKey);
        if (overdueTask) {
          return groupedTasks.overdue.filter((t) => t.scheduledDate === dateKey);
        }
        // Check future dates
        return groupedTasks.future.get(dateKey) || [];
      };

      // When dateKey changes, we need to move the task to the new group
      if (dateKeyChanged) {
        const destTasks = getDestinationTasks(destinationDateKey);

        // Build the new task order for the destination group
        // Filter to only pending tasks (not completed) and exclude the moving task
        const pendingDestTasks = destTasks
          .filter((t) => !t.completedAt && t.id !== taskId)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

        let newTaskIds: string[];

        if (overTask && overTask.id !== taskId && !isGroupId(over.id)) {
          // Dropped on a specific task - insert at that position
          const overIndex = pendingDestTasks.findIndex((t) => t.id === overTask.id);

          if (overIndex !== -1) {
            // Insert before the target task
            newTaskIds = [
              ...pendingDestTasks.slice(0, overIndex).map((t) => t.id),
              taskId,
              ...pendingDestTasks.slice(overIndex).map((t) => t.id),
            ];
          } else {
            // Target task not found in pending tasks, append to end
            newTaskIds = [...pendingDestTasks.map((t) => t.id), taskId];
          }
        } else {
          // Dropped on group background - append to end
          newTaskIds = [...pendingDestTasks.map((t) => t.id), taskId];
        }

        // Use reorderTasks which handles both moving and positioning
        reorderTasks.mutate(
          {
            date: destinationDateKey,
            taskIds: newTaskIds,
          }
        );

        return;
      }

      // Same group but different position - reorder within group
      if (!dateKeyChanged && overTask && !isSameTask) {
        const sourceTasks = getDestinationTasks(sourceDateKey);

        // Filter to only pending tasks (not completed) before sorting/reordering
        const pendingSourceTasks = sourceTasks
          .filter((t) => !t.completedAt)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

        if (pendingSourceTasks.length > 0) {
          // Find indices of active and over tasks in pending-only list
          const activeIndex = pendingSourceTasks.findIndex((t) => t.id === taskId);
          const overIndex = pendingSourceTasks.findIndex((t) => t.id === overId);

          if (
            activeIndex !== -1 &&
            overIndex !== -1 &&
            activeIndex !== overIndex
          ) {
            // Reorder using arrayMove
            const reorderedTasks = arrayMove(pendingSourceTasks, activeIndex, overIndex);
            const reorderedIds = reorderedTasks.map((t) => t.id);

            // Call reorder API
            const dateParam = sourceDateKey === "backlog" ? "backlog" : sourceDateKey;
            reorderTasks.mutate(
              {
                date: dateParam,
                taskIds: reorderedIds,
              }
            );
          }
        }
      }
    },
    [groupedTasks, todayStr, tomorrowStr, isGroupId, getDateKeyFromGroupId, reorderTasks]
  );

  const handleDragCancel = React.useCallback(() => {
    setActiveTask(null);
    setActiveOverGroup(null);
  }, []);

  // Get sorted future date keys
  const sortedFutureDates = React.useMemo(() => {
    return Array.from(groupedTasks.future.keys()).sort();
  }, [groupedTasks.future]);

  const handleComplete = async (task: Task) => {
    await completeTask.mutateAsync({ id: task.id, completed: !task.completedAt });
  };

  const totalTasks = tasks.length;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex h-[calc(100vh-3.5rem)] flex-col">
        {/* Compact toolbar */}
        <div className="flex items-center gap-3 border-b px-4 py-2">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full h-7 pl-8 pr-3 rounded-md border bg-background text-xs outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-muted/50">
            {(["active", "all", "completed"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded transition-colors capitalize cursor-pointer",
                  statusFilter === status
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Task count */}
          <span className="text-xs text-muted-foreground">{totalTasks} tasks</span>

          {/* New Task */}
          <Button onClick={() => setIsAddModalOpen(true)} size="sm" variant="default" className="h-7 gap-1 text-xs px-2.5">
            <Plus className="h-3.5 w-3.5" />
            New
          </Button>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-8 w-8 text-destructive/70 mb-3" />
              <p className="text-sm font-medium text-destructive">Failed to load tasks</p>
              <p className="text-xs text-muted-foreground mt-1">
                {error instanceof Error ? error.message : "Please try again"}
              </p>
              <button
                onClick={() => refetch()}
                className="text-xs text-muted-foreground hover:text-foreground mt-4 underline"
              >
                Retry
              </button>
            </div>
          ) : isLoading ? (
            <div className="space-y-2 py-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-border/60 bg-background/60 p-3"
                >
                  <div className="mb-2 h-4 w-28 animate-pulse rounded bg-muted" />
                  <div className="space-y-1">
                    <div className="h-8 animate-pulse rounded bg-muted/70" />
                    <div className="h-8 animate-pulse rounded bg-muted/70" />
                  </div>
                </div>
              ))}
            </div>
          ) : totalTasks === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-8 w-8 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No tasks found</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-1">
              {/* Overdue - group by date, but for reordering we'll use the first task's date */}
              {groupedTasks.overdue.length > 0 && (
                <TaskGroup
                  label="Overdue"
                  tasks={groupedTasks.overdue}
                  isOverdue
                  dateKey={groupedTasks.overdue[0]?.scheduledDate || "backlog"}
                  onSelectTask={setSelectedTask}
                  onCompleteTask={handleComplete}
                />
              )}

              {/* Today */}
              {groupedTasks.today.length > 0 && (
                <TaskGroup
                  label="Today"
                  tasks={groupedTasks.today}
                  dateKey={todayStr}
                  onSelectTask={setSelectedTask}
                  onCompleteTask={handleComplete}
                />
              )}

              {/* Tomorrow */}
              {groupedTasks.tomorrow.length > 0 && (
                <TaskGroup
                  label="Tomorrow"
                  tasks={groupedTasks.tomorrow}
                  dateKey={tomorrowStr}
                  onSelectTask={setSelectedTask}
                  onCompleteTask={handleComplete}
                />
              )}

              {/* Future dates */}
              {sortedFutureDates.map((dateStr) => (
                <TaskGroup
                  key={dateStr}
                  label={formatFutureDate(dateStr)}
                  tasks={groupedTasks.future.get(dateStr) || []}
                  dateKey={dateStr}
                  onSelectTask={setSelectedTask}
                  onCompleteTask={handleComplete}
                />
              ))}

              {/* No Date (Backlog) */}
              {groupedTasks.noDate.length > 0 && (
                <TaskGroup
                  label="No Date"
                  tasks={groupedTasks.noDate}
                  dateKey="backlog"
                  defaultExpanded={groupedTasks.noDate.length <= 10}
                  onSelectTask={setSelectedTask}
                  onCompleteTask={handleComplete}
                />
              )}
            </div>
          )}
        </div>

        {/* Keyboard shortcuts */}
        <TaskShortcutsHandler
          onNavigateToday={() => {}}
          onNavigateNext={() => {}}
          onNavigatePrevious={() => {}}
          onSelect={(task) => setSelectedTask(task)}
        />

        {/* Modals */}
        <TaskModal
          task={selectedTask}
          open={selectedTask !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedTask(null);
          }}
        />
        <AddTaskModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          scheduledDate={todayStr}
        />
      </div>

      {/* Drag Overlay */}
      <DragOverlay dropAnimation={null}>
        {activeTask && (
          <div className="opacity-90 bg-background rounded-md shadow-lg border">
            <TaskRow
              task={activeTask}
              onSelect={() => {}}
              onComplete={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
