import * as React from "react";
import { Plus } from "lucide-react";
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
} from "@dnd-kit/sortable";
import { Input } from "@/components/ui";
import type { Subtask } from "@open-sunsama/types";
import {
  useSubtasks,
  useCreateSubtask,
  useUpdateSubtask,
  useDeleteSubtask,
  useReorderSubtasks,
} from "@/hooks/useSubtasks";
import { SortableSubtaskItem } from "@/components/kanban/sortable-subtask-item";

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
        <div className="animate-pulse space-y-2">
          <div className="h-8 bg-muted/30 rounded" />
          <div className="h-8 bg-muted/30 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
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
                  onUpdate={(newTitle) =>
                    updateSubtask.mutate({
                      taskId,
                      subtaskId: subtask.id,
                      data: { title: newTitle },
                    })
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add subtask input */}
      <div className="flex items-center gap-2 py-1 px-2 -mx-2 rounded-md hover:bg-muted/30 transition-colors">
        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px] border-dashed border-muted-foreground/20">
          <Plus className="h-2.5 w-2.5 text-muted-foreground/40" />
        </div>
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
          className="border-none p-0 h-auto text-[13px] shadow-none focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/40"
          disabled={createSubtask.isPending}
        />
      </div>
    </div>
  );
}
