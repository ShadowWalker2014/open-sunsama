import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Search, Loader2, Filter, Plus } from "lucide-react";
import type { Task, TaskPriority } from "@open-sunsama/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useSearchTasks } from "@/hooks/useSearchTasks";
import { useCompleteTask, useCreateTask } from "@/hooks/useTasks";
import { Kbd } from "@/components/ui/shortcuts-modal";
import { TaskSearchItem } from "./task-search-item";
import { PRIORITY_LABELS } from "@/components/ui/priority-badge";

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
  { id: "P0", label: PRIORITY_LABELS.P0, color: "text-red-500" },
  { id: "P1", label: PRIORITY_LABELS.P1, color: "text-orange-500" },
  { id: "P2", label: PRIORITY_LABELS.P2, color: "text-blue-500" },
  { id: "P3", label: PRIORITY_LABELS.P3, color: "text-gray-500" },
];

export function TaskSearchModal({ open, onOpenChange, onSelectTask }: TaskSearchModalProps) {
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = React.useState<PriorityFilter>("all");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [showFilters, setShowFilters] = React.useState(false);
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const completeTask = useCompleteTask();
  const createTask = useCreateTask();

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: tasks = [], isLoading } = useSearchTasks({
    query: debouncedQuery,
    status: statusFilter,
    priority: priorityFilter === "all" ? undefined : priorityFilter,
  });

  // Show create option when there's a query but no results
  const showCreateOption = tasks.length === 0 && debouncedQuery.trim().length > 0;
  // Total items includes create option if shown
  const totalItems = tasks.length + (showCreateOption ? 1 : 0);

  React.useEffect(() => { setSelectedIndex(0); }, [tasks, showCreateOption]);

  React.useEffect(() => {
    if (open) {
      setQuery(""); setStatusFilter("all"); setPriorityFilter("all"); setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const virtualizer = useVirtualizer({
    count: totalItems,
    getScrollElement: () => listRef.current,
    estimateSize: () => 44,
    overscan: 5,
  });

  const handleCreateTask = async () => {
    if (isCreating || !debouncedQuery.trim()) return;
    setIsCreating(true);
    try {
      const newTask = await createTask.mutateAsync({ 
        title: debouncedQuery.trim(),
        priority: "P2",
      });
      onSelectTask(newTask);
      onOpenChange(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown": 
        e.preventDefault(); 
        setSelectedIndex(i => Math.min(i + 1, totalItems - 1)); 
        break;
      case "ArrowUp": 
        e.preventDefault(); 
        setSelectedIndex(i => Math.max(i - 1, 0)); 
        break;
      case "Enter":
        e.preventDefault();
        // If create option is selected (last item when shown)
        if (showCreateOption && selectedIndex === tasks.length) {
          handleCreateTask();
        } else if (tasks[selectedIndex]) { 
          onSelectTask(tasks[selectedIndex]); 
          onOpenChange(false); 
        }
        break;
      case "Escape": 
        onOpenChange(false); 
        break;
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
        <div className="flex items-center gap-2.5 px-3 py-2.5 border-b">
          <Search className="h-4 w-4 text-muted-foreground/60 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks..."
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/60"
          />
          {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/60" />}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "p-1 rounded transition-colors",
              showFilters ? "bg-accent text-foreground" : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-accent/50"
            )}
          >
            <Filter className="h-3.5 w-3.5" />
          </button>
        </div>
        
        {/* Filters */}
        {showFilters && (
          <div className="flex items-center gap-3 px-3 py-1.5 border-b bg-muted/20">
            {/* Status Filter */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground/70 mr-0.5">Status</span>
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[11px] transition-colors",
                    statusFilter === filter.id
                      ? "bg-foreground/10 text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            
            <div className="w-px h-3 bg-border" />
            
            {/* Priority Filter */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground/70 mr-0.5">Priority</span>
              {PRIORITY_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setPriorityFilter(filter.id)}
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[11px] transition-colors",
                    priorityFilter === filter.id
                      ? "bg-foreground/10 text-foreground font-medium"
                      : cn("text-muted-foreground hover:text-foreground hover:bg-accent/50", filter.color)
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
          className="max-h-[360px] overflow-y-auto"
          style={{ contain: "strict" }}
        >
          {totalItems === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Search className="h-6 w-6 text-muted-foreground/40 mb-2" />
              <p className="text-[13px] text-muted-foreground">
                {query ? "No tasks found" : "Start typing to search"}
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
                const isCreateOption = showCreateOption && virtualItem.index === tasks.length;
                const isSelected = selectedIndex === virtualItem.index;
                
                if (isCreateOption) {
                  return (
                    <div
                      key="create-task"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      <button
                        onClick={handleCreateTask}
                        disabled={isCreating}
                        className={cn(
                          "flex items-center gap-2.5 px-3 h-[44px] w-full text-left transition-colors",
                          isSelected ? "bg-accent" : "hover:bg-accent/50"
                        )}
                      >
                        <div className="flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-[4px] bg-primary/10 text-primary">
                          <Plus className="h-3 w-3" strokeWidth={2} />
                        </div>
                        <span className="text-[13px] text-primary">
                          Create "{debouncedQuery.trim()}"
                        </span>
                        {isCreating && <Loader2 className="h-3 w-3 animate-spin ml-auto text-muted-foreground" />}
                      </button>
                    </div>
                  );
                }
                
                const task = tasks[virtualItem.index];
                if (!task) return null;
                
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
        <div className="flex items-center justify-between px-3 py-1.5 border-t bg-muted/20 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-0.5">
              <Kbd>↑↓</Kbd> navigate
            </span>
            <span className="flex items-center gap-0.5">
              <Kbd>↵</Kbd> {showCreateOption && selectedIndex === tasks.length ? "create" : "open"}
            </span>
            <span className="flex items-center gap-0.5">
              <Kbd>esc</Kbd> close
            </span>
          </div>
          <span>{tasks.length} {tasks.length === 1 ? "task" : "tasks"}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
