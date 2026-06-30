import * as React from "react";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, MoreHorizontal, Pencil, Trash2, GripVertical } from "lucide-react";
import type { Idea, IdeaColumn as IdeaColumnType } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import {
  Input,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui";
import { useDeleteIdeaColumn, useUpdateIdeaColumn } from "@/hooks/useIdeas";
import { IdeaCard } from "./idea-card";
import { AddIdeaModal } from "./add-idea-modal";

interface IdeaColumnProps {
  boardId: string;
  column: IdeaColumnType;
  ideas: Idea[];
  allColumns: IdeaColumnType[];
  canDelete: boolean;
  /** True while a card is being dragged anywhere on the board. */
  isDragActive: boolean;
}

export function IdeaColumnView({
  boardId,
  column,
  ideas,
  allColumns,
  canDelete,
  isDragActive,
}: IdeaColumnProps) {
  const [addOpen, setAddOpen] = React.useState(false);
  const [renaming, setRenaming] = React.useState(false);
  const [nameDraft, setNameDraft] = React.useState(column.name);

  const updateColumn = useUpdateIdeaColumn(boardId);
  const deleteColumn = useDeleteIdeaColumn(boardId);

  // The column is both draggable (reorder) and a drop target for cards.
  // useSortable provides both, so we don't register a separate droppable
  // with the same id.
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isOver,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: "column", columnId: column.id, column },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  const ideaIds = React.useMemo(() => ideas.map((i) => i.id), [ideas]);

  const submitRename = () => {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== column.name) {
      updateColumn.mutate({ id: column.id, input: { name: trimmed } });
    }
    setRenaming(false);
  };

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/col flex w-[272px] shrink-0 snap-start snap-always flex-col gap-2 rounded-xl border border-border/60 bg-muted/40 p-2.5 transition-colors",
        isOver && "border-primary/40 bg-primary/5"
      )}
    >
      {/* Column header. No flex `gap` here — the grip handle manages its own
          spacing so it can collapse to zero width when not hovered. */}
      <div className="flex items-center px-1">
        {renaming ? (
          <Input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitRename();
              if (e.key === "Escape") {
                setNameDraft(column.name);
                setRenaming(false);
              }
            }}
            className="h-7 text-[13px] font-semibold"
            maxLength={120}
          />
        ) : (
          <>
            {/* Drag handle collapses to zero width when idle (title stays
                flush-left, aligned with the cards) and expands in-flow on
                hover — so space is *made* for the icon and the title slides
                right, rather than the icon overlapping anything. */}
            <button
              {...attributes}
              {...listeners}
              aria-label="Drag to reorder column"
              className="flex w-0 shrink-0 cursor-grab touch-none items-center overflow-hidden text-muted-foreground/70 opacity-0 transition-all duration-150 group-hover/col:mr-1 group-hover/col:w-4 group-hover/col:opacity-100 active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4 shrink-0" />
            </button>
            <span className="text-[13px] font-semibold">{column.name}</span>
            <span className="ml-2 grid h-[18px] min-w-[20px] place-items-center rounded-full border border-border/60 bg-background px-1.5 text-[11px] font-medium tabular-nums text-muted-foreground">
              {ideas.length}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="ml-auto flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
                  aria-label="Column actions"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={() => {
                    setNameDraft(column.name);
                    setRenaming(true);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!canDelete}
                  className={cn(
                    canDelete &&
                      "text-destructive focus:text-destructive focus:bg-destructive/10"
                  )}
                  onClick={() => canDelete && deleteColumn.mutate(column.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete column
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      {/* Cards */}
      <div className="flex min-h-[8px] flex-col gap-2 overflow-y-auto scrollbar-thin">
        <SortableContext items={ideaIds} strategy={verticalListSortingStrategy}>
          {ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              boardId={boardId}
              columns={allColumns}
            />
          ))}
        </SortableContext>

        {/* Drop placeholder only appears during a drag — an idle empty column
            takes up no space (just its "Add idea" button below). */}
        {ideas.length === 0 && isDragActive && (
          <div className="rounded-lg border border-dashed border-border/60 px-2.5 py-4 text-center text-xs leading-relaxed text-muted-foreground">
            Drop here
          </div>
        )}
      </div>

      {/* Add idea — opens the modal (same chrome as Add Task) */}
      <button
        onClick={() => setAddOpen(true)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
      >
        <Plus className="h-4 w-4" />
        Add idea
      </button>

      {addOpen && (
        <AddIdeaModal
          open={addOpen}
          onOpenChange={setAddOpen}
          boardId={boardId}
          columnId={column.id}
          columnName={column.name}
        />
      )}
    </section>
  );
}
