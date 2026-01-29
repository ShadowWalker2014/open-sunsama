import * as React from "react";
import { format } from "date-fns";
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
  Calendar,
  Play,
  Plus,
  MoreHorizontal,
  Maximize2,
  X,
  Hash,
} from "lucide-react";
import type { Task } from "@chronoflow/types";
import { useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  Button,
  Input,
} from "@/components/ui";
import { SortableSubtaskItem, type Subtask } from "./sortable-subtask-item";
import { NotesField } from "./task-modal-form";

interface TaskModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper to format time display (e.g., "0:10" for 10 minutes)
function formatTimeColumn(mins: number | null | undefined): string {
  if (!mins) return "--:--";
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return `${hours}:${minutes.toString().padStart(2, "0")}`;
}

export function TaskModal({ task, open, onOpenChange }: TaskModalProps) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [plannedMins, setPlannedMins] = React.useState<number | null>(null);
  const [subtasks, setSubtasks] = React.useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState("");
  const [isAddingSubtask, setIsAddingSubtask] = React.useState(false);
  const [editingPlannedTime, setEditingPlannedTime] = React.useState(false);
  const [plannedTimeInput, setPlannedTimeInput] = React.useState("");

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  React.useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.notes || "");
      setPlannedMins(task.estimatedMins || null);
      setSubtasks([]);
      setIsAddingSubtask(false);
      setEditingPlannedTime(false);
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

  const handleDelete = async () => {
    if (!task) return;
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTask.mutateAsync(task.id);
      onOpenChange(false);
    }
  };

  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSubtask: Subtask = {
      id: `temp-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    setSubtasks([...subtasks, newSubtask]);
    setNewSubtaskTitle("");
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(subtasks.map((st) => (st.id === id ? { ...st, completed: !st.completed } : st)));
  };

  const deleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== id));
  };

  const handleSubtaskDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSubtasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handlePlannedTimeClick = () => {
    setPlannedTimeInput(plannedMins ? plannedMins.toString() : "");
    setEditingPlannedTime(true);
  };

  const handlePlannedTimeSubmit = async () => {
    const mins = parseInt(plannedTimeInput, 10);
    if (!isNaN(mins) && mins > 0) {
      setPlannedMins(mins);
      if (task) {
        await updateTask.mutateAsync({
          id: task.id,
          data: { estimatedMins: mins },
        });
      }
    }
    setEditingPlannedTime(false);
  };

  const subtaskIds = subtasks.map((st) => st.id);

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Top Bar - Sunsama style */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Channel
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 -ml-1.5 text-xs font-medium gap-1 hover:bg-muted"
              >
                <Hash className="h-3 w-3 text-muted-foreground" />
                <span>General</span>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <div className="flex flex-col items-end mr-2">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Start
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-xs font-medium hover:bg-muted"
                >
                  {task.scheduledDate
                    ? format(new Date(task.scheduledDate), "EEE")
                    : "Today"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-muted"
                >
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              Due
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs font-medium text-muted-foreground hover:bg-muted gap-1"
              onClick={() => setIsAddingSubtask(true)}
            >
              <Plus className="h-3 w-3" />
              Subtasks
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:bg-muted"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:bg-muted"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:bg-muted"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Title Row with Time Columns */}
          <div className="flex items-start gap-3">
            {/* Checkbox */}
            <button
              className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/40 hover:border-primary transition-colors"
              onClick={() => {
                // Toggle complete would go here
              }}
            />

            {/* Title Input */}
            <div className="flex-1 min-w-0">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => title !== task.title && handleSave()}
                className="border-none p-0 text-lg font-medium shadow-none focus-visible:ring-0 h-auto"
                placeholder="Task title"
              />
            </div>

            {/* Start Button */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 gap-1.5 text-xs font-medium shrink-0"
            >
              <Play className="h-3 w-3 fill-current" />
              Start
            </Button>

            {/* Time Columns Header */}
            <div className="flex gap-4 text-center shrink-0">
              <div className="w-14">
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                  Actual
                </div>
                <div className="text-sm font-mono text-muted-foreground">
                  --:--
                </div>
              </div>
              <div className="w-14">
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                  Planned
                </div>
                {editingPlannedTime ? (
                  <Input
                    type="number"
                    value={plannedTimeInput}
                    onChange={(e) => setPlannedTimeInput(e.target.value)}
                    onBlur={handlePlannedTimeSubmit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handlePlannedTimeSubmit();
                      }
                      if (e.key === "Escape") {
                        setEditingPlannedTime(false);
                      }
                    }}
                    className="h-5 w-14 text-sm font-mono text-center p-0 border-b border-t-0 border-l-0 border-r-0 rounded-none shadow-none focus-visible:ring-0"
                    placeholder="mins"
                    autoFocus
                    min={1}
                  />
                ) : (
                  <button
                    onClick={handlePlannedTimeClick}
                    className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {formatTimeColumn(plannedMins)}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Subtasks Section */}
          <div className="space-y-1 pl-8">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSubtaskDragEnd}>
              <SortableContext items={subtaskIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-0">
                  {subtasks.map((subtask) => (
                    <SortableSubtaskItem
                      key={subtask.id}
                      subtask={subtask}
                      onToggle={() => toggleSubtask(subtask.id)}
                      onDelete={() => deleteSubtask(subtask.id)}
                      showTimeColumns
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
                <div className="flex gap-4 text-center shrink-0">
                  <div className="w-14 text-sm font-mono text-muted-foreground">--:--</div>
                  <div className="w-14 text-sm font-mono text-muted-foreground">--:--</div>
                </div>
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
          <div className="pl-8 pt-2">
            <NotesField
              notes={description}
              onChange={setDescription}
              onBlur={() => {
                if (description !== (task.notes || "")) handleSave();
              }}
            />
          </div>
        </div>

        {/* Footer with metadata */}
        <div className="px-4 py-2 border-t bg-muted/20 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
          >
            Delete task
          </Button>
          <div className="text-[10px] text-muted-foreground">
            Created {format(new Date(task.createdAt), "MMM d, yyyy")}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
