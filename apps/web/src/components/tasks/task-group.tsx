import * as React from "react";
import { ChevronRight } from "lucide-react";
import type { Task } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { SortableTaskRow } from "./sortable-task-row";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import { useReorderTasks } from "@/hooks/useTasks";
import { useQueryClient } from "@tanstack/react-query";
import { TaskRow } from "./task-row";

export interface TaskGroupProps {
  label: string;
  tasks: Task[];
  isOverdue?: boolean;
  defaultExpanded?: boolean;
  onSelectTask: (task: Task) => void;
  onCompleteTask: (task: Task) => void;
  /** Date key for this group - "backlog" for no date, or "YYYY-MM-DD" date string */
  dateKey?: string;
}

export function TaskGroup({
  label,
  tasks,
  isOverdue = false,
  defaultExpanded = true,
  onSelectTask,
  onCompleteTask,
  dateKey,
}: TaskGroupProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  const reorderTasks = useReorderTasks();
  const queryClient = useQueryClient();

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

  if (tasks.length === 0) {
    return null;
  }

  // Determine the date key for reordering
  const groupDateKey = dateKey ?? (tasks[0]?.scheduledDate || "backlog");
  const taskIds = tasks.map((t) => t.id);

  const handleDragStart = (event: any) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(tasks, oldIndex, newIndex);
    const newTaskIds = reordered.map((t) => t.id);

    // Fire the reorder mutation
    reorderTasks.mutate(
      { date: groupDateKey, taskIds: newTaskIds },
      {
        onSettled: () => {
          // Also invalidate the infinite search cache that the list page uses
          queryClient.invalidateQueries({ queryKey: ["tasks", "search", "infinite"] });
        },
      }
    );
  };

  const handleDragCancel = () => {
    setActiveTask(null);
  };

  return (
    <div className="mb-1">
      {/* Group Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-md transition-colors",
          "hover:bg-accent/30",
          isOverdue && "text-red-500"
        )}
      >
        <ChevronRight
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isExpanded && "rotate-90"
          )}
        />
        <span className="truncate">{label}</span>
        <span className="text-xs text-muted-foreground font-normal ml-1">
          {tasks.length}
        </span>
      </button>

      {/* Task List with DnD */}
      {isExpanded && (
        <div className="ml-3 border-l border-border/50 pl-2 mt-0.5">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext
              items={taskIds}
              strategy={verticalListSortingStrategy}
            >
              {tasks.map((task) => (
                <SortableTaskRow
                  key={task.id}
                  task={task}
                  onSelect={() => onSelectTask(task)}
                  onComplete={() => onCompleteTask(task)}
                />
              ))}
            </SortableContext>
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
        </div>
      )}
    </div>
  );
}
