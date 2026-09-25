import * as React from "react";
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
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import type { Subtask } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import {
  useSubtasks,
  useCreateSubtask,
  useUpdateSubtask,
  useDeleteSubtask,
  useReorderSubtasks,
} from "@/hooks/useSubtasks";
import { SortableSubtaskItem } from "./sortable-subtask-item";
import { SubtaskAddRow } from "./subtask-add-row";

interface SubtaskChecklistProps {
  taskId: string;
  /** Lets a parent (e.g. an "Add subtask" button) focus the add field. */
  addInputRef?: React.Ref<HTMLInputElement>;
  className?: string;
}

// Rows created optimistically don't exist on the server until the create resolves.
const isPending = (subtask: Subtask) => subtask.id.startsWith("optimistic-");

/**
 * The subtask checklist used by both the task modal and focus mode:
 * progress header, drag-to-reorder rows and an always-visible add row.
 */
export function SubtaskChecklist({
  taskId,
  addInputRef,
  className,
}: SubtaskChecklistProps) {
  const { data: subtasks = [], isLoading } = useSubtasks(taskId);
  const createSubtask = useCreateSubtask();
  const updateSubtask = useUpdateSubtask();
  const deleteSubtask = useDeleteSubtask();
  const reorderSubtasks = useReorderSubtasks();

  // Each add claims the next position up front: quick successive adds (or a
  // pasted list) fire parallel requests that can land out of order.
  // Callers key this component by taskId, so the counter never crosses tasks.
  const nextPosition = React.useRef(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleAdd = (titles: string[]) => {
    const serverMax = subtasks
      .filter((s) => !isPending(s))
      .reduce((max, s) => Math.max(max, s.position), -1);
    nextPosition.current = Math.max(nextPosition.current, serverMax + 1);
    for (const title of titles) {
      createSubtask.mutate({
        taskId,
        data: { title: title.slice(0, 500), position: nextPosition.current++ },
      });
    }
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = subtasks.findIndex((s) => s.id === active.id);
    const newIndex = subtasks.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(subtasks, oldIndex, newIndex);
    if (next.some(isPending)) return;
    reorderSubtasks.mutate({ taskId, subtaskIds: next.map((s) => s.id) });
  };

  const done = subtasks.filter((s) => s.completed).length;
  const total = subtasks.length;

  if (isLoading) {
    return (
      <div className={cn("space-y-1.5", className)}>
        <div className="h-7 animate-pulse rounded-md bg-muted/40" />
        <div className="h-7 w-2/3 animate-pulse rounded-md bg-muted/30" />
      </div>
    );
  }

  return (
    <div className={className}>
      {total > 0 && (
        <div className="mb-1.5 flex items-center gap-2.5">
          <span className="text-xs font-medium text-muted-foreground">
            Subtasks
          </span>
          <div
            className="h-1 w-16 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={done}
            aria-label="Subtasks completed"
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-300 ease-out",
                done === total ? "bg-emerald-500" : "bg-primary"
              )}
              style={{ width: `${(done / total) * 100}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-muted-foreground/70">
            {done}/{total}
          </span>
        </div>
      )}

      {total > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={subtasks.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-px">
              {subtasks.map((subtask) => (
                <SortableSubtaskItem
                  key={subtask.id}
                  subtask={subtask}
                  onToggle={() => {
                    if (isPending(subtask)) return;
                    updateSubtask.mutate({
                      taskId,
                      subtaskId: subtask.id,
                      data: { completed: !subtask.completed },
                    });
                  }}
                  onDelete={() => {
                    if (isPending(subtask)) return;
                    deleteSubtask.mutate({ taskId, subtaskId: subtask.id });
                  }}
                  onUpdate={(title) => {
                    if (isPending(subtask)) return;
                    updateSubtask.mutate({
                      taskId,
                      subtaskId: subtask.id,
                      data: { title },
                    });
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <SubtaskAddRow ref={addInputRef} onAdd={handleAdd} />
    </div>
  );
}
