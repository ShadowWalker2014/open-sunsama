import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format, addDays, startOfWeek, isToday, isSameDay } from "date-fns";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
} from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";
import {
  Button,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { Sidebar } from "@/components/layout/sidebar";

/**
 * Main tasks/kanban view
 * Shows tasks organized by day in a horizontal scrolling view
 */
function TasksPage() {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [viewMode, setViewMode] = React.useState<"board" | "list">("board");

  // Calculate the week start (Monday)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  
  // Generate days for the current week view (7 days)
  const days = React.useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const goToPreviousWeek = () => {
    setCurrentDate((d) => addDays(d, -7));
  };

  const goToNextWeek = () => {
    setCurrentDate((d) => addDays(d, 7));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar - Backlog */}
      <Sidebar className="hidden lg:flex" />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Current Date Range */}
            <h2 className="text-lg font-semibold">
              {format(weekStart, "MMM d")} -{" "}
              {format(addDays(weekStart, 6), "MMM d, yyyy")}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as "board" | "list")}
            >
              <TabsList>
                <TabsTrigger value="board">
                  <LayoutGrid className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="list">
                  <List className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Add Task Button */}
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Days Grid */}
        <div className="flex flex-1 overflow-x-auto">
          {days.map((day) => (
            <DayColumn key={day.toISOString()} date={day} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface DayColumnProps {
  date: Date;
}

function DayColumn({ date }: DayColumnProps) {
  const dateString = format(date, "yyyy-MM-dd");
  const { data: tasks, isLoading } = useTasks({ scheduledDate: dateString });

  const pendingTasks = tasks?.filter((t) => !t.completedAt) ?? [];
  const completedTasks = tasks?.filter((t) => t.completedAt) ?? [];
  const today = isToday(date);

  return (
    <div
      className={cn(
        "flex min-w-[240px] flex-1 flex-col border-r last:border-r-0",
        today && "bg-accent/30"
      )}
    >
      {/* Day Header */}
      <div
        className={cn(
          "sticky top-0 z-10 border-b bg-background/95 px-3 py-2 backdrop-blur",
          today && "bg-accent/30"
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <p
              className={cn(
                "text-xs font-medium uppercase text-muted-foreground",
                today && "text-primary"
              )}
            >
              {format(date, "EEE")}
            </p>
            <p
              className={cn(
                "text-2xl font-bold",
                today && "text-primary"
              )}
            >
              {format(date, "d")}
            </p>
          </div>
          {pendingTasks.length > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
              {pendingTasks.length}
            </span>
          )}
        </div>
      </div>

      {/* Tasks */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : pendingTasks.length === 0 && completedTasks.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">No tasks</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Pending Tasks */}
            {pendingTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <>
                <div className="flex items-center gap-2 py-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">
                    Completed ({completedTasks.length})
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                {completedTasks.map((task) => (
                  <TaskCard key={task.id} task={task} completed />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    estimatedMins: number | null;
    notes: string | null;
  };
  completed?: boolean;
}

function TaskCard({ task, completed }: TaskCardProps) {
  return (
    <div
      className={cn(
        "group cursor-pointer rounded-lg border bg-card p-3 transition-all hover:border-primary/50 hover:shadow-sm",
        completed && "opacity-60"
      )}
    >
      <p
        className={cn(
          "text-sm font-medium",
          completed && "line-through"
        )}
      >
        {task.title}
      </p>
      {task.estimatedMins && (
        <p className="mt-1 text-xs text-muted-foreground">
          {task.estimatedMins}m estimated
        </p>
      )}
    </div>
  );
}

export const Route = createFileRoute("/app/")({
  component: TasksPage,
});
