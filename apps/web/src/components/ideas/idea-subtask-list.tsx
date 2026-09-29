import * as React from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, X } from "lucide-react";
import type { IdeaSubtask } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { SubtaskAddRow } from "@/components/kanban/subtask-add-row";
import {
  useIdeaSubtasks,
  useCreateIdeaSubtask,
  useUpdateIdeaSubtask,
  useDeleteIdeaSubtask,
  useReorderIdeaSubtasks,
} from "@/hooks/useIdeaSubtasks";

interface IdeaSubtaskItemProps {
  subtask: IdeaSubtask;
  onToggle: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}

function IdeaSubtaskItem({
  subtask,
  onToggle,
  onDelete,
  onRename,
}: IdeaSubtaskItemProps) {
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(subtask.title);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: subtask.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const save = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== subtask.title) onRename(trimmed);
    else setValue(subtask.title);
    setEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 rounded-md px-1 py-1.5 transition-colors hover:bg-muted/40",
        isDragging && "opacity-50"
      )}
    >
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </span>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-all",
          subtask.completed
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/40 hover:border-primary"
        )}
      >
        {subtask.completed && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
      </button>
      {editing ? (
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            } else if (e.key === "Escape") {
              setValue(subtask.title);
              setEditing(false);
            }
          }}
          className="flex-1 border-none bg-transparent p-0 text-sm outline-none focus:ring-0"
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          className={cn(
            "flex-1 cursor-text text-sm",
            subtask.completed && "text-muted-foreground line-through"
          )}
        >
          {subtask.title}
        </span>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={onDelete}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

/** Live subtask list for the idea editor — add / toggle / rename / reorder. */
export function IdeaSubtaskList({ ideaId }: { ideaId: string }) {
  const { data: subtasks = [] } = useIdeaSubtasks(ideaId);
  const createSubtask = useCreateIdeaSubtask();
  const updateSubtask = useUpdateIdeaSubtask();
  const deleteSubtask = useDeleteIdeaSubtask();
  const reorderSubtasks = useReorderIdeaSubtasks();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const ids = React.useMemo(() => subtasks.map((s) => s.id), [subtasks]);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = subtasks.findIndex((s) => s.id === active.id);
    const newIndex = subtasks.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(subtasks, oldIndex, newIndex);
    reorderSubtasks.mutate({ ideaId, subtaskIds: next.map((s) => s.id) });
  };

  return (
    <div className="space-y-1">
      {subtasks.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div className="space-y-0.5">
              {subtasks.map((subtask) => (
                <IdeaSubtaskItem
                  key={subtask.id}
                  subtask={subtask}
                  onToggle={() =>
                    updateSubtask.mutate({
                      ideaId,
                      subtaskId: subtask.id,
                      input: { completed: !subtask.completed },
                    })
                  }
                  onDelete={() =>
                    deleteSubtask.mutate({ ideaId, subtaskId: subtask.id })
                  }
                  onRename={(title) =>
                    updateSubtask.mutate({
                      ideaId,
                      subtaskId: subtask.id,
                      input: { title },
                    })
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <SubtaskAddRow
        onAdd={(titles) => {
          for (const title of titles) {
            createSubtask.mutate({ ideaId, input: { title: title.slice(0, 500) } });
          }
        }}
      />
    </div>
  );
}
