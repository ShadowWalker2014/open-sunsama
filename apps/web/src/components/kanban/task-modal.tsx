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
import { Calendar, Trash2, Plus } from "lucide-react";
import type { Task, TaskPriority } from "@chronoflow/types";
import { useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  Button,
  Input,
} from "@/components/ui";
import { SortableSubtaskItem, type Subtask } from "./sortable-subtask-item";
import {
  DescriptionField,
  InlinePrioritySelector,
  EstimatedTimeField,
} from "./task-modal-form";

interface TaskModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskModal({ task, open, onOpenChange }: TaskModalProps) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [estimatedMins, setEstimatedMins] = React.useState<string>("");
  const [priority, setPriority] = React.useState<TaskPriority>("P2");
  const [subtasks, setSubtasks] = React.useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState("");
  const [isEditingDescription, setIsEditingDescription] = React.useState(false);

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
      setEstimatedMins(task.estimatedMins?.toString() || "");
      setPriority(task.priority || "P2");
      setSubtasks([]);
      setIsEditingDescription(false);
    }
  }, [task]);

  const handleSave = async () => {
    if (!task || !title.trim()) return;
    await updateTask.mutateAsync({
      id: task.id,
      data: {
        title: title.trim(),
        notes: description || null,
        estimatedMins: estimatedMins ? parseInt(estimatedMins, 10) : null,
        priority,
      },
    });
  };

  const handlePriorityChange = async (newPriority: TaskPriority) => {
    setPriority(newPriority);
    if (task && newPriority !== task.priority) {
      await updateTask.mutateAsync({ id: task.id, data: { priority: newPriority } });
    }
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

  const completedSubtasks = subtasks.filter((st) => st.completed).length;
  const subtaskIds = subtasks.map((st) => st.id);

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-3 border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => title !== task.title && handleSave()}
                className="border-none p-0 text-base font-medium shadow-none focus-visible:ring-0 h-auto"
                placeholder="Task title"
              />
              {task.scheduledDate && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(task.scheduledDate), "EEEE, MMMM d")}
                </div>
              )}
            </div>
            <InlinePrioritySelector priority={priority} onChange={handlePriorityChange} />
          </div>
        </DialogHeader>

        <div className="px-4 py-3 space-y-4 max-h-[55vh] overflow-y-auto">
          {/* Subtasks - now first */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Subtasks
              </span>
              {subtasks.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {completedSubtasks}/{subtasks.length}
                </span>
              )}
            </div>

            {subtasks.length > 0 && (
              <div className="h-0.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(completedSubtasks / subtasks.length) * 100}%` }}
                />
              </div>
            )}

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSubtaskDragEnd}>
              <SortableContext items={subtaskIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-0.5">
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

            <div className="flex items-center gap-2">
              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSubtask())}
                placeholder="Add a subtask..."
                className="border-none p-0 h-auto text-sm shadow-none focus-visible:ring-0"
              />
            </div>
          </div>

          {/* Notes - now second */}
          <DescriptionField
            description={description}
            isEditing={isEditingDescription}
            onEditingChange={setIsEditingDescription}
            onChange={setDescription}
            onBlur={() => {
              if (description !== (task.notes || "")) handleSave();
              setIsEditingDescription(false);
            }}
          />

          {/* Estimated Time - now third, no priority section */}
          <EstimatedTimeField
            value={estimatedMins}
            onChange={setEstimatedMins}
            onBlur={() => estimatedMins !== (task.estimatedMins?.toString() || "") && handleSave()}
          />
        </div>

        <div className="px-4 py-2.5 border-t bg-muted/20 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete
          </Button>
          <div className="text-[10px] text-muted-foreground">
            Created {format(new Date(task.createdAt), "MMM d, yyyy")}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
