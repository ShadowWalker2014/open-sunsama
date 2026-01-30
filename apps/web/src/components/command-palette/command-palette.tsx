import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Search,
  Loader2,
  Plus,
  LayoutDashboard,
  Calendar,
  Settings,
  Key,
  Keyboard,
  Sun,
  Moon,
  Monitor,
  CheckSquare,
} from "lucide-react";
import type { Task } from "@open-sunsama/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useSearchTasks } from "@/hooks/useSearchTasks";
import { useCreateTask } from "@/hooks/useTasks";
import { useTheme } from "@/hooks/useTheme";
import { useShortcutsModal } from "@/hooks/useKeyboardShortcuts";
import { Kbd } from "@/components/ui/shortcuts-modal";
import {
  COMMANDS,
  filterCommands,
  type CommandContext,
} from "./commands";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTask: (task: Task) => void;
  onAddTask: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Calendar,
  Settings,
  Key,
  Plus,
  Keyboard,
  Sun,
  Moon,
  Monitor,
  CheckSquare,
};

export function CommandPalette({
  open,
  onOpenChange,
  onSelectTask,
  onAddTask,
}: CommandPaletteProps) {
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const { themeMode, setThemeMode } = useTheme();
  const { setShowShortcutsModal } = useShortcutsModal();
  const createTask = useCreateTask();

  // Debounce for task search
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(timer);
  }, [query]);

  // Filter commands locally (instant)
  const filteredCommands = React.useMemo(
    () => filterCommands(COMMANDS, query),
    [query]
  );

  // Search tasks via API (debounced)
  const { data: tasks = [], isLoading: isSearchingTasks } = useSearchTasks({
    query: debouncedQuery,
    status: "all",
  });

  // Only show tasks when there's a query
  const showTasks = debouncedQuery.trim().length > 0;
  const showCreateOption =
    showTasks && tasks.length === 0 && debouncedQuery.trim().length > 2;

  // Combined items: commands first, then tasks
  const commandItems = filteredCommands;
  const taskItems = showTasks ? tasks : [];
  const totalItems =
    commandItems.length + taskItems.length + (showCreateOption ? 1 : 0);

  // Reset selection when items change
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [commandItems.length, taskItems.length, showCreateOption]);

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Command context for executing commands
  const commandContext: CommandContext = React.useMemo(
    () => ({
      navigate,
      setThemeMode,
      currentThemeMode: themeMode,
      openAddTask: onAddTask,
      openShortcuts: () => setShowShortcutsModal(true),
      closeSearch: () => onOpenChange(false),
    }),
    [navigate, setThemeMode, themeMode, onAddTask, setShowShortcutsModal, onOpenChange]
  );

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

  const executeItem = (index: number) => {
    if (index < commandItems.length) {
      // It's a command
      const cmd = commandItems[index];
      if (cmd) {
        cmd.action(commandContext);
      }
    } else if (index < commandItems.length + taskItems.length) {
      // It's a task
      const taskIndex = index - commandItems.length;
      const task = taskItems[taskIndex];
      if (task) {
        onSelectTask(task);
        onOpenChange(false);
      }
    } else if (showCreateOption) {
      // It's the create option
      handleCreateTask();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, totalItems - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (totalItems > 0) {
          executeItem(selectedIndex);
        }
        break;
      case "Escape":
        onOpenChange(false);
        break;
    }
  };

  // Scroll selected item into view
  React.useEffect(() => {
    if (!listRef.current) return;
    const selectedElement = listRef.current.querySelector('[data-selected="true"]');
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 border-b">
          <Search className="h-4 w-4 text-muted-foreground/60 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search tasks..."
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/60"
          />
          {isSearchingTasks && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/60" />
          )}
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="max-h-[360px] overflow-y-auto"
        >
          {totalItems === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Search className="h-6 w-6 text-muted-foreground/40 mb-2" />
              <p className="text-[13px] text-muted-foreground">
                No results found
              </p>
            </div>
          ) : (
            <div className="py-1">
              {/* Commands section */}
              {commandItems.length > 0 && (
                <>
                  <div className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                    Commands
                  </div>
                  {commandItems.map((cmd, index) => {
                    const Icon = ICON_MAP[cmd.icon] || Settings;
                    const isSelected = selectedIndex === index;
                    return (
                      <button
                        key={cmd.id}
                        data-selected={isSelected}
                        onClick={() => executeItem(index)}
                        className={cn(
                          "flex items-center gap-3 px-3 h-[40px] w-full text-left transition-colors cursor-pointer",
                          isSelected ? "bg-accent" : "hover:bg-accent/50"
                        )}
                      >
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-[13px] flex-1 truncate">
                          {cmd.title}
                        </span>
                        {cmd.shortcut && (
                          <Kbd className="text-[10px]">{cmd.shortcut}</Kbd>
                        )}
                      </button>
                    );
                  })}
                </>
              )}

              {/* Tasks section */}
              {taskItems.length > 0 && (
                <>
                  <div className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider mt-1">
                    Tasks
                  </div>
                  {taskItems.map((task, index) => {
                    const globalIndex = commandItems.length + index;
                    const isSelected = selectedIndex === globalIndex;
                    const isCompleted = !!task.completedAt;
                    return (
                      <button
                        key={task.id}
                        data-selected={isSelected}
                        onClick={() => {
                          onSelectTask(task);
                          onOpenChange(false);
                        }}
                        className={cn(
                          "flex items-center gap-3 px-3 h-[40px] w-full text-left transition-colors cursor-pointer",
                          isSelected ? "bg-accent" : "hover:bg-accent/50"
                        )}
                      >
                        <CheckSquare
                          className={cn(
                            "h-4 w-4 shrink-0",
                            isCompleted
                              ? "text-green-500"
                              : "text-muted-foreground"
                          )}
                        />
                        <span
                          className={cn(
                            "text-[13px] flex-1 truncate",
                            isCompleted && "line-through text-muted-foreground"
                          )}
                        >
                          {task.title}
                        </span>
                      </button>
                    );
                  })}
                </>
              )}

              {/* Create option */}
              {showCreateOption && (
                <button
                  data-selected={selectedIndex === totalItems - 1}
                  onClick={handleCreateTask}
                  disabled={isCreating}
                  className={cn(
                    "flex items-center gap-3 px-3 h-[40px] w-full text-left transition-colors cursor-pointer mt-1",
                    selectedIndex === totalItems - 1
                      ? "bg-accent"
                      : "hover:bg-accent/50"
                  )}
                >
                  <Plus className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-[13px] text-primary flex-1">
                    Create "{debouncedQuery.trim()}"
                  </span>
                  {isCreating && <Loader2 className="h-3 w-3 animate-spin" />}
                </button>
              )}
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
              <Kbd>↵</Kbd> select
            </span>
            <span className="flex items-center gap-0.5">
              <Kbd>esc</Kbd> close
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
