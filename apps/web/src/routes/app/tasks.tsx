import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { 
  Search, Filter, Check,
  SortAsc, SortDesc, ChevronDown, Plus, MoreHorizontal,
  Trash2, CalendarPlus
} from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import type { Task, TaskPriority } from "@open-sunsama/types";
import { cn, formatDuration, stripHtmlTags } from "@/lib/utils";
import { useSearchTasks } from "@/hooks/useSearchTasks";
import { useCompleteTask, useDeleteTask, useMoveTask } from "@/hooks/useTasks";
import { TaskModal } from "@/components/kanban/task-modal";
import { AddTaskModal } from "@/components/kanban/add-task-modal";
import { 
  Button, 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui";

type StatusFilter = "all" | "active" | "completed";
type SortField = "title" | "priority" | "scheduledDate" | "createdAt";
type SortDirection = "asc" | "desc";

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  P0: "text-red-500 bg-red-500/10",
  P1: "text-orange-500 bg-orange-500/10",
  P2: "text-blue-500 bg-blue-500/10",
  P3: "text-gray-500 bg-gray-500/10",
};

export default function TasksListPage() {
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = React.useState<TaskPriority | "all">("all");
  const [sortField, setSortField] = React.useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("desc");
  
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  
  const listRef = React.useRef<HTMLDivElement>(null);
  
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();
  const moveTask = useMoveTask();
  
  // Debounced query
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(timer);
  }, [query]);
  
  // Fetch tasks
  const { data: tasks = [], isLoading } = useSearchTasks({
    query: debouncedQuery,
    status: statusFilter,
    priority: priorityFilter === "all" ? undefined : priorityFilter,
    limit: 500,
  });
  
  // Sort tasks client-side
  const sortedTasks = React.useMemo(() => {
    const sorted = [...tasks];
    sorted.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "priority":
          comparison = a.priority.localeCompare(b.priority);
          break;
        case "scheduledDate": {
          const dateA = a.scheduledDate || "9999-99-99";
          const dateB = b.scheduledDate || "9999-99-99";
          comparison = dateA.localeCompare(dateB);
          break;
        }
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [tasks, sortField, sortDirection]);
  
  // Virtualizer for performance
  const virtualizer = useVirtualizer({
    count: sortedTasks.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 56,
    overscan: 10,
  });
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  const handleComplete = async (task: Task) => {
    await completeTask.mutateAsync({ id: task.id, completed: !task.completedAt });
  };
  
  const handleDelete = async (task: Task) => {
    if (confirm(`Delete "${task.title}"?`)) {
      await deleteTask.mutateAsync(task.id);
    }
  };
  
  const handleMoveToToday = async (task: Task) => {
    const today = format(new Date(), "yyyy-MM-dd");
    await moveTask.mutateAsync({ id: task.id, targetDate: today });
  };
  
  const SortIcon = sortDirection === "asc" ? SortAsc : SortDesc;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold">All Tasks</h1>
          <p className="text-sm text-muted-foreground">{sortedTasks.length} tasks</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>
      
      {/* Filters Bar */}
      <div className="flex items-center gap-4 border-b px-6 py-3 bg-muted/30">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full h-9 pl-9 pr-4 rounded-md border bg-background text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        
        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              Status: {statusFilter === "all" ? "All" : statusFilter}
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>All</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("active")}>Active</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("completed")}>Completed</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Priority Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              Priority: {priorityFilter === "all" ? "All" : priorityFilter}
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setPriorityFilter("all")}>All</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setPriorityFilter("P0")}>
              <span className="text-red-500">P0</span> - Critical
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPriorityFilter("P1")}>
              <span className="text-orange-500">P1</span> - High
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPriorityFilter("P2")}>
              <span className="text-blue-500">P2</span> - Medium
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPriorityFilter("P3")}>
              <span className="text-gray-500">P3</span> - Low
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Column Headers */}
      <div className="flex items-center gap-4 px-6 py-2 border-b text-xs font-medium text-muted-foreground bg-muted/20">
        <div className="w-8" /> {/* Checkbox */}
        <button 
          onClick={() => handleSort("title")} 
          className="flex-1 flex items-center gap-1 hover:text-foreground"
        >
          Title {sortField === "title" && <SortIcon className="h-3 w-3" />}
        </button>
        <button 
          onClick={() => handleSort("priority")} 
          className="w-16 flex items-center gap-1 hover:text-foreground"
        >
          Priority {sortField === "priority" && <SortIcon className="h-3 w-3" />}
        </button>
        <button 
          onClick={() => handleSort("scheduledDate")} 
          className="w-24 flex items-center gap-1 hover:text-foreground"
        >
          Date {sortField === "scheduledDate" && <SortIcon className="h-3 w-3" />}
        </button>
        <div className="w-16">Duration</div>
        <div className="w-8" /> {/* Actions */}
      </div>
      
      {/* Task List */}
      <div ref={listRef} className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : sortedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-8 w-8 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No tasks found</p>
          </div>
        ) : (
          <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const task = sortedTasks[virtualItem.index];
              if (!task) return null;
              return (
                <TaskRow
                  key={task.id}
                  task={task}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  onSelect={() => setSelectedTask(task)}
                  onComplete={() => handleComplete(task)}
                  onDelete={() => handleDelete(task)}
                  onMoveToToday={() => handleMoveToToday(task)}
                />
              );
            })}
          </div>
        )}
      </div>
      
      {/* Modals */}
      <TaskModal
        task={selectedTask}
        open={selectedTask !== null}
        onOpenChange={(open) => { if (!open) setSelectedTask(null); }}
      />
      <AddTaskModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        scheduledDate={null}
      />
    </div>
  );
}

// Task row component
interface TaskRowProps {
  task: Task;
  style: React.CSSProperties;
  onSelect: () => void;
  onComplete: () => void;
  onDelete: () => void;
  onMoveToToday: () => void;
}

function TaskRow({ task, style, onSelect, onComplete, onDelete, onMoveToToday }: TaskRowProps) {
  const isCompleted = !!task.completedAt;
  
  const scheduleText = React.useMemo(() => {
    if (!task.scheduledDate) return "Backlog";
    const date = new Date(task.scheduledDate);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  }, [task.scheduledDate]);
  
  const isOverdue = task.scheduledDate && !isCompleted && isPast(new Date(task.scheduledDate + "T23:59:59"));

  return (
    <div
      style={style}
      className={cn(
        "flex items-center gap-4 px-6 py-2 border-b hover:bg-accent/50 cursor-pointer transition-colors",
        isCompleted && "opacity-60"
      )}
      onClick={onSelect}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onComplete(); }}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors cursor-pointer",
          isCompleted
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/50 hover:border-primary hover:bg-primary/10"
        )}
      >
        {isCompleted && <Check className="h-3 w-3" strokeWidth={3} />}
      </button>
      
      {/* Title */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium truncate", isCompleted && "line-through")}>
          {task.title}
        </p>
        {task.notes && (
          <p className="text-xs text-muted-foreground truncate">
            {stripHtmlTags(task.notes)}
          </p>
        )}
      </div>
      
      {/* Priority */}
      <span className={cn("w-16 text-xs font-medium px-2 py-0.5 rounded", PRIORITY_COLORS[task.priority])}>
        {task.priority}
      </span>
      
      {/* Date */}
      <span className={cn("w-24 text-xs", isOverdue && "text-red-500")}>
        {scheduleText}
      </span>
      
      {/* Duration */}
      <span className="w-16 text-xs text-muted-foreground">
        {task.estimatedMins ? formatDuration(task.estimatedMins) : "-"}
      </span>
      
      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMoveToToday(); }}>
            <CalendarPlus className="h-4 w-4 mr-2" />
            Move to Today
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
