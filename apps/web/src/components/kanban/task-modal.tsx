import * as React from "react";
import { format, setHours, setMinutes, differenceInMinutes, addMinutes } from "date-fns";
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
import { Plus, Clock, Trash2, Check, Calendar } from "lucide-react";
import type { Task, Subtask, TaskPriority } from "@open-sunsama/types";
import { PriorityIcon, PRIORITY_LABELS } from "@/components/ui/priority-badge";
import { useUpdateTask, useDeleteTask, useCompleteTask } from "@/hooks/useTasks";
import { useSubtasks, useCreateSubtask, useUpdateSubtask, useDeleteSubtask, useReorderSubtasks } from "@/hooks/useSubtasks";
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
  DropdownMenuSeparator,
} from "@/components/ui";
import { SortableSubtaskItem } from "./sortable-subtask-item";
import { NotesField } from "./task-modal-form";
import { TaskAttachments } from "./task-attachments";

interface TaskModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper to format time display (e.g., "0:30" for 30 minutes)
function formatTimeDisplay(mins: number | null | undefined): string {
  if (!mins) return "0:00";
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return `${hours}:${minutes.toString().padStart(2, "0")}`;
}

// Helper to format duration for display
function formatDurationDisplay(mins: number | null | undefined): string {
  if (!mins) return "No estimate";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remaining = mins % 60;
  if (remaining === 0) return hours === 1 ? "1 hour" : `${hours} hours`;
  return `${hours}h ${remaining}m`;
}

// Duration preset options
const DURATION_PRESETS = [
  { label: "5 min", value: 5 },
  { label: "10 min", value: 10 },
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 hour", value: 60 },
  { label: "1.5 hours", value: 90 },
  { label: "2 hours", value: 120 },
];

// Priority options
const PRIORITIES: TaskPriority[] = ["P0", "P1", "P2", "P3"];

/**
 * Parse flexible time input formats into minutes.
 * Supports: "30", "30m", "1h", "1.5h", "1h30m", "2 hours", etc.
 */
function parseTimeInput(input: string): number | null {
  if (!input) return null;
  const trimmed = input.trim().toLowerCase();
  
  // Match patterns like "1h30m", "1.5h", "30m", "30", etc.
  const hourMinMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*h(?:ours?)?\s*(?:(\d+)\s*m(?:ins?)?)?$/);
  if (hourMinMatch && hourMinMatch[1]) {
    const hours = parseFloat(hourMinMatch[1]);
    const mins = parseInt(hourMinMatch[2] ?? "0", 10);
    return Math.round(hours * 60) + mins;
  }
  
  const minMatch = trimmed.match(/^(\d+)\s*m(?:ins?)?$/);
  if (minMatch && minMatch[1]) {
    return parseInt(minMatch[1], 10);
  }
  
  const hourOnly = trimmed.match(/^(\d+(?:\.\d+)?)\s*h(?:ours?)?$/);
  if (hourOnly && hourOnly[1]) {
    return Math.round(parseFloat(hourOnly[1]) * 60);
  }
  
  // Plain number = minutes
  const num = parseInt(trimmed, 10);
  if (!isNaN(num) && num > 0) {
    return num;
  }
  
  return null;
}

export function TaskModal({ task, open, onOpenChange }: TaskModalProps) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [plannedMins, setPlannedMins] = React.useState<number | null>(null);
  const [priority, setPriority] = React.useState<TaskPriority>("P3");
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState("");
  const [isAddingSubtask, setIsAddingSubtask] = React.useState(false);
  const [startTime, setStartTime] = React.useState<string>("");
  const [isCustomDuration, setIsCustomDuration] = React.useState(false);
  const [customDurationValue, setCustomDurationValue] = React.useState("");

  const updateTask = useUpdateTask();

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
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
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
      setIsAddingSubtask(false);
      setNewSubtaskTitle("");
      setIsCustomDuration(false);
      setCustomDurationValue("");
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
    if (hours === undefined || minutes === undefined || isNaN(hours) || isNaN(minutes)) return;
    
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

  // Handle custom duration submit with flexible time parsing
  const handleCustomDurationSubmit = () => {
    const mins = parseTimeInput(customDurationValue);
    if (mins !== null && mins > 0) {
      handleDurationChange(mins);
    }
    setIsCustomDuration(false);
    setCustomDurationValue("");
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        {/* Header - Title with checkbox and date */}
        <div className="px-4 pt-4 pb-3 border-b">
          <div className="flex items-start gap-3 pr-6">
            {/* Checkbox */}
            <button
              type="button"
              className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors cursor-pointer ${
                isCompleted
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/40 hover:border-primary hover:bg-primary/10"
              }`}
              onClick={handleToggleComplete}
            >
              {isCompleted && <Check className="h-3 w-3" strokeWidth={3} />}
            </button>

            {/* Title and date */}
            <div className="flex-1 min-w-0">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => title !== task.title && handleSave()}
                className={`border-none p-0 text-base font-medium shadow-none focus-visible:ring-0 h-auto ${
                  isCompleted ? "line-through text-muted-foreground" : ""
                }`}
                placeholder="Task title"
              />
              {scheduledDate && (
                <p className="text-sm text-muted-foreground mt-1">
                  {scheduledDate}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 py-4 space-y-4 max-h-[50vh] overflow-y-auto">
          {/* Priority Section */}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Priority</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 gap-2 px-2">
                  <PriorityIcon priority={priority} />
                  <span className="text-sm">{PRIORITY_LABELS[priority]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {PRIORITIES.map((p) => (
                  <DropdownMenuItem
                    key={p}
                    onClick={() => handleSetPriority(p)}
                    className={priority === p ? "bg-accent" : ""}
                  >
                    <PriorityIcon priority={p} className="mr-2" />
                    {PRIORITY_LABELS[p]}
                    {priority === p && (
                      <span className="ml-auto text-xs text-muted-foreground">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Subtasks Section */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Subtasks</h4>
            
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSubtaskDragEnd}>
              <SortableContext items={subtaskIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-0">
                  {subtasks.map((subtask) => (
                    <SortableSubtaskItem
                      key={subtask.id}
                      subtask={subtask}
                      onToggle={() => toggleSubtask(subtask)}
                      onDelete={() => handleDeleteSubtask(subtask.id)}
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
            <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
            <NotesField
              notes={description}
              onChange={setDescription}
              onBlur={() => {
                if (description !== (task.notes || "")) handleSave();
              }}
            />
          </div>

          {/* Attachments - minimal */}
          <TaskAttachments taskId={task.id} />

          {/* Time & Duration Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Time & Duration</h4>
            
            <div className="flex items-center gap-4">
              {/* Start Time - Only show if task has a time block */}
              {activeTimeBlock && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className="h-8 w-28 text-sm"
                  />
                </div>
              )}
              
              {/* Duration */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {isCustomDuration ? (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={customDurationValue}
                        onChange={(e) => setCustomDurationValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCustomDurationSubmit();
                          }
                          if (e.key === "Escape") {
                            setIsCustomDuration(false);
                            setCustomDurationValue("");
                          }
                        }}
                        onBlur={handleCustomDurationSubmit}
                        placeholder="e.g. 30m, 1.5h"
                        className="h-8 w-24 text-sm"
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          setIsCustomDuration(false);
                          setCustomDurationValue("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Formats: 30, 30m, 1h, 1.5h, 1h30m
                    </span>
                  </div>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-sm font-normal"
                      >
                        {formatDurationDisplay(plannedMins)}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-36">
                      {DURATION_PRESETS.map((preset) => (
                        <DropdownMenuItem
                          key={preset.value}
                          onClick={() => handleDurationChange(preset.value)}
                          className={plannedMins === preset.value ? "bg-accent" : ""}
                        >
                          {preset.label}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setIsCustomDuration(true)}>
                        Custom...
                      </DropdownMenuItem>
                      {plannedMins && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDurationChange(null)}
                            className="text-muted-foreground"
                          >
                            Clear
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Time block info */}
            {activeTimeBlock && (
              <p className="text-xs text-muted-foreground">
                Scheduled: {format(new Date(activeTimeBlock.startTime), "h:mm a")} - {format(new Date(activeTimeBlock.endTime), "h:mm a")}
              </p>
            )}
            {!activeTimeBlock && task.scheduledDate && (
              <p className="text-xs text-muted-foreground">
                Not scheduled on calendar. Drag task to timeline to add a time block.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatTimeDisplay(plannedMins)}</span>
          </div>
          
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
