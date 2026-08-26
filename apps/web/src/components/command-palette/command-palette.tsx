import * as React from "react";
import {
  Search,
  Loader2,
  Sparkles,
  CheckSquare,
  Lightbulb,
  CalendarDays,
} from "lucide-react";
import { format, isSameDay, isToday, isTomorrow } from "date-fns";
import { useNavigate } from "@tanstack/react-router";
import type { Task } from "@open-sunsama/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useSearchTasks } from "@/hooks/useSearchTasks";
import { useSearchIdeas } from "@/hooks/useSearchIdeas";
import { useSearchEvents } from "@/hooks/useSearchEvents";
import { useCreateTask } from "@/hooks/useTasks";
import { Kbd } from "@/components/ui/kbd";
import { COMMANDS } from "./commands";
import { TASK_COMMANDS } from "./task-commands";
import { MCP_COMMANDS } from "./mcp-commands";
import { getContextualCommands, isMcpQuery } from "./get-contextual-commands";
import { CommandItem } from "./command-item";
import { ResultItem } from "./result-item";
import { CreateTaskItem } from "./create-task-item";
import { useCommandContext } from "./use-command-context";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTask: (task: Task) => void;
  onAddTask: () => void;
}

export function CommandPalette({ open, onOpenChange, onSelectTask, onAddTask }: CommandPaletteProps) {
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const createTask = useCreateTask();
  const navigate = useNavigate();
  const commandContext = useCommandContext({ 
    onAddTask, 
    closeSearch: () => onOpenChange(false) 
  });

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(timer);
  }, [query]);

  // Combine all commands
  const allCommands = React.useMemo(() => [
    ...TASK_COMMANDS,
    ...MCP_COMMANDS,
    ...COMMANDS,
  ], []);

  // Use contextual filtering instead of simple filterCommands
  const filteredCommands = React.useMemo(
    () => getContextualCommands(allCommands, commandContext, query),
    [allCommands, commandContext, query]
  );

  const SEARCH_LIMIT = 100;
  /** Rows rendered per section before the rest are summarised as "+N more". */
  const SECTION_LIMIT = 5;

  const { data: tasks = [], isLoading: isSearchingTasks } = useSearchTasks({
    query: debouncedQuery,
    status: "all",
    limit: SEARCH_LIMIT,
  });
  const ideaResults = useSearchIdeas(debouncedQuery, SEARCH_LIMIT);
  const eventResults = useSearchEvents(debouncedQuery, SEARCH_LIMIT);

  const isSearching = debouncedQuery.trim().length > 0;
  const noResults =
    isSearching &&
    tasks.length === 0 &&
    ideaResults.length === 0 &&
    eventResults.length === 0;
  const showCreateOption = noResults && debouncedQuery.trim().length > 2;

  const commandItems = filteredCommands;
  // Each section shows a handful of rows and reports the rest, so one busy
  // section can never bury the others below the fold.
  const taskItems = isSearching ? tasks.slice(0, SECTION_LIMIT) : [];
  const ideaItems = isSearching ? ideaResults.slice(0, SECTION_LIMIT) : [];
  const eventItems = isSearching ? eventResults.slice(0, SECTION_LIMIT) : [];

  const taskOffset = commandItems.length;
  const ideaOffset = taskOffset + taskItems.length;
  const eventOffset = ideaOffset + ideaItems.length;
  const totalItems =
    eventOffset + eventItems.length + (showCreateOption ? 1 : 0);

  React.useEffect(
    () => setSelectedIndex(0),
    [
      commandItems.length,
      taskItems.length,
      ideaItems.length,
      eventItems.length,
      showCreateOption,
    ]
  );
  React.useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const handleCreateTask = async () => {
    if (isCreating || !debouncedQuery.trim()) return;
    setIsCreating(true);
    try {
      const newTask = await createTask.mutateAsync({ 
        title: debouncedQuery.trim(), 
        priority: "P2",
        scheduledDate: format(new Date(), "yyyy-MM-dd"),
      });
      onSelectTask(newTask);
      onOpenChange(false);
    } finally {
      setIsCreating(false);
    }
  };

  const openIdea = (boardId: string, ideaId: string) => {
    // The ideas page restores its last board from localStorage; set it so the
    // right board is active even before the search param is read.
    try {
      localStorage.setItem("open-sunsama-ideas-active-board", boardId);
    } catch {
      // private mode / storage disabled — the search param still works
    }
    onOpenChange(false);
    navigate({ to: "/app/ideas", search: { board: boardId, idea: ideaId } });
  };

  const openEvent = (startTime: string) => {
    onOpenChange(false);
    navigate({
      to: "/app/calendar",
      search: { date: format(new Date(startTime), "yyyy-MM-dd") },
    });
  };

  const executeItem = (index: number) => {
    if (index < taskOffset) {
      commandItems[index]?.action(commandContext);
      return;
    }
    if (index < ideaOffset) {
      const task = taskItems[index - taskOffset];
      if (task) {
        onSelectTask(task);
        onOpenChange(false);
      }
      return;
    }
    if (index < eventOffset) {
      const result = ideaItems[index - ideaOffset];
      if (result) openIdea(result.idea.boardId, result.idea.id);
      return;
    }
    if (index < eventOffset + eventItems.length) {
      const event = eventItems[index - eventOffset];
      if (event) openEvent(event.startTime);
      return;
    }
    if (showCreateOption) handleCreateTask();
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
        if (totalItems > 0) executeItem(selectedIndex);
        break;
      case "Escape":
        onOpenChange(false);
        break;
    }
  };

  React.useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector('[data-selected="true"]');
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const { hoveredTask } = commandContext;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
        <div className="flex items-center gap-2.5 px-3 py-2.5 border-b">
          <Search className="h-4 w-4 text-muted-foreground/60 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks, ideas, events — or run a command…"
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/60"
          />
          {isSearchingTasks && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/60" />}
        </div>

        {/* Sections can stack (commands + tasks + ideas + events), so the list
            scrolls within a viewport-bounded height rather than growing the
            dialog past the fold. */}
        <div
          ref={listRef}
          className="max-h-[min(60vh,420px)] overflow-y-auto overscroll-contain"
        >
          {totalItems === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Search className="h-6 w-6 text-muted-foreground/40 mb-2" />
              <p className="text-[13px] text-muted-foreground">
                No tasks, ideas or events match “{debouncedQuery.trim()}”
              </p>
            </div>
          ) : (
            <div className="py-1">
              {commandItems.length > 0 && (
                <>
                  {/* Task context indicator */}
                  {hoveredTask && !query.trim() && (
                    <div className="px-3 py-1.5 text-[11px] text-muted-foreground border-b bg-muted/30 flex items-center gap-1.5">
                      <span className="text-foreground/80 truncate max-w-[300px]">
                        "{hoveredTask.title}"
                      </span>
                    </div>
                  )}
                  
                  {/* Section header */}
                  <div className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                    {!query.trim() ? (
                      <>
                        <Sparkles className="h-3 w-3" />
                        Suggested
                      </>
                    ) : isMcpQuery(query) ? (
                      "AI Setup"
                    ) : (
                      "Commands"
                    )}
                  </div>
                  {commandItems.map((cmd, index) => (
                    <CommandItem
                      key={cmd.id}
                      command={cmd}
                      isSelected={selectedIndex === index}
                      onClick={() => executeItem(index)}
                    />
                  ))}
                </>
              )}
              {taskItems.length > 0 && (
                <>
                  <SectionHeader
                    label="Tasks"
                    shown={taskItems.length}
                    total={tasks.length}
                  />
                  {taskItems.map((task, index) => (
                    <ResultItem
                      key={task.id}
                      icon={<CheckSquare className="h-4 w-4" />}
                      title={task.title}
                      meta={formatTaskDate(task.scheduledDate)}
                      strikethrough={!!task.completedAt}
                      isSelected={selectedIndex === taskOffset + index}
                      onClick={() => {
                        onSelectTask(task);
                        onOpenChange(false);
                      }}
                    />
                  ))}
                </>
              )}
              {ideaItems.length > 0 && (
                <>
                  <SectionHeader
                    label="Ideas"
                    shown={ideaItems.length}
                    total={ideaResults.length}
                  />
                  {ideaItems.map(({ idea, board }, index) => (
                    <ResultItem
                      key={idea.id}
                      icon={<Lightbulb className="h-4 w-4" />}
                      title={idea.title}
                      subtitle={board?.name}
                      strikethrough={!!idea.completedAt}
                      isSelected={selectedIndex === ideaOffset + index}
                      onClick={() => openIdea(idea.boardId, idea.id)}
                    />
                  ))}
                </>
              )}
              {eventItems.length > 0 && (
                <>
                  <SectionHeader
                    label="Events"
                    shown={eventItems.length}
                    total={eventResults.length}
                  />
                  {eventItems.map((event, index) => (
                    <ResultItem
                      key={event.id}
                      icon={<CalendarDays className="h-4 w-4" />}
                      title={event.title}
                      subtitle={eventSubtitle(event)}
                      meta={formatEventWhen(event.startTime, event.isAllDay)}
                      isSelected={selectedIndex === eventOffset + index}
                      onClick={() => openEvent(event.startTime)}
                    />
                  ))}
                </>
              )}
              {showCreateOption && (
                <CreateTaskItem
                  query={debouncedQuery.trim()}
                  isSelected={selectedIndex === totalItems - 1}
                  isCreating={isCreating}
                  onClick={handleCreateTask}
                />
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-3 py-1.5 border-t bg-muted/20 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-0.5"><Kbd>↑↓</Kbd> navigate</span>
            <span className="flex items-center gap-0.5"><Kbd>↵</Kbd> select</span>
            <span className="flex items-center gap-0.5"><Kbd>esc</Kbd> close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Section heading with a "showing X of Y" count on the right. */
function SectionHeader({
  label,
  shown,
  total,
}: {
  label: string;
  shown: number;
  total: number;
}) {
  return (
    <div className="mt-1 flex items-center justify-between px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
      <span>{label}</span>
      <span className="font-normal normal-case tracking-normal">
        {total > shown ? `${shown} of ${total}` : `${total}`}
      </span>
    </div>
  );
}

/** Today / Tomorrow / "Mar 3" / Backlog, for a task's scheduled date. */
function formatTaskDate(scheduledDate: string | null | undefined) {
  if (!scheduledDate) return "Backlog";
  const date = new Date(`${scheduledDate}T00:00:00`);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "MMM d");
}

/** "2:30 pm" for events today, otherwise "Mar 3" (or "Mar 3" for all-day). */
function formatEventWhen(startTime: string, isAllDay: boolean) {
  const start = new Date(startTime);
  if (isAllDay) return format(start, "MMM d");
  if (isSameDay(start, new Date())) return format(start, "h:mm a").toLowerCase();
  return format(start, "MMM d");
}

/**
 * Context for an event row: the calendar it lives on, or its location when
 * that's a place rather than a conferencing URL (raw Zoom/Meet links are long
 * and identical across rows, so they'd crowd out the title).
 */
function eventSubtitle(event: {
  location: string | null;
  calendar?: { name: string } | null;
}) {
  if (event.calendar?.name) return event.calendar.name;
  const location = event.location?.trim();
  if (!location || /^https?:\/\//i.test(location)) return null;
  return location;
}
