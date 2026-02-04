import * as React from "react";
import {
  format,
  setHours,
  setMinutes,
  differenceInMinutes,
  addMinutes,
} from "date-fns";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Plus,
  Trash2,
  Check,
  Calendar,
  Repeat,
  MoreHorizontal,
  Play,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import type {
  Task,
  Subtask,
  TaskPriority,
  CreateTaskSeriesInput,
} from "@open-sunsama/types";
import { PriorityIcon, PRIORITY_LABELS } from "@/components/ui/priority-badge";
import { cn } from "@/lib/utils";
import {
  useUpdateTask,
  useDeleteTask,
  useCompleteTask,
} from "@/hooks/useTasks";
import {
  useSubtasks,
  useCreateSubtask,
  useUpdateSubtask,
  useDeleteSubtask,
  useReorderSubtasks,
} from "@/hooks/useSubtasks";
import { useHoveredTask } from "@/hooks";
import { useTimeBlocks, useUpdateTimeBlock } from "@/hooks/useTimeBlocks";

import {
  Dialog,
  DialogContent,
  Input,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import {
  TimeDropdown,
  type TimeDropdownRef,
} from "@/components/ui/time-dropdown";
import { SortableSubtaskItem } from "./sortable-subtask-item";
import { NotesField } from "./task-modal-form";
import { TaskAttachments } from "./task-attachments";
import { TaskSeriesBanner } from "./task-series-banner";
import { RepeatConfigDialog } from "./repeat-config-popover";
import { useCreateTaskSeries } from "@/hooks/useTaskSeries";

interface TaskModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Priority options
const PRIORITIES: TaskPriority[] = ["P0", "P1", "P2", "P3"];

export function TaskModal({ task, open, onOpenChange }: TaskModalProps) {
  const navigate = useNavigate();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [plannedMins, setPlannedMins] = React.useState<number | null>(null);
  const [priority, setPriority] = React.useState<TaskPriority>("P3");
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState("");
  const [isAddingSubtask, setIsAddingSubtask] = React.useState(false);
  const [startTime, setStartTime] = React.useState<string>("");
  const [repeatDialogOpen, setRepeatDialogOpen] = React.useState(false);
  const [actualMins, setActualMins] = React.useState<number | null>(null);

  // Refs for time dropdowns (keyboard shortcuts E/W)
  const actualTimeRef = React.useRef<TimeDropdownRef>(null);
  const plannedTimeRef = React.useRef<TimeDropdownRef>(null);

  const { setHoveredTask } = useHoveredTask();
  const createTaskSeries = useCreateTaskSeries();
  const updateTask = useUpdateTask();

  // Set hovered task when modal is open so keyboard shortcuts (C to complete subtask) work
  React.useEffect(() => {
    if (open && task) {
      setHoveredTask(task);
    }
    return () => setHoveredTask(null);
  }, [open, task, setHoveredTask]);

  // Handle keyboard shortcuts: F for focus, E for actual time, W for planned time
  React.useEffect(() => {
    if (!open || !task) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        onOpenChange(false);
        navigate({ to: "/app/focus/$taskId", params: { taskId: task.id } });
        return;
      }

      // E to edit actual time
      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        actualTimeRef.current?.open();
        return;
      }

      // W to edit planned time
      if (e.key === "w" || e.key === "W") {
        e.preventDefault();
        plannedTimeRef.current?.open();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, task, onOpenChange, navigate]);

  // Handle save on close
  const handleOpenChange = async (newOpen: boolean) => {
    if (!newOpen && task) {
      // Save pending changes before closing
      const hasChanges =
        title !== task.title ||
        description !== (task.notes || "") ||
        plannedMins !== task.estimatedMins;
      if (hasChanges && title.trim()) {
        await updateTask.mutateAsync({
          id: task.id,
          data: {
            title: title.trim(),
            notes: description || null,
            estimatedMins: plannedMins,
          },
        });
      }
    }
    onOpenChange(newOpen);
  };
  const deleteTask = useDeleteTask();
  const completeTask = useCompleteTask();
  const updateTimeBlock = useUpdateTimeBlock();

  // Fetch time blocks for this task
  const { data: timeBlocks = [] } = useTimeBlocks(
    task ? { taskId: task.id } : undefined
  );

  // Get the first (most relevant) time block for this task
  const activeTimeBlock = React.useMemo(() => {
    if (!timeBlocks.length) return null;
    // Sort by start time and get the most recent/upcoming one
    const sorted = [...timeBlocks].sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
    return sorted[0] ?? null;
  }, [timeBlocks]);

  // Subtask hooks
  const { data: subtasks = [] } = useSubtasks(task?.id ?? "");
  const createSubtask = useCreateSubtask();
  const updateSubtask = useUpdateSubtask();
  const deleteSubtaskMutation = useDeleteSubtask();
  const reorderSubtasks = useReorderSubtasks();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const isCompleted = !!task?.completedAt;

  React.useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.notes || "");
      setPlannedMins(task.estimatedMins || null);
      setPriority(task.priority);
      setActualMins(task.actualMins || null);
      setIsAddingSubtask(false);
      setNewSubtaskTitle("");
    }
  }, [task]);

  // Update start time when time block changes
  React.useEffect(() => {
    if (activeTimeBlock) {
      const blockStart = new Date(activeTimeBlock.startTime);
      setStartTime(format(blockStart, "HH:mm"));
    } else {
      setStartTime("");
    }
  }, [activeTimeBlock]);

  const handleSave = async () => {
    if (!task || !title.trim()) return;
    await updateTask.mutateAsync({
      id: task.id,
      data: {
        title: title.trim(),
        notes: description || null,
        estimatedMins: plannedMins,
      },
    });
  };

  // Handle start time change
  const handleStartTimeChange = async (newStartTime: string) => {
    setStartTime(newStartTime);

    if (!activeTimeBlock || !newStartTime) return;

    // Parse the new start time
    const [hours, minutes] = newStartTime.split(":").map(Number);
    if (
      hours === undefined ||
      minutes === undefined ||
      isNaN(hours) ||
      isNaN(minutes)
    )
      return;

    // Calculate duration of existing time block
    const oldStart = new Date(activeTimeBlock.startTime);
    const oldEnd = new Date(activeTimeBlock.endTime);
    const durationMins = differenceInMinutes(oldEnd, oldStart);

    // Create new start time, keeping the same date
    const newStart = setMinutes(setHours(oldStart, hours), minutes);
    const newEnd = addMinutes(newStart, durationMins);

    // Update the time block
    await updateTimeBlock.mutateAsync({
      id: activeTimeBlock.id,
      data: {
        startTime: newStart,
        endTime: newEnd,
      },
    });
  };

  // Handle duration change
  const handleDurationChange = async (newDurationMins: number | null) => {
    setPlannedMins(newDurationMins);

    // Update task's estimated time
    if (task) {
      await updateTask.mutateAsync({
        id: task.id,
        data: { estimatedMins: newDurationMins },
      });
    }

    // If there's an active time block, update its end time
    if (activeTimeBlock && newDurationMins) {
      const blockStart = new Date(activeTimeBlock.startTime);
      const newEnd = addMinutes(blockStart, newDurationMins);

      await updateTimeBlock.mutateAsync({
        id: activeTimeBlock.id,
        data: { endTime: newEnd },
      });
    }
  };

  // Handle actual time change
  const handleActualMinsChange = async (newActualMins: number | null) => {
    setActualMins(newActualMins);
    if (task) {
      await updateTask.mutateAsync({
        id: task.id,
        data: { actualMins: newActualMins ?? 0 },
      });
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTask.mutateAsync(task.id);
      onOpenChange(false);
    }
  };

  const handleToggleComplete = async () => {
    if (!task) return;
    await completeTask.mutateAsync({ id: task.id, completed: !isCompleted });
  };

  const handleSetPriority = async (newPriority: TaskPriority) => {
    if (!task || priority === newPriority) return;
    // Update local state immediately for instant UI feedback
    setPriority(newPriority);
    // Then update the server
    await updateTask.mutateAsync({
      id: task.id,
      data: { priority: newPriority },
    });
  };

  const addSubtask = async () => {
    if (!newSubtaskTitle.trim() || !task) return;
    await createSubtask.mutateAsync({
      taskId: task.id,
      data: { title: newSubtaskTitle.trim() },
    });
    setNewSubtaskTitle("");
  };

  const toggleSubtask = async (subtask: Subtask) => {
    if (!task) return;
    await updateSubtask.mutateAsync({
      taskId: task.id,
      subtaskId: subtask.id,
      data: { completed: !subtask.completed },
    });
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!task) return;
    await deleteSubtaskMutation.mutateAsync({
      taskId: task.id,
      subtaskId,
    });
  };

  const handleSubtaskDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !task || active.id === over.id) return;

    const oldIndex = subtasks.findIndex((item) => item.id === active.id);
    const newIndex = subtasks.findIndex((item) => item.id === over.id);
    const newOrder = arrayMove(subtasks, oldIndex, newIndex);

    await reorderSubtasks.mutateAsync({
      taskId: task.id,
      subtaskIds: newOrder.map((st) => st.id),
    });
  };

  const subtaskIds = subtasks.map((st) => st.id);

  if (!task) return null;

  const scheduledDate = task.scheduledDate
    ? format(new Date(task.scheduledDate), "EEEE, MMMM d")
    : null;

  const handleExpandToFocus = () => {
    if (!task) return;
    onOpenChange(false);
    navigate({ to: "/app/focus/$taskId", params: { taskId: task.id } });
  };

  const handleRepeatSave = async (config: CreateTaskSeriesInput) => {
    if (!task) return;
    await createTaskSeries.mutateAsync({
      ...config,
      title: task.title,
      notes: task.notes ?? undefined,
      priority: task.priority,
      estimatedMins: task.estimatedMins ?? undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
        {/* Clean header with title and time */}
        <div className="px-6 pt-5 pb-4">
          {/* Title row with checkbox */}
          <div className="flex items-start gap-3">
            {/* Checkbox */}
            <button
              type="button"
              className={cn(
                "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                isCompleted
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/30 hover:border-primary"
              )}
              onClick={handleToggleComplete}
            >
              {isCompleted && <Check className="h-3 w-3" strokeWidth={3} />}
            </button>

            {/* Title */}
            <div className="flex-1 min-w-0 pr-4">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => title !== task.title && handleSave()}
                className={cn(
                  "border-none p-0 text-xl font-semibold shadow-none focus-visible:ring-0 h-auto bg-transparent",
                  isCompleted && "line-through text-muted-foreground"
                )}
                placeholder="Task title"
              />
            </div>

            {/* Time tracking - compact inline */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 text-xs">
                <span className="text-muted-foreground/60 uppercase tracking-wide">
                  Actual
                </span>
                <TimeDropdown
                  ref={actualTimeRef}
                  value={actualMins}
                  onChange={handleActualMinsChange}
                  placeholder="0:00"
                  dropdownHeader="Set actual time"
                  shortcutHint="E"
                  showClear
                  clearText="Clear"
                  size="sm"
                  className="text-sm font-medium"
                />
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-muted-foreground/60 uppercase tracking-wide">
                  Planned
                </span>
                <TimeDropdown
                  ref={plannedTimeRef}
                  value={plannedMins}
                  onChange={handleDurationChange}
                  placeholder="0:00"
                  dropdownHeader="Set planned time"
                  shortcutHint="W"
                  showClear
                  clearText="Clear"
                  size="sm"
                  className="text-sm font-medium"
                />
              </div>
              {/* START button - Linear green style */}
              <Button
                size="sm"
                onClick={handleExpandToFocus}
                className="gap-1 h-7 px-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium"
              >
                <Play className="h-3 w-3 fill-current" />
                START
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 pb-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Series Banner - show if task is part of a recurring series */}
          {task.seriesId && <TaskSeriesBanner task={task} />}

          {/* Subtasks Section */}
          <div className="space-y-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleSubtaskDragEnd}
            >
              <SortableContext
                items={subtaskIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-0">
                  {subtasks.map((subtask) => (
                    <SortableSubtaskItem
                      key={subtask.id}
                      subtask={subtask}
                      onToggle={() => toggleSubtask(subtask)}
                      onDelete={() => handleDeleteSubtask(subtask.id)}
                      onUpdate={(title) =>
                        updateSubtask.mutate({
                          taskId: task!.id,
                          subtaskId: subtask.id,
                          data: { title },
                        })
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Add Subtask */}
            {isAddingSubtask ? (
              <div className="flex items-center gap-3 py-1">
                <div className="h-4 w-4 shrink-0 rounded-full border border-muted-foreground/30" />
                <Input
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSubtask();
                    }
                    if (e.key === "Escape") {
                      setNewSubtaskTitle("");
                      setIsAddingSubtask(false);
                    }
                  }}
                  onBlur={() => {
                    if (!newSubtaskTitle.trim()) {
                      setIsAddingSubtask(false);
                    }
                  }}
                  placeholder="Subtask description..."
                  className="flex-1 border-none p-0 h-auto text-sm shadow-none focus-visible:ring-0"
                  autoFocus
                />
              </div>
            ) : (
              <button
                onClick={() => setIsAddingSubtask(true)}
                className="flex items-center gap-2 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm">Add subtask</span>
              </button>
            )}
          </div>

          {/* Notes Section */}
          <div className="space-y-2">
            <NotesField
              notes={description}
              onChange={setDescription}
              onBlur={() => {
                if (description !== (task.notes || "")) handleSave();
              }}
              minHeight="120px"
            />
          </div>

          {/* Attachments - minimal */}
          <TaskAttachments taskId={task.id} />
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t flex items-center justify-between">
          {/* More actions dropdown - only show if task is not part of a series */}
          {!task.seriesId ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span>More</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onSelect={() => setRepeatDialogOpen(true)}>
                  <Repeat className="mr-2 h-4 w-4" />
                  Repeat...
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div /> /* Empty spacer when no more menu */
          )}

          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>
        </div>
      </DialogContent>

      {/* Repeat Config Dialog */}
      {task && !task.seriesId && (
        <RepeatConfigDialog
          title={task.title}
          initialConfig={{
            notes: task.notes ?? undefined,
            priority: task.priority,
            estimatedMins: task.estimatedMins ?? undefined,
          }}
          onSave={handleRepeatSave}
          open={repeatDialogOpen}
          onOpenChange={setRepeatDialogOpen}
        />
      )}
    </Dialog>
  );
}
