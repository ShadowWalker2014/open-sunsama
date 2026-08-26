import * as React from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { Plus, Loader2, GripVertical } from "lucide-react";
import type { Idea, IdeaColumn } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui";
import {
  useIdeaColumns,
  useIdeas,
  useReorderIdeas,
  useReorderIdeaColumns,
  useCreateIdeaColumn,
} from "@/hooks/useIdeas";
import { ideaPriorityCollision } from "@/lib/dnd/ideas-collision";
import { IdeaColumnView } from "./idea-column";
import { IdeaCard } from "./idea-card";
import { IdeaEditDialog } from "./idea-edit-dialog";

interface IdeasBoardViewProps {
  boardId: string;
  /** Case-insensitive substring filter on title + notes; "" shows everything. */
  searchQuery?: string;
  /** Idea to open on arrival — set by the command palette's `?idea=` param. */
  focusIdeaId?: string;
}

function sortByPosition(a: Idea, b: Idea) {
  return a.position - b.position || (a.createdAt < b.createdAt ? -1 : 1);
}

export function IdeasBoardView({
  boardId,
  searchQuery = "",
  focusIdeaId,
}: IdeasBoardViewProps) {
  const { data: columns, isLoading: columnsLoading } = useIdeaColumns(boardId);
  const { data: ideas, isLoading: ideasLoading } = useIdeas(boardId);
  const reorderIdeas = useReorderIdeas(boardId);
  const reorderColumns = useReorderIdeaColumns(boardId);
  const createColumn = useCreateIdeaColumn();

  const [activeIdea, setActiveIdea] = React.useState<Idea | null>(null);
  const [activeColumn, setActiveColumn] = React.useState<IdeaColumn | null>(
    null
  );
  const [addingColumn, setAddingColumn] = React.useState(false);
  const [columnDraft, setColumnDraft] = React.useState("");

  // Mouse: instant distance-based drag; Touch: press-and-hold so swipes scroll.
  // No KeyboardSensor — Space/Enter on a focused card would start an accidental
  // keyboard drag (cards keep focus after a mouse drag).
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    })
  );

  // Board search — matches the card title and the plain text of its notes.
  const query = searchQuery.trim().toLowerCase();
  const isFiltering = query.length > 0;

  // Group ideas by column, each sorted by position.
  const ideasByColumn = React.useMemo(() => {
    const map = new Map<string, Idea[]>();
    for (const col of columns ?? []) map.set(col.id, []);
    for (const idea of ideas ?? []) {
      if (query) {
        const notes = idea.notes?.replace(/<[^>]*>/g, " ") ?? "";
        const match =
          idea.title.toLowerCase().includes(query) ||
          notes.toLowerCase().includes(query);
        if (!match) continue;
      }
      const list = map.get(idea.columnId);
      if (list) list.push(idea);
    }
    for (const list of map.values()) list.sort(sortByPosition);
    return map;
  }, [columns, ideas, query]);

  const matchCount = React.useMemo(() => {
    let total = 0;
    for (const list of ideasByColumn.values()) total += list.length;
    return total;
  }, [ideasByColumn]);

  const sortedColumns = React.useMemo(
    () => [...(columns ?? [])].sort((a, b) => a.position - b.position),
    [columns]
  );
  const columnIds = React.useMemo(
    () => sortedColumns.map((c) => c.id),
    [sortedColumns]
  );

  // Deep link from the command palette: open the card's editor once the
  // board's ideas have loaded, then drop the param so closing the dialog
  // doesn't immediately reopen it.
  const [focusedIdea, setFocusedIdea] = React.useState<Idea | null>(null);
  const openedFocusRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!focusIdeaId || openedFocusRef.current === focusIdeaId) return;
    const match = (ideas ?? []).find((i) => i.id === focusIdeaId);
    if (match) {
      openedFocusRef.current = focusIdeaId;
      setFocusedIdea(match);
    }
  }, [focusIdeaId, ideas]);

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.type === "idea") setActiveIdea(data.idea as Idea);
    else if (data?.type === "column") setActiveColumn(data.column as IdeaColumn);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveIdea(null);
    setActiveColumn(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;

    // ── Column reorder ──
    if (activeData?.type === "column") {
      const overData = over.data.current;
      const targetColumnId =
        overData?.type === "column"
          ? (over.id as string)
          : (overData?.columnId as string | undefined);
      if (!targetColumnId || targetColumnId === active.id) return;
      const from = columnIds.indexOf(active.id as string);
      const to = columnIds.indexOf(targetColumnId);
      if (from === -1 || to === -1 || from === to) return;
      reorderColumns.mutate({
        boardId,
        columnIds: arrayMove(columnIds, from, to),
      });
      return;
    }

    // ── Idea reorder / move ──
    if (activeData?.type !== "idea") return;
    const dragged = activeData.idea as Idea;

    // Resolve destination column from whatever we dropped on.
    const overData = over.data.current;
    const destColumnId =
      overData?.type === "idea"
        ? (overData.columnId as string)
        : (over.id as string);
    if (!destColumnId) return;

    const sourceColumnId = dragged.columnId;
    const overIsCard = overData?.type === "idea";

    // ── Same column: swap positions with arrayMove, exactly like the Board
    // tab. Inserting *before* the hovered card (the old behaviour) is wrong
    // when dragging downwards — it lands one slot short, which made the last
    // slot unreachable. Dropping on the empty space under the list (`over` is
    // the column) means "move to the end".
    if (sourceColumnId === destColumnId) {
      const ids = (ideasByColumn.get(sourceColumnId) ?? []).map((i) => i.id);
      const activeIndex = ids.indexOf(dragged.id);
      const overIndex = overIsCard
        ? ids.indexOf(over.id as string)
        : ids.length - 1;
      if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
        return;
      }
      reorderIdeas.mutate({
        columnId: sourceColumnId,
        ideaIds: arrayMove(ids, activeIndex, overIndex),
      });
      return;
    }

    // ── Cross-column: insert before the hovered card, else append to the end.
    const destIdeas = (ideasByColumn.get(destColumnId) ?? []).filter(
      (i) => i.id !== dragged.id
    );
    let insertIndex = destIdeas.length;
    if (overIsCard) {
      const overIndex = destIdeas.findIndex((i) => i.id === over.id);
      if (overIndex !== -1) insertIndex = overIndex;
    }
    const nextIds = destIdeas.map((i) => i.id);
    nextIds.splice(insertIndex, 0, dragged.id);

    reorderIdeas.mutate({ columnId: destColumnId, ideaIds: nextIds });
  };

  const submitColumn = () => {
    const trimmed = columnDraft.trim();
    if (!trimmed) return;
    createColumn.mutate({ boardId, name: trimmed });
    setColumnDraft("");
    setAddingColumn(false);
  };

  if (columnsLoading || ideasLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={ideaPriorityCollision}
      // Kill horizontal auto-scroll (same as the Board tab): the default edge
      // zone is wide enough that reordering near a column edge yanks the board
      // sideways. Vertical auto-scroll stays for long columns.
      autoScroll={{ threshold: { x: 0, y: 0.2 } }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveIdea(null);
        setActiveColumn(null);
      }}
    >
      {isFiltering && matchCount === 0 && (
        <p className="px-4 pt-4 text-sm text-muted-foreground">
          No ideas match “{searchQuery.trim()}”.
        </p>
      )}

      {/* On mobile, snap each column into view while scrolling (Trello/Notion
          style); free horizontal scroll from sm up. Matches the kanban board. */}
      <div className="flex min-h-0 flex-1 items-start gap-3.5 overflow-x-auto overflow-y-hidden p-4 snap-x snap-mandatory scroll-pl-4 sm:snap-none">
        <SortableContext
          items={columnIds}
          strategy={horizontalListSortingStrategy}
        >
          {sortedColumns.map((column: IdeaColumn) => (
            <IdeaColumnView
              key={column.id}
              boardId={boardId}
              column={column}
              ideas={ideasByColumn.get(column.id) ?? []}
              allColumns={sortedColumns}
              canDelete={sortedColumns.length > 1}
              isDragActive={!!activeIdea}
              isFiltering={isFiltering}
            />
          ))}
        </SortableContext>

        {/* Add column */}
        {addingColumn ? (
          <div className="w-[272px] shrink-0 snap-start rounded-xl border border-border/60 bg-muted/40 p-2.5">
            <Input
              autoFocus
              value={columnDraft}
              onChange={(e) => setColumnDraft(e.target.value)}
              onBlur={submitColumn}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitColumn();
                if (e.key === "Escape") {
                  setColumnDraft("");
                  setAddingColumn(false);
                }
              }}
              placeholder="Column name…"
              className="h-8 text-[13px]"
              maxLength={120}
            />
          </div>
        ) : (
          <button
            onClick={() => setAddingColumn(true)}
            className={cn(
              "flex w-[272px] shrink-0 snap-start items-center gap-2 rounded-xl border border-dashed border-border/60 bg-transparent p-3 text-[13px] text-muted-foreground transition-colors",
              "hover:border-muted-foreground/50 hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Plus className="h-4 w-4" />
            Add column
          </button>
        )}
      </div>

      {focusedIdea && (
        <IdeaEditDialog
          boardId={boardId}
          idea={
            (ideas ?? []).find((i) => i.id === focusedIdea.id) ?? focusedIdea
          }
          open
          onOpenChange={(next) => {
            if (!next) setFocusedIdea(null);
          }}
        />
      )}

      <DragOverlay
        dropAnimation={null}
        modifiers={activeIdea ? [snapCenterToCursor] : undefined}
      >
        {activeIdea ? (
          <div className="w-[252px]">
            <IdeaCard
              idea={activeIdea}
              boardId={boardId}
              columns={sortedColumns}
              overlay
            />
          </div>
        ) : activeColumn ? (
          // Drag preview of the whole column (header + its cards), rotated +
          // elevated. Cards are static (non-interactive) clones to avoid
          // registering duplicate sortable ids during the column drag.
          <div className="flex w-[272px] rotate-[2deg] flex-col gap-2 rounded-xl border border-primary/40 bg-muted/95 p-2.5 shadow-xl ring-2 ring-primary/20">
            <div className="flex items-center gap-2 px-1">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <span className="text-[13px] font-semibold">
                {activeColumn.name}
              </span>
              <span className="grid h-[18px] min-w-[20px] place-items-center rounded-full border border-border/60 bg-background px-1.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                {(ideasByColumn.get(activeColumn.id) ?? []).length}
              </span>
            </div>
            <div className="flex max-h-[440px] flex-col gap-2 overflow-hidden">
              {(ideasByColumn.get(activeColumn.id) ?? []).map((idea) => (
                <div
                  key={idea.id}
                  className="rounded-lg border border-border/40 bg-card px-3 py-2.5 shadow-sm"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border-[1.5px] border-muted-foreground/40" />
                    <p
                      className={cn(
                        "min-w-0 flex-1 text-sm leading-snug line-clamp-2",
                        idea.completedAt &&
                          "text-muted-foreground line-through"
                      )}
                    >
                      {idea.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
