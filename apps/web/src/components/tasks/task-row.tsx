import * as React from "react";
import { Check, Clock, ChevronDown, ChevronRight } from "lucide-react";
import type { Task } from "@open-sunsama/types";
import { cn, formatDuration } from "@/lib/utils";
import { useSubtasks, useUpdateSubtask } from "@/hooks/useSubtasks";
import { useHoveredTask, TIME_EDIT_KEYS } from "@/hooks/useKeyboardShortcuts";
import { TaskContextMenu } from "@/components/kanban/task-context-menu";

import { PriorityIcon, PRIORITY_LABELS } from "@/components/ui/priority-badge";
import { DurationPicker } from "@/components/ui/duration-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUpdateTask } from "@/hooks/useTasks";
import { EDIT_ESTIMATE_EVENT } from "@/components/task-shortcuts-handler";
import { WithShortcut } from "@/components/ui/with-shortcut";

export interface TaskRowProps {
  task: Task;
  onSelect: () => void;
  onComplete: () => void;
}

export function TaskRow({ 
  task, 
  onSelect, 
  onComplete,
}: TaskRowProps) {
  const { setHoveredTask } = useHoveredTask();
  const updateTask = useUpdateTask();
  const [durationOpen, setDurationOpen] = React.useState(false);
  React.useEffect(() => {
    const open = (e: Event) => {
      if ((e as CustomEvent<string>).detail === task.id) setDurationOpen(true);
    };
    window.addEventListener(EDIT_ESTIMATE_EVENT, open);
    return () => window.removeEventListener(EDIT_ESTIMATE_EVENT, open);
  }, [task.id]);
  const isCompleted = !!task.completedAt;
  const [showSubtasks, setShowSubtasks] = React.useState(false);
  const { data: subtasks = [] } = useSubtasks(task.id);
  const updateSubtask = useUpdateSubtask();

  // Sort subtasks by position
  const sortedSubtasks = React.useMemo(() => {
    return [...subtasks].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [subtasks]);

  const hasSubtasks = sortedSubtasks.length > 0;
  const completedSubtasksCount = sortedSubtasks.filter((s) => s.completed).length;

  const handleToggleSubtasks = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasSubtasks) {
      setShowSubtasks(!showSubtasks);
    }
  };

  const handleSubtaskToggle = (e: React.MouseEvent, subtaskId: string, completed: boolean) => {
    e.stopPropagation();
    updateSubtask.mutate({ 
      taskId: task.id, 
      subtaskId, 
      data: { completed: !completed } 
    });
  };

  return (
    <TaskContextMenu task={task} onEdit={onSelect}>
      <div
        data-task-id={task.id}
        onMouseEnter={() => setHoveredTask(task)}
        onMouseLeave={() => setHoveredTask(null)}
      >
        <div
          className={cn(
            "group flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors",
            "hover:bg-surface focus-within:bg-surface",
            isCompleted && "opacity-50"
          )}
          onClick={onSelect}
        >
        {/* Subtasks Toggle */}
        {hasSubtasks ? (
          <button
            aria-label={showSubtasks ? "Collapse subtasks" : "Expand subtasks"}
            aria-expanded={showSubtasks}
            onClick={handleToggleSubtasks}
            className="shrink-0 p-0.5 -ml-0.5 rounded hover:bg-accent transition-colors"
          >
            {showSubtasks ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-4 shrink-0" />
        )}

        <WithShortcut label={isCompleted ? "Reopen task" : "Complete task"} shortcut="completeTask">
        <button
          role="checkbox"
          aria-checked={isCompleted}
          aria-label={isCompleted ? "Reopen task" : "Complete task"}
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }}
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-all cursor-pointer",
            isCompleted
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/40 hover:border-primary hover:bg-primary/5"
          )}
        >
          {isCompleted && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
        </button>

        </WithShortcut>
        {/* Priority */}
        {task.priority !== "P2" && <span title={PRIORITY_LABELS[task.priority]}><PriorityIcon priority={task.priority} className="h-3.5 w-3.5" /></span>}

        {/* Title */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className={cn(
            "min-w-0 flex-1 text-left text-sm truncate focus-visible:outline-none focus-visible:underline",
            isCompleted && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </button>

        {/* Subtask Progress Indicator */}
        {hasSubtasks && !showSubtasks && (
          <span className="text-xs text-muted-foreground shrink-0">
            {completedSubtasksCount}/{subtasks.length}
          </span>
        )}

        <Popover open={durationOpen} onOpenChange={setDurationOpen}>
          <PopoverTrigger asChild>
            <button type="button" aria-label="Edit planned time" onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 rounded px-1 py-1 text-xs text-muted-foreground tabular-nums hover:bg-accent">
              <Clock className="h-3 w-3" />
              {task.estimatedMins ? formatDuration(task.estimatedMins) : "—"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end" onClick={(e) => e.stopPropagation()}>
            <DurationPicker value={task.estimatedMins} label="Planned" shortcut={TIME_EDIT_KEYS.planned.toUpperCase()}
              onChange={(estimatedMins) => { updateTask.mutate({ id: task.id, data: { estimatedMins } }); setDurationOpen(false); }}
              onClose={() => setDurationOpen(false)} />
          </PopoverContent>
        </Popover>
      </div>

      {/* Compact Subtasks List (Linear-style) */}
      {showSubtasks && hasSubtasks && (
        <div className="ml-[3.25rem] pb-1">
          {sortedSubtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-center gap-2 py-[3px] group/subtask"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                aria-label={`${subtask.completed ? "Reopen" : "Complete"} ${subtask.title}`}
                onClick={(e) => handleSubtaskToggle(e, subtask.id, subtask.completed)}
                className={cn(
                  "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-colors cursor-pointer",
                  subtask.completed
                    ? "border-primary/60 bg-primary/60 text-primary-foreground"
                    : "border-muted-foreground/30 hover:border-primary"
                )}
              >
                {subtask.completed && <Check className="h-2 w-2" strokeWidth={3} />}
              </button>
              <span
                className={cn(
                  "text-xs text-muted-foreground truncate",
                  subtask.completed && "line-through opacity-50"
                )}
              >
                {subtask.title}
              </span>
            </div>
          ))}
        </div>
      )}
      </div>
    </TaskContextMenu>
  );
}
