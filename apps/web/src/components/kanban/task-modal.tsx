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
  Repeat,
  MoreHorizontal,
  Expand,
  X,
  Calendar,
  CalendarClock,
  Play,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import type {
  Task,
  Subtask,
  TaskPriority,
  CreateTaskSeriesInput,
} from "@open-sunsama/types";
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

export function TaskModal({ task, open, onOpenChange }: TaskModalProps) {
  const navigate = useNavigate();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [plannedMins, setPlannedMins] = React.useState<number | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState("");
  const [isAddingSubtask, setIsAddingSubtask] = React.useState(false);
  const [repeatDialogOpen, setRepeatDialogOpen] = React.useState(false);
  const [actualMins, setActualMins] = React.useState<number | null>(null);

  // Refs for time dropdowns (keyboard shortcuts E/W)
  const actualTimeRef = React.useRef<TimeDropdownRef>(null);
  const plannedTimeRef = React.useRef<TimeDropdownRef>(null);

  const { setHoveredTask } = useHoveredTask();
  const createTaskSeries = useCreateTaskSeries();
  const updateTask = useUpdateTask();

  // Set hovered task when modal is open so keyboard shortcuts work
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

      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        actualTimeRef.current?.open();
        return;
      }

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
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const isCompleted = !!task?.completedAt;

  React.useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.notes || "");
      setPlannedMins(task.estimatedMins || null);
      setActualMins(task.actualMins || null);
      setIsAddingSubtask(false);
      setNewSubtaskTitle("");
    }
  }, [task]);

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

  // Handle duration change
  const handleDurationChange = async (newDurationMins: number | null) => {
    setPlannedMins(newDurationMins);

    if (task) {
      await updateTask.mutateAsync({
        id: task.id,
        data: { estimatedMins: newDurationMins },
      });
    }

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
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden [&>button]:hidden">
        {/* Top toolbar - metadata and actions */}
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-border/50 bg-muted/20">
          {/* Left side - metadata */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {task.scheduledDate && (
              <span className="flex items-center gap-1 px-2 py-1 rounded hover:bg-muted/50 transition-colors">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(task.scheduledDate), "MMM d")}
              </span>
            )}
            {plannedMins && (
              <span className="flex items-center gap-1 px-2 py-1 rounded hover:bg-muted/50 transition-colors">
                <CalendarClock className="h-3.5 w-3.5" />
                {plannedMins >= 60
                  ? `${Math.floor(plannedMins / 60)}:${(plannedMins % 60).toString().padStart(2, "0")}`
                  : `0:${plannedMins.toString().padStart(2, "0")}`}
              </span>
            )}
          </div>

          {/* Right side - action buttons */}
          <div className="flex items-center gap-0.5">
            {/* Add Subtask */}
            <button
              type="button"
              onClick={() => setIsAddingSubtask(true)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Subtasks</span>
            </button>

            {/* More menu */}
            {!task.seriesId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setRepeatDialogOpen(true)}>
                    <Repeat className="mr-2 h-4 w-4" />
                    Repeat...
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Focus mode button */}
            <button
              type="button"
              onClick={handleExpandToFocus}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="Enter focus mode (F)"
            >
              <Expand className="h-4 w-4" />
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Header section - title and time tracking */}
        <div className="p-5 pb-0 space-y-4">
          {/* Title row with checkbox */}
          <div className="flex items-start gap-3">
            {/* Checkbox */}
            <button
              type="button"
              className={cn(
                "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                isCompleted
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/30 hover:border-primary"
              )}
              onClick={handleToggleComplete}
            >
              {isCompleted && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            </button>

            {/* Title */}
            <div className="flex-1 min-w-0">
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
          </div>

          {/* Time tracking section */}
          <div className="flex items-center gap-6 py-2">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-0.5">
                  Actual
                </span>
                <TimeDropdown
                  ref={actualTimeRef}
                  value={actualMins}
                  onChange={handleActualMinsChange}
                  placeholder="--:--"
                  dropdownHeader="Set actual time"
                  shortcutHint="E"
                  showClear
                  clearText="Clear"
                  size="sm"
                  className="font-mono text-sm text-foreground"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-0.5">
                  Planned
                </span>
                <TimeDropdown
                  ref={plannedTimeRef}
                  value={plannedMins}
                  onChange={handleDurationChange}
                  placeholder="--:--"
                  dropdownHeader="Set planned time"
                  shortcutHint="W"
                  showClear
                  clearText="Clear"
                  size="sm"
                  className="font-mono text-sm text-foreground"
                />
              </div>
            </div>

            {/* START button */}
            <button
              onClick={handleExpandToFocus}
              className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#22c55e] hover:bg-[#16a34a] text-white text-xs font-medium transition-colors"
            >
              <Play className="h-3 w-3 fill-current" />
              START
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-5 py-4 space-y-4 max-h-[55vh] overflow-y-auto">
          {/* Series Banner */}
          {task.seriesId && <TaskSeriesBanner task={task} />}

          {/* Subtasks Section */}
          <div className="space-y-3">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleSubtaskDragEnd}
            >
              <SortableContext
                items={subtaskIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {subtasks.map((subtask) => (
                    <SortableSubtaskItem
                      key={subtask.id}
                      subtask={subtask}
                      onToggle={() => toggleSubtask(subtask)}
                      onDelete={() => handleDeleteSubtask(subtask.id)}
                      onUpdate={(newTitle) =>
                        updateSubtask.mutate({
                          taskId: task!.id,
                          subtaskId: subtask.id,
                          data: { title: newTitle },
                        })
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Add Subtask input */}
            {isAddingSubtask && (
              <div className="flex items-center gap-3 py-2 pl-1">
                <div className="h-4 w-4 shrink-0 rounded border border-dashed border-muted-foreground/30" />
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
                  placeholder="Add subtask..."
                  className="flex-1 border-none p-0 h-auto text-sm shadow-none focus-visible:ring-0 bg-transparent"
                  autoFocus
                />
              </div>
            )}

            {/* Show add button only when not adding and no subtasks */}
            {!isAddingSubtask && subtasks.length === 0 && (
              <button
                onClick={() => setIsAddingSubtask(true)}
                className="flex items-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add subtask</span>
              </button>
            )}
          </div>

          {/* Notes Section */}
          <div>
            <NotesField
              notes={description}
              onChange={setDescription}
              onBlur={() => {
                if (description !== (task.notes || "")) handleSave();
              }}
              minHeight="150px"
            />
          </div>

          {/* Attachments */}
          <TaskAttachments taskId={task.id} />
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
