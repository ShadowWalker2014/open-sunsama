import * as React from "react";
import { Plus, Inbox, Eraser, PanelLeftClose, PanelLeftOpen, Pin } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@open-sunsama/types";
import { useTasks, useCompleteTask } from "@/hooks/useTasks";
import { TaskCardContent } from "@/components/kanban/task-card-content";
import { TaskContextMenu } from "@/components/kanban/task-context-menu";
import { useTasksDnd } from "@/lib/dnd/tasks-dnd-context";
import { cn } from "@/lib/utils";
import { Button, ScrollArea, Skeleton } from "@/components/ui";
import { AddTaskModal } from "@/components/kanban/add-task-modal.lazy";
import { TaskModal } from "@/components/kanban/task-modal.lazy";
import { CleanUpBacklogModal } from "@/components/backlog/clean-up-backlog-modal";
import { useBacklogPeek } from "./use-backlog-peek";

const BACKLOG_PINNED_KEY = "open-sunsama-backlog-pinned";

function readPinned(): boolean {
  try {
    return localStorage.getItem(BACKLOG_PINNED_KEY) === "true";
  } catch {
    return false;
  }
}

interface SidebarProps {
  className?: string;
}

/**
 * Linear-style sidebar showing the task backlog (tasks without a date).
 *
 * Collapsed to a thin rail by default. Hovering the rail opens the backlog as
 * an overlay above the board (a "peek"), and the pin button docks it open.
 */
export function Sidebar({ className }: SidebarProps) {
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isCleanupOpen, setIsCleanupOpen] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [isPinned, setIsPinned] = React.useState(readPinned);
  const panelRef = React.useRef<HTMLElement>(null);

  const peek = useBacklogPeek({
    panelRef,
    enabled: !isPinned,
    locked: isAddModalOpen || isCleanupOpen || selectedTask !== null,
  });
  const isExpanded = isPinned || peek.open;

  // Use high limit to ensure we get all backlog tasks (API default is 50)
  const BACKLOG_LIMIT = 500;
  const { data: tasks, isLoading } = useTasks({
    backlog: true,
    limit: BACKLOG_LIMIT,
  });
  const { activeTask, isDragging } = useTasksDnd();

  // If we hit exactly the limit, there may be more tasks than shown
  const maybeTruncated = (tasks?.length ?? 0) >= BACKLOG_LIMIT;

  // Make backlog a drop target for unscheduling tasks
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: "backlog",
    data: {
      type: "column",
      date: null, // null = unscheduled/backlog
    },
  });

  const setPanelRef = React.useCallback(
    (node: HTMLElement | null) => {
      panelRef.current = node;
      setDroppableRef(node);
    },
    [setDroppableRef]
  );

  // Separate pending and completed tasks
  // CRITICAL: Preserve the actively dragged task to prevent removeChild DOM errors
  const { pendingTasks, completedTasks } = React.useMemo(() => {
    const all = tasks ?? [];
    let pending = all
      .filter((task) => !task.completedAt)
      .sort((a, b) => a.position - b.position);
    const completed = all.filter((task) => task.completedAt);

    // If dragging a backlog task, ensure it stays in the list
    if (isDragging && activeTask && activeTask.scheduledDate === null) {
      const isIncluded = pending.some((t) => t.id === activeTask.id);
      if (!isIncluded) {
        pending = [...pending, activeTask];
      }
    }

    return { pendingTasks: pending, completedTasks: completed };
  }, [tasks, isDragging, activeTask]);

  const setPinned = React.useCallback(
    (pinned: boolean) => {
      setIsPinned(pinned);
      try {
        localStorage.setItem(BACKLOG_PINNED_KEY, String(pinned));
      } catch {
        // Storage unavailable; the choice lasts for this session only.
      }
      // Collapsing leaves the pointer over the rail; don't re-open until it leaves.
      if (!pinned) peek.dismiss();
    },
    [peek.dismiss]
  );

  return (
    // Reserves the rail's width in the layout (or the full width when pinned);
    // the panel itself overlays the board while peeking.
    <div
      className={cn(
        "relative h-full flex-shrink-0 transition-[width] duration-200 ease-out",
        isPinned ? "w-60" : "w-9",
        className
      )}
    >
      <aside
        ref={setPanelRef}
        aria-label="Backlog"
        {...peek.panelHandlers}
        className={cn(
          "absolute inset-y-0 left-0 z-30 flex overflow-hidden border-r border-border/40 bg-background",
          // Instant while dragging so drop targets are measured where they are.
          !peek.dragging && "transition-[width,box-shadow] duration-200 ease-out",
          isExpanded ? "w-60" : "w-9",
          peek.open && "shadow-[8px_0_24px_-12px_rgb(0_0_0/0.25)] dark:shadow-[8px_0_24px_-12px_rgb(0_0_0/0.7)]",
          isOver && "border-primary/30"
        )}
      >
        {/* Drop feedback when a task is dragged over the backlog */}
        {isOver && <div className="pointer-events-none absolute inset-0 z-10 bg-primary/5" />}

        {/* Collapsed rail */}
        <div
          inert={isExpanded}
          aria-hidden={isExpanded}
          className={cn(
            "absolute inset-y-0 left-0 flex w-9 flex-col items-center py-2 transition-opacity duration-150",
            isExpanded ? "pointer-events-none opacity-0" : "opacity-100"
          )}
        >
          <Button
            variant="ghost"
            size="icon-xs"
            className="h-6 w-6"
            onClick={() => setPinned(true)}
            title="Show backlog"
            aria-label="Show backlog"
            aria-expanded={false}
          >
            <PanelLeftOpen className="h-3.5 w-3.5" />
          </Button>
          <div className="mt-2 flex flex-col items-center gap-1">
            <Inbox className="h-3.5 w-3.5 text-muted-foreground" />
            {pendingTasks.length > 0 && (
              <span className="text-[10px] text-muted-foreground">{pendingTasks.length}</span>
            )}
          </div>
        </div>

        {/* Panel: fixed width, revealed as the aside widens, so nothing reflows. */}
        <div
          inert={!isExpanded}
          aria-hidden={!isExpanded}
          className={cn(
            "flex w-60 flex-shrink-0 flex-col transition-opacity duration-150",
            isExpanded ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <Inbox className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[13px] font-medium">Backlog</span>
              {pendingTasks.length > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  {pendingTasks.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              {pendingTasks.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="h-6 w-6"
                  onClick={() => setIsCleanupOpen(true)}
                  title="Clean up backlog"
                >
                  <Eraser className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-xs"
                className="h-6 w-6"
                onClick={() => setIsAddModalOpen(true)}
                title="Add task"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
              {isPinned ? (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="h-6 w-6"
                  onClick={() => setPinned(false)}
                  title="Collapse backlog"
                  aria-label="Collapse backlog"
                >
                  <PanelLeftClose className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="h-6 w-6"
                  onClick={() => setPinned(true)}
                  title="Keep backlog open"
                  aria-label="Keep backlog open"
                >
                  <Pin className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Task List */}
          <ScrollArea className="flex-1">
            <div className="p-1.5 space-y-0.5">
              {isLoading ? (
                <div className="space-y-1 p-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full rounded" />
                  ))}
                </div>
              ) : pendingTasks.length === 0 && completedTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    No unscheduled tasks
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Tasks without a date appear here
                  </p>
                </div>
              ) : (
                <>
                  {/* Pending Tasks. Hidden rows keep their layout, so they stop
                      being drop targets while the panel is closed. */}
                  <SortableContext
                    items={pendingTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                    disabled={{ draggable: false, droppable: !isExpanded }}
                  >
                    {pendingTasks.map((task) => (
                      <SortableBacklogTaskCard
                        key={task.id}
                        task={task}
                        onSelect={() => setSelectedTask(task)}
                      />
                    ))}
                  </SortableContext>

                  {/* Empty pending state when there are only completed tasks */}
                  {pendingTasks.length === 0 && completedTasks.length > 0 && (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        All tasks completed!
                      </p>
                    </div>
                  )}

                  {/* Completed Tasks in Backlog */}
                  {completedTasks.length > 0 && (
                    <div className="pt-3 mt-3 border-t border-border/40">
                      <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                        Completed ({completedTasks.length})
                      </p>
                      <div className="space-y-1">
                        {completedTasks.map((task) => (
                          <BacklogTaskCard
                            key={task.id}
                            task={task}
                            onSelect={() => setSelectedTask(task)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Truncation warning */}
                  {maybeTruncated && (
                    <div className="pt-3 mt-3 border-t border-border/40 px-2 text-center">
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Showing first {BACKLOG_LIMIT} tasks. Some tasks may be
                        hidden.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </aside>

      {/* Add Task Modal */}
      <AddTaskModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        scheduledDate={null}
      />

      {/* Clean up Backlog Modal */}
      <CleanUpBacklogModal
        open={isCleanupOpen}
        onOpenChange={setIsCleanupOpen}
      />

      {/* Task Detail Modal */}
      <TaskModal
        task={selectedTask}
        open={selectedTask !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null);
        }}
      />
    </div>
  );
}

interface SortableBacklogTaskCardProps {
  task: Task;
  onSelect: () => void;
}

/**
 * Sortable backlog task card that supports:
 * - Reordering within the backlog (drag to reorder)
 * - Dragging to kanban day columns (to schedule)
 * - Dragging to calendar view (to create time blocks)
 */
function SortableBacklogTaskCard({
  task,
  onSelect,
}: SortableBacklogTaskCardProps) {
  const completeTask = useCompleteTask();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
    active,
    index,
  } = useSortable({
    id: task.id,
    data: {
      type: "task",
      task,
      columnId: "backlog", // Fix: Must set columnId for consistent drag handler logic
      source: "backlog",
    },
  });

  // Determine if we should show a drop indicator
  const showIndicator = isOver && active?.id !== task.id;

  // Determine indicator position based on where the item will be inserted
  // Improved logic that works for both same-column and cross-column drags
  const activeColumn = active?.data?.current?.columnId;
  const currentColumn = "backlog";
  const isCrossColumnDrag = activeColumn !== currentColumn;

  let showDropIndicatorAbove = false;
  let showDropIndicatorBelow = false;

  if (showIndicator) {
    if (isCrossColumnDrag) {
      // Cross-column inserts happen before the hovered task.
      showDropIndicatorAbove = true;
    } else {
      // For same-column drags, use index-based logic
      const activeIndex = active?.data?.current?.sortable?.index ?? -1;
      showDropIndicatorAbove = activeIndex > index;
      showDropIndicatorBelow = activeIndex < index && activeIndex !== -1;
    }
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const onTaskClick = () => onSelect();

  return (
    <TaskContextMenu task={task} onEdit={onTaskClick}>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn("relative", isDragging && "opacity-30 z-50")}
      >
        {/* Drop indicator line - above */}
        {showDropIndicatorAbove && (
          <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-primary rounded-full z-10" />
        )}

        <TaskCardContent
          task={task}
          isCompleted={!!task.completedAt}
          isHovered={false}
          onToggleComplete={(e) => {
            e.stopPropagation();
            completeTask.mutate({ id: task.id, completed: !task.completedAt });
          }}
          onClick={onTaskClick}
          onHoverChange={() => {}}
        />

        {/* Drop indicator line - below */}
        {showDropIndicatorBelow && (
          <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-primary rounded-full z-10" />
        )}
      </div>
    </TaskContextMenu>
  );
}

interface BacklogTaskCardProps {
  task: Task;
  onSelect: () => void;
}

/**
 * Non-sortable backlog task card for completed tasks.
 * Has muted/lighter styling to indicate completion.
 */
function BacklogTaskCard({ task, onSelect }: BacklogTaskCardProps) {
  const completeTask = useCompleteTask();

  const onTaskClick = () => onSelect();

  return (
    <TaskContextMenu task={task} onEdit={onTaskClick}>
      <div>
        <TaskCardContent
          task={task}
          isCompleted={!!task.completedAt}
          isHovered={false}
          onToggleComplete={(e) => {
            e.stopPropagation();
            completeTask.mutate({ id: task.id, completed: !task.completedAt });
          }}
          onClick={onTaskClick}
          onHoverChange={() => {}}
        />
      </div>
    </TaskContextMenu>
  );
}
