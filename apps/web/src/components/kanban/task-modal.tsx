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
import { Plus, Clock, Trash2 } from "lucide-react";
import type { Task } from "@chronoflow/types";
import { useUpdateTask, useDeleteTask } from "@/hooks/useTasks";

import {
  Dialog,
  DialogContent,
  Input,
} from "@/components/ui";
import { SortableSubtaskItem, type Subtask } from "./sortable-subtask-item";
import { NotesField } from "./task-modal-form";

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

export function TaskModal({ task, open, onOpenChange }: TaskModalProps) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [plannedMins, setPlannedMins] = React.useState<number | null>(null);
  const [subtasks, setSubtasks] = React.useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState("");
  const [isAddingSubtask, setIsAddingSubtask] = React.useState(false);

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

  const subtaskIds = subtasks.map((st) => st.id);

  if (!task) return null;

  const scheduledDate = task.scheduledDate
    ? format(new Date(task.scheduledDate), "EEEE, MMMM d")
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        {/* Header - Title with checkbox and date */}
        <div className="px-4 pt-4 pb-3 border-b">
          <div className="flex items-start gap-3 pr-6">
            {/* Checkbox */}
            <button
              className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/40 hover:border-primary transition-colors"
              onClick={() => {
                // Toggle complete would go here
              }}
            />

            {/* Title and date */}
            <div className="flex-1 min-w-0">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => title !== task.title && handleSave()}
                className="border-none p-0 text-base font-medium shadow-none focus-visible:ring-0 h-auto"
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
                      onToggle={() => toggleSubtask(subtask.id)}
                      onDelete={() => deleteSubtask(subtask.id)}
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
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatTimeDisplay(plannedMins)}</span>
          </div>
          
          <button
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
