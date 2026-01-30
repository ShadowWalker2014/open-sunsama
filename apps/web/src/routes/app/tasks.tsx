import * as React from "react";
import { Search, Plus, AlertCircle } from "lucide-react";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import type { Task } from "@open-sunsama/types";
import { useInfiniteSearchTasks } from "@/hooks/useInfiniteSearchTasks";
import { useCompleteTask } from "@/hooks/useTasks";
import { TaskModal } from "@/components/kanban/task-modal";
import { AddTaskModal } from "@/components/kanban/add-task-modal";
import { TaskGroup } from "@/components/tasks/task-group";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

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
    const isTaskOverdue =
      !task.completedAt && isPast(taskDate) && task.scheduledDate < todayStr;

    if (isTaskOverdue) {
      groups.overdue.push(task);
    } else if (isToday(taskDate)) {
      groups.today.push(task);
    } else if (isTomorrow(taskDate)) {
      groups.tomorrow.push(task);
    } else if (task.scheduledDate > todayStr) {
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
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const completeTask = useCompleteTask();

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading, isError, error, refetch } = useInfiniteSearchTasks({
    query: debouncedQuery,
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

  // Get sorted future date keys
  const sortedFutureDates = React.useMemo(() => {
    return Array.from(groupedTasks.future.keys()).sort();
  }, [groupedTasks.future]);

  const handleComplete = async (task: Task) => {
    await completeTask.mutateAsync({ id: task.id, completed: !task.completedAt });
  };

  const totalTasks = tasks.length;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold">Tasks</h1>
          <p className="text-sm text-muted-foreground">{totalTasks} tasks</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4 border-b px-6 py-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full h-8 pl-9 pr-4 rounded-md border bg-background text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
          {(["active", "all", "completed"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-3 py-1 text-sm font-medium rounded-md transition-colors capitalize",
                statusFilter === status
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {status}
            </button>
          ))}
        </div>
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
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : totalTasks === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-8 w-8 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No tasks found</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-1">
            {/* Overdue */}
            <TaskGroup
              label="Overdue"
              tasks={groupedTasks.overdue}
              isOverdue
              onSelectTask={setSelectedTask}
              onCompleteTask={handleComplete}
            />

            {/* Today */}
            <TaskGroup
              label="Today"
              tasks={groupedTasks.today}
              onSelectTask={setSelectedTask}
              onCompleteTask={handleComplete}
            />

            {/* Tomorrow */}
            <TaskGroup
              label="Tomorrow"
              tasks={groupedTasks.tomorrow}
              onSelectTask={setSelectedTask}
              onCompleteTask={handleComplete}
            />

            {/* Future dates */}
            {sortedFutureDates.map((dateStr) => (
              <TaskGroup
                key={dateStr}
                label={formatFutureDate(dateStr)}
                tasks={groupedTasks.future.get(dateStr) || []}
                onSelectTask={setSelectedTask}
                onCompleteTask={handleComplete}
              />
            ))}

            {/* No Date (Backlog) */}
            <TaskGroup
              label="No Date"
              tasks={groupedTasks.noDate}
              defaultExpanded={groupedTasks.noDate.length <= 10}
              onSelectTask={setSelectedTask}
              onCompleteTask={handleComplete}
            />
          </div>
        )}
      </div>

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
        scheduledDate={null}
      />
    </div>
  );
}
