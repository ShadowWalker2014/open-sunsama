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
import { Calendar, Clock, Trash2, Plus } from "lucide-react";
import type { Task, TaskPriority } from "@chronoflow/types";
import { cn } from "@/lib/utils";
import { useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  Button,
  Input,
  Label,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { HtmlContent } from "@/components/ui/html-content";
import { PriorityIcon, PRIORITY_LABELS } from "@/components/ui/priority-badge";
import { SortableSubtaskItem, type Subtask } from "./sortable-subtask-item";

interface TaskModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRIORITIES: TaskPriority[] = ["P0", "P1", "P2", "P3"];

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

  // Subtask drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize form when task changes
  React.useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.notes || "");
      setEstimatedMins(task.estimatedMins?.toString() || "");
      setPriority(task.priority || "P2");
      // TODO: Load subtasks from API when implemented
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
      await updateTask.mutateAsync({
        id: task.id,
        data: { priority: newPriority },
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

  const handleTitleBlur = () => {
    if (title !== task?.title) {
      handleSave();
    }
  };

  const handleDescriptionBlur = () => {
    if (description !== (task?.notes || "")) {
      handleSave();
    }
    setIsEditingDescription(false);
  };

  const handleEstimatedMinsBlur = () => {
    if (estimatedMins !== (task?.estimatedMins?.toString() || "")) {
      handleSave();
    }
  };

  // Subtask handlers
  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSubtask: Subtask = {
      id: `temp-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    setSubtasks([...subtasks, newSubtask]);
    setNewSubtaskTitle("");
    // TODO: Create subtask via API when implemented
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(
      subtasks.map((st) =>
        st.id === id ? { ...st, completed: !st.completed } : st
      )
    );
    // TODO: Update subtask via API when implemented
  };

  const deleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== id));
    // TODO: Delete subtask via API when implemented
  };

  const handleSubtaskDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSubtasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex);
        // TODO: Call reorder API when implemented
        return reordered;
      });
    }
  };

  const completedSubtasks = subtasks.filter((st) => st.completed).length;
  const subtaskIds = subtasks.map((st) => st.id);

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex-1">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              className="border-none p-0 text-lg font-semibold shadow-none focus-visible:ring-0 h-auto pr-8"
              placeholder="Task title"
            />
            {task.scheduledDate && (
              <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(task.scheduledDate), "EEEE, MMMM d")}
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 py-4 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Description */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Description
            </Label>
            {isEditingDescription ? (
              <div onBlur={handleDescriptionBlur}>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Add a more detailed description..."
                  minHeight="150px"
                />
              </div>
            ) : (
              <div
                onClick={() => setIsEditingDescription(true)}
                className={cn(
                  "min-h-[80px] rounded-md border border-transparent px-3 py-2 cursor-text transition-colors",
                  "hover:border-input hover:bg-muted/30",
                  !description && "text-muted-foreground"
                )}
              >
                {description ? (
                  <HtmlContent html={description} />
                ) : (
                  <span className="text-sm">Add a description...</span>
                )}
              </div>
            )}
          </div>

          {/* Subtasks with drag-and-drop */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Subtasks
              </Label>
              {subtasks.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {completedSubtasks}/{subtasks.length} done
                </span>
              )}
            </div>

            {/* Progress bar */}
            {subtasks.length > 0 && (
              <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{
                    width: `${(completedSubtasks / subtasks.length) * 100}%`,
                  }}
                />
              </div>
            )}

            {/* Subtask list with dnd-kit */}
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
                      onToggle={() => toggleSubtask(subtask.id)}
                      onDelete={() => deleteSubtask(subtask.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Add subtask */}
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-muted-foreground" />
              <Input
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSubtask();
                  }
                }}
                placeholder="Add a subtask..."
                className="border-none p-0 h-auto text-sm shadow-none focus-visible:ring-0"
              />
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Priority
            </Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-fit gap-2 h-9"
                >
                  <PriorityIcon priority={priority} />
                  <span>{PRIORITY_LABELS[priority]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                {PRIORITIES.map((p) => (
                  <DropdownMenuItem
                    key={p}
                    onClick={() => handlePriorityChange(p)}
                    className={cn(
                      "gap-2",
                      priority === p && "bg-accent"
                    )}
                  >
                    <PriorityIcon priority={p} />
                    <span>{PRIORITY_LABELS[p]}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Estimated time */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Estimated Time
            </Label>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                value={estimatedMins}
                onChange={(e) => setEstimatedMins(e.target.value)}
                onBlur={handleEstimatedMinsBlur}
                placeholder="Minutes"
                className="w-24"
                min={1}
                max={480}
              />
              <span className="text-sm text-muted-foreground">minutes</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <div className="text-xs text-muted-foreground">
            Created {format(new Date(task.createdAt), "MMM d, yyyy")}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
