import * as React from "react";
import { Plus, Check, X, GripVertical } from "lucide-react";
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Button, Input } from "@/components/ui";
import type { Subtask } from "@open-sunsama/types";
import {
  useSubtasks,
  useCreateSubtask,
  useUpdateSubtask,
  useDeleteSubtask,
  useReorderSubtasks,
} from "@/hooks/useSubtasks";

interface FocusSubtasksProps {
  taskId: string;
}

/**
 * Subtasks section for focus mode with drag-and-drop reordering
 */
export function FocusSubtasks({ taskId }: FocusSubtasksProps) {
  const { data: subtasks = [], isLoading } = useSubtasks(taskId);
  const createSubtask = useCreateSubtask();
  const updateSubtask = useUpdateSubtask();
  const deleteSubtask = useDeleteSubtask();
  const reorderSubtasks = useReorderSubtasks();

  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState("");

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

  const handleAddSubtask = async () => {
    const title = newSubtaskTitle.trim();
    if (!title) return;

    await createSubtask.mutateAsync({
      taskId,
      data: { title },
    });
    setNewSubtaskTitle("");
  };

  const handleToggleSubtask = async (subtask: Subtask) => {
    await updateSubtask.mutateAsync({
      taskId,
      subtaskId: subtask.id,
      data: { completed: !subtask.completed },
    });
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    await deleteSubtask.mutateAsync({ taskId, subtaskId });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = subtasks.findIndex((s) => s.id === active.id);
    const newIndex = subtasks.findIndex((s) => s.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder the array
    const newOrder = [...subtasks];
    const removed = newOrder[oldIndex];
    if (!removed) return;
    newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, removed);

    await reorderSubtasks.mutateAsync({
      taskId,
      subtaskIds: newOrder.map((s) => s.id),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Subtasks</h3>
        <div className="animate-pulse space-y-2">
          <div className="h-8 bg-muted rounded" />
          <div className="h-8 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Subtasks</h3>

      {/* Subtask list with drag-and-drop */}
      {subtasks.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={subtasks.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {subtasks.map((subtask) => (
                <SortableSubtaskItem
                  key={subtask.id}
                  subtask={subtask}
                  onToggle={() => handleToggleSubtask(subtask)}
                  onDelete={() => handleDeleteSubtask(subtask.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add subtask input */}
      <div className="flex items-center gap-2 pl-1">
        <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddSubtask();
            }
          }}
          placeholder="Add a subtask..."
          className="border-none p-0 h-auto text-sm shadow-none focus-visible:ring-0"
          disabled={createSubtask.isPending}
        />
      </div>
    </div>
  );
}

interface SortableSubtaskItemProps {
  subtask: Subtask;
  onToggle: () => void;
  onDelete: () => void;
}

function SortableSubtaskItem({
  subtask,
  onToggle,
  onDelete,
}: SortableSubtaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subtask.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isCompleted = subtask.completed;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 py-2 px-2 -mx-2 rounded-md",
        "hover:bg-muted/50 transition-colors",
        isDragging && "opacity-50 bg-muted"
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity touch-none"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
          isCompleted
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/40 hover:border-primary"
        )}
      >
        {isCompleted && <Check className="h-3 w-3" strokeWidth={3} />}
      </button>

      {/* Title */}
      <span
        className={cn(
          "flex-1 text-sm",
          isCompleted && "line-through text-muted-foreground"
        )}
      >
        {subtask.title}
      </span>

      {/* Delete button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onDelete}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
