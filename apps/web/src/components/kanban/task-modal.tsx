import * as React from "react";
import {
  format,
  addMinutes,
  addDays,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  getDay,
  parse,
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
  ChevronLeft,
  ChevronRight,
  Archive,
  Sun,
  CalendarArrowUp,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import type { Task, Subtask, CreateTaskSeriesInput } from "@open-sunsama/types";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui";
import { toast } from "@/hooks/use-toast";
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

// ============================================
// DatePickerPopover Component
// ============================================

interface DatePickerPopoverRef {
  open: () => void;
  close: () => void;
  focusInput: () => void;
}

interface DatePickerPopoverProps {
  /** Current scheduled date in YYYY-MM-DD format or null for backlog */
  value: string | null;
  /** Callback when date changes */
  onChange: (date: string | null) => void;
  /** Task title for toast messages */
  taskTitle?: string;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const DatePickerPopover = React.forwardRef<
  DatePickerPopoverRef,
  DatePickerPopoverProps
>(function DatePickerPopover({ value, onChange, taskTitle }, ref) {
  const [open, setOpen] = React.useState(false);
  const [viewMonth, setViewMonth] = React.useState(() => {
    if (value) {
      return parse(value, "yyyy-MM-dd", new Date());
    }
    return new Date();
  });
  const [dateInputValue, setDateInputValue] = React.useState("");
  const [showDateInput, setShowDateInput] = React.useState(false);
  const dateInputRef = React.useRef<HTMLInputElement>(null);

  // Expose methods via ref
  React.useImperativeHandle(
    ref,
    () => ({
      open: () => setOpen(true),
      close: () => setOpen(false),
      focusInput: () => {
        setShowDateInput(true);
        setTimeout(() => dateInputRef.current?.focus(), 0);
      },
    }),
    []
  );

  // Reset view month when value changes
  React.useEffect(() => {
    if (value) {
      setViewMonth(parse(value, "yyyy-MM-dd", new Date()));
    }
  }, [value]);

  // Focus input when shown
  React.useEffect(() => {
    if (showDateInput && dateInputRef.current) {
      dateInputRef.current.focus();
      dateInputRef.current.select();
    }
  }, [showDateInput]);

  // Generate calendar days for the current view month
  const calendarDays = React.useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Get the day of week for the first day (0 = Sunday)
    const startDayOfWeek = getDay(monthStart);

    // Add padding days before the month starts
    const paddingBefore: (Date | null)[] = Array(startDayOfWeek).fill(null);

    // Add padding days after to complete the grid (6 rows max)
    const totalDays = paddingBefore.length + daysInMonth.length;
    const paddingAfter: (Date | null)[] = Array(
      totalDays % 7 === 0 ? 0 : 7 - (totalDays % 7)
    ).fill(null);

    return [...paddingBefore, ...daysInMonth, ...paddingAfter];
  }, [viewMonth]);

  const selectedDate = value ? parse(value, "yyyy-MM-dd", new Date()) : null;

  const handleDateSelect = (date: Date) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    onChange(formattedDate);
    setOpen(false);
    if (taskTitle) {
      toast({
        title: "Date updated",
        description: `"${taskTitle}" scheduled for ${format(date, "EEEE, MMM d")}.`,
      });
    }
  };

  const handleSnoozeOneDay = () => {
    const tomorrow = addDays(new Date(), 1);
    const formattedDate = format(tomorrow, "yyyy-MM-dd");
    onChange(formattedDate);
    setOpen(false);
    if (taskTitle) {
      toast({
        title: "Snoozed one day",
        description: `"${taskTitle}" scheduled for ${format(tomorrow, "EEEE, MMM d")}.`,
      });
    }
  };

  const handleMoveToNextWeek = () => {
    const today = new Date();
    const nextMonday = addDays(startOfWeek(today, { weekStartsOn: 1 }), 7);
    const formattedDate = format(nextMonday, "yyyy-MM-dd");
    onChange(formattedDate);
    setOpen(false);
    if (taskTitle) {
      toast({
        title: "Moved to next week",
        description: `"${taskTitle}" scheduled for ${format(nextMonday, "EEEE, MMM d")}.`,
      });
    }
  };

  const handleMoveToBacklog = () => {
    onChange(null);
    setOpen(false);
    if (taskTitle) {
      toast({
        title: "Moved to backlog",
        description: `"${taskTitle}" removed from schedule.`,
      });
    }
  };

  const handleDateInputSubmit = () => {
    const trimmed = dateInputValue.trim();
    if (!trimmed) {
      setShowDateInput(false);
      return;
    }

    // Try to parse various date formats
    const today = new Date();
    let parsedDate: Date | null = null;

    // Try common formats
    const formats = [
      "yyyy-MM-dd",
      "MM/dd/yyyy",
      "MM-dd-yyyy",
      "M/d/yyyy",
      "M-d-yyyy",
      "MMM d",
      "MMMM d",
      "d MMM",
      "d MMMM",
    ];

    for (const fmt of formats) {
      try {
        const result = parse(trimmed, fmt, today);
        if (!isNaN(result.getTime())) {
          parsedDate = result;
          break;
        }
      } catch {
        // Continue trying other formats
      }
    }

    if (parsedDate) {
      handleDateSelect(parsedDate);
    }

    setShowDateInput(false);
    setDateInputValue("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setShowDateInput(false);
      setDateInputValue("");
    }
  };

  // Display value for the trigger button
  const displayValue = value
    ? format(parse(value, "yyyy-MM-dd", new Date()), "MMM d")
    : "No date";

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "text-sm font-medium transition-colors hover:text-foreground",
            value ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {displayValue}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-0"
        align="start"
        side="bottom"
        sideOffset={4}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Move section - Quick actions */}
        <div className="p-2 border-b border-border/50">
          <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1.5 px-1">
            Move:
          </div>

          {/* Set date input */}
          {showDateInput ? (
            <div className="px-1 mb-1">
              <Input
                ref={dateInputRef}
                type="text"
                value={dateInputValue}
                onChange={(e) => setDateInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleDateInputSubmit();
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setShowDateInput(false);
                    setDateInputValue("");
                  }
                }}
                onBlur={() => {
                  if (!dateInputValue.trim()) {
                    setShowDateInput(false);
                  }
                }}
                placeholder="Jan 27, 2024"
                className="h-7 text-xs"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDateInput(true)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded hover:bg-muted/50 transition-colors"
            >
              <span className="text-muted-foreground">Set start date @</span>
              <span className="text-[10px] text-muted-foreground/60 px-1 py-0.5 rounded bg-muted/50">
                @
              </span>
            </button>
          )}

          {/* Snooze one day */}
          <button
            type="button"
            onClick={handleSnoozeOneDay}
            className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded hover:bg-muted/50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Sun className="h-3.5 w-3.5 text-muted-foreground" />
              Snooze one day
            </span>
            <span className="text-[10px] text-muted-foreground/60 px-1 py-0.5 rounded bg-muted/50">
              D
            </span>
          </button>

          {/* Move to next week */}
          <button
            type="button"
            onClick={handleMoveToNextWeek}
            className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded hover:bg-muted/50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <CalendarArrowUp className="h-3.5 w-3.5 text-muted-foreground" />
              Move to next week
            </span>
            <span className="text-[10px] text-muted-foreground/60 px-1 py-0.5 rounded bg-muted/50 flex items-center gap-0.5">
              <span className="text-[9px]">⇧</span>Z
            </span>
          </button>

          {/* Move to backlog */}
          <button
            type="button"
            onClick={handleMoveToBacklog}
            className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded hover:bg-muted/50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Archive className="h-3.5 w-3.5 text-muted-foreground" />
              Move to backlog
            </span>
            <span className="text-[10px] text-muted-foreground/60 px-1 py-0.5 rounded bg-muted/50">
              Z
            </span>
          </button>
        </div>

        {/* Calendar section */}
        <div className="p-2">
          <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1.5 px-1">
            Start date:
          </div>

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setViewMonth(subMonths(viewMonth, 1))}
              className="p-1 rounded hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-medium">
              {format(viewMonth, "MMMM yyyy")}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              className="p-1 rounded hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="h-6 flex items-center justify-center text-[10px] text-muted-foreground/60 font-medium"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="h-7" />;
              }

              const isCurrentMonth = isSameMonth(day, viewMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  className={cn(
                    "h-7 w-full flex items-center justify-center text-xs rounded transition-colors",
                    !isCurrentMonth && "text-muted-foreground/30",
                    isCurrentMonth &&
                      !isSelected &&
                      !isTodayDate &&
                      "text-foreground hover:bg-muted/50",
                    isTodayDate &&
                      !isSelected &&
                      "bg-primary/20 text-primary font-medium",
                    isSelected &&
                      "bg-primary text-primary-foreground font-medium"
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});

// ============================================
// TaskModal Component
// ============================================

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
  // Ref for date picker (keyboard shortcut @)
  const datePickerRef = React.useRef<DatePickerPopoverRef>(null);

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

  // Handle scheduled date change
  const handleScheduledDateChange = async (newDate: string | null) => {
    if (!task) return;
    await updateTask.mutateAsync({
      id: task.id,
      data: { scheduledDate: newDate },
    });
  };

  // Handle keyboard shortcuts: F for focus, E for actual time, W for planned time, D/Z/Shift+Z for date, @ for date input
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

      // D - Snooze one day (move to tomorrow)
      if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        const tomorrow = addDays(new Date(), 1);
        const formattedDate = format(tomorrow, "yyyy-MM-dd");
        handleScheduledDateChange(formattedDate);
        toast({
          title: "Snoozed one day",
          description: `"${task.title}" scheduled for ${format(tomorrow, "EEEE, MMM d")}.`,
        });
        return;
      }

      // Shift+Z - Move to next week (next Monday)
      if ((e.key === "z" || e.key === "Z") && e.shiftKey) {
        e.preventDefault();
        const today = new Date();
        const nextMonday = addDays(startOfWeek(today, { weekStartsOn: 1 }), 7);
        const formattedDate = format(nextMonday, "yyyy-MM-dd");
        handleScheduledDateChange(formattedDate);
        toast({
          title: "Moved to next week",
          description: `"${task.title}" scheduled for ${format(nextMonday, "EEEE, MMM d")}.`,
        });
        return;
      }

      // Z - Move to backlog (without shift)
      if ((e.key === "z" || e.key === "Z") && !e.shiftKey) {
        e.preventDefault();
        handleScheduledDateChange(null);
        toast({
          title: "Moved to backlog",
          description: `"${task.title}" removed from schedule.`,
        });
        return;
      }

      // @ - Focus date input
      if (e.key === "@" || (e.shiftKey && e.key === "2")) {
        e.preventDefault();
        datePickerRef.current?.open();
        setTimeout(() => datePickerRef.current?.focusInput(), 100);
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
        {/* Top toolbar - minimal metadata and actions */}
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border/50">
          {/* Left side - START date with label */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                Start
              </span>
              <DatePickerPopover
                ref={datePickerRef}
                value={task.scheduledDate}
                onChange={handleScheduledDateChange}
                taskTitle={task.title}
              />
            </div>
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
                {!task.seriesId && (
                  <DropdownMenuItem onSelect={() => setRepeatDialogOpen(true)}>
                    <Repeat className="mr-2 h-4 w-4" />
                    Repeat...
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onSelect={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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

        {/* Title section - full width, wraps properly */}
        <div className="px-6 pt-5 pb-4">
          <div className="flex items-start gap-3">
            {/* Checkbox */}
            <button
              type="button"
              className={cn(
                "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                isCompleted
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/30 hover:border-primary"
              )}
              onClick={handleToggleComplete}
            >
              {isCompleted && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            </button>

            {/* Title - textarea for multi-line */}
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => title !== task.title && handleSave()}
              rows={1}
              className={cn(
                "flex-1 min-w-0 resize-none border-none p-0 text-xl font-semibold shadow-none focus:outline-none focus:ring-0 bg-transparent leading-tight",
                isCompleted && "line-through text-muted-foreground"
              )}
              placeholder="Task title"
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = target.scrollHeight + "px";
              }}
            />
          </div>
        </div>

        {/* Time tracking section - centered, clean design */}
        <div className="px-6 pb-5 flex flex-col items-center">
          {/* Time display */}
          <div className="flex items-center gap-8 mb-4">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">
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
                size="lg"
                className="font-mono text-3xl font-light text-foreground"
              />
            </div>

            {/* Separator */}
            <span className="text-3xl font-light text-muted-foreground/30">
              /
            </span>

            <div className="flex flex-col items-center">
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">
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
                size="lg"
                className="font-mono text-3xl font-light text-muted-foreground/50"
              />
            </div>
          </div>

          {/* Estimated time display */}
          {plannedMins && (
            <p className="text-xs text-muted-foreground/60 mb-3">
              Estimated:{" "}
              {plannedMins >= 60 ? `${Math.floor(plannedMins / 60)}h` : ""}
              {plannedMins % 60 > 0
                ? `${plannedMins % 60}m`
                : plannedMins >= 60
                  ? ""
                  : `${plannedMins}m`}
            </p>
          )}

          {/* Start button - border style */}
          <button
            onClick={handleExpandToFocus}
            className="flex items-center gap-2 px-4 py-2 rounded-md border border-border hover:bg-muted/50 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Play className="h-3.5 w-3.5" />
            Start
          </button>
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
