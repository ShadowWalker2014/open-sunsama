import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Search, Loader2, Filter } from "lucide-react";
import type { Task, TaskPriority } from "@open-sunsama/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useSearchTasks } from "@/hooks/useSearchTasks";
import { useCompleteTask } from "@/hooks/useTasks";
import { Kbd } from "@/components/ui/shortcuts-modal";
import { TaskSearchItem } from "./task-search-item";

interface TaskSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTask: (task: Task) => void;
}

type StatusFilter = "all" | "active" | "completed";
type PriorityFilter = TaskPriority | "all";

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
];

const PRIORITY_FILTERS: { id: PriorityFilter; label: string; color: string }[] = [
  { id: "all", label: "Any", color: "" },
  { id: "P0", label: "P0", color: "text-red-500" },
  { id: "P1", label: "P1", color: "text-orange-500" },
  { id: "P2", label: "P2", color: "text-blue-500" },
  { id: "P3", label: "P3", color: "text-gray-500" },
];

export function TaskSearchModal({ open, onOpenChange, onSelectTask }: TaskSearchModalProps) {
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = React.useState<PriorityFilter>("all");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [showFilters, setShowFilters] = React.useState(false);
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const completeTask = useCompleteTask();

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: tasks = [], isLoading } = useSearchTasks({
    query: debouncedQuery,
    status: statusFilter,
    priority: priorityFilter === "all" ? undefined : priorityFilter,
  });

  React.useEffect(() => { setSelectedIndex(0); }, [tasks]);

  React.useEffect(() => {
    if (open) {
      setQuery(""); setStatusFilter("all"); setPriorityFilter("all"); setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 64,
    overscan: 5,
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, tasks.length - 1)); break;
      case "ArrowUp": e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); break;
      case "Enter":
        e.preventDefault();
        if (tasks[selectedIndex]) { onSelectTask(tasks[selectedIndex]); onOpenChange(false); }
        break;
      case "Escape": onOpenChange(false); break;
    }
  };

  React.useEffect(() => { virtualizer.scrollToIndex(selectedIndex, { align: "auto" }); }, [selectedIndex, virtualizer]);

  const handleComplete = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    await completeTask.mutateAsync({ id: task.id, completed: !task.completedAt });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "p-1 rounded hover:bg-accent transition-colors",
              showFilters && "bg-accent"
            )}
          >
            <Filter className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        
        {/* Filters */}
        {showFilters && (
          <div className="flex items-center gap-4 px-4 py-2 border-b bg-muted/30">
            {/* Status Filter */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground mr-1">Status:</span>
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium transition-colors",
                    statusFilter === filter.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            
            {/* Priority Filter */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground mr-1">Priority:</span>
              {PRIORITY_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setPriorityFilter(filter.id)}
                  className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium transition-colors",
                    filter.color,
                    priorityFilter === filter.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Results */}
        <div
          ref={listRef}
          className="max-h-[400px] overflow-y-auto"
          style={{ contain: "strict" }}
        >
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-8 w-8 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                {query ? "No tasks found" : "Start typing to search tasks"}
              </p>
            </div>
          ) : (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const task = tasks[virtualItem.index];
                if (!task) return null;
                
                const isSelected = selectedIndex === virtualItem.index;
                const isCompleted = !!task.completedAt;
                
                return (
                  <div
                    key={task.id}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <TaskSearchItem
                      task={task}
                      isSelected={isSelected}
                      isCompleted={isCompleted}
                      onClick={() => {
                        onSelectTask(task);
                        onOpenChange(false);
                      }}
                      onComplete={(e) => handleComplete(e, task)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Kbd>↑</Kbd><Kbd>↓</Kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <Kbd>↵</Kbd> open
            </span>
            <span className="flex items-center gap-1">
              <Kbd>esc</Kbd> close
            </span>
          </div>
          <span>{tasks.length} tasks</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
