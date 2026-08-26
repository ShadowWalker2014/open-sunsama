import * as React from "react";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, MoreHorizontal, Pencil, Trash2, Search, X } from "lucide-react";
import type { IdeaBoard } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui";
import { useDeleteIdeaBoard, useReorderIdeaBoards } from "@/hooks/useIdeas";
import { BoardIcon } from "./board-icon";
import { BoardDialog } from "./board-dialog";

interface BoardRailContentProps {
  boards: IdeaBoard[];
  activeBoardId: string | null;
  onSelect: (boardId: string) => void;
  onNewBoard: () => void;
  /** Icon-only mode (desktop collapsed rail). */
  collapsed?: boolean;
  /**
   * Search is controlled by the parent so its trigger can live in the rail's
   * header row beside the +/collapse buttons — the field itself only takes a
   * row of its own while it's actually open.
   */
  searchOpen?: boolean;
  query?: string;
  onQueryChange?: (query: string) => void;
  onCloseSearch?: () => void;
}

interface BoardRowProps {
  board: IdeaBoard;
  isActive: boolean;
  collapsed?: boolean;
  /** Sortable wiring is off while filtering — a filtered list can't be reordered. */
  sortable: boolean;
  onSelect: (boardId: string) => void;
  onEdit: (board: IdeaBoard) => void;
  onDelete: (board: IdeaBoard) => void;
}

function BoardRow({
  board,
  isActive,
  collapsed,
  sortable: sortableEnabled,
  onSelect,
  onEdit,
  onDelete,
}: BoardRowProps) {
  const sortable = useSortable({ id: board.id, disabled: !sortableEnabled });

  return (
    <div
      ref={sortable.setNodeRef}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      }}
      {...sortable.attributes}
      {...sortable.listeners}
      className={cn(
        "group relative flex cursor-pointer items-center gap-2.5 rounded-lg text-[13.5px] transition-colors",
        collapsed ? "h-9 w-9 justify-center" : "px-2 py-1.5",
        isActive ? "bg-muted font-semibold" : "text-foreground hover:bg-muted",
        sortable.isDragging && "z-10 opacity-80 shadow-md ring-1 ring-border"
      )}
      onClick={() => {
        if (!sortable.isDragging) onSelect(board.id);
      }}
      title={collapsed ? board.name : undefined}
    >
      {isActive && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-primary" />
      )}
      <BoardIcon icon={board.icon} color={board.color} size={22} />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{board.name}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground group-hover:opacity-100 data-[state=open]:opacity-100"
                aria-label="Board actions"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
              className="w-40"
            >
              <DropdownMenuItem onClick={() => onEdit(board)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={() => onDelete(board)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
}

export function BoardRailContent({
  boards,
  activeBoardId,
  onSelect,
  onNewBoard,
  collapsed,
  searchOpen = false,
  query = "",
  onQueryChange,
  onCloseSearch,
}: BoardRailContentProps) {
  const [editing, setEditing] = React.useState<IdeaBoard | null>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const deleteBoard = useDeleteIdeaBoard();
  const reorderBoards = useReorderIdeaBoards();

  // Mouse: a few px of movement starts the drag, so a plain click still
  // selects the board. Touch: press-and-hold, so swiping scrolls the rail.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const trimmedQuery = query.trim().toLowerCase();
  const visibleBoards = React.useMemo(
    () =>
      trimmedQuery
        ? boards.filter((b) => b.name.toLowerCase().includes(trimmedQuery))
        : boards,
    [boards, trimmedQuery]
  );
  const boardIds = React.useMemo(
    () => visibleBoards.map((b) => b.id),
    [visibleBoards]
  );

  // Reordering a filtered list would move boards relative to rows that aren't
  // shown, so it's only enabled on the full list.
  const canReorder = !trimmedQuery && boards.length > 1;

  // Focus the field as soon as the parent opens it.
  React.useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = boards.map((b) => b.id);
    const from = ids.indexOf(active.id as string);
    const to = ids.indexOf(over.id as string);
    if (from === -1 || to === -1) return;
    reorderBoards.mutate({ boardIds: arrayMove(ids, from, to) });
  };

  const handleDelete = (board: IdeaBoard) => {
    if (window.confirm(`Delete “${board.name}” and all its ideas?`)) {
      deleteBoard.mutate(board.id);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* The active search field — a row of its own, only while open. The
          trigger that opens it lives in the rail header. */}
      {!collapsed && searchOpen && (
        <div className="mb-1.5 flex items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => onQueryChange?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onCloseSearch?.();
              if (e.key === "Enter" && visibleBoards[0]) {
                onSelect(visibleBoards[0].id);
              }
            }}
            onBlur={() => {
              if (!query) onCloseSearch?.();
            }}
            placeholder="Search boards…"
            className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={onCloseSearch}
            aria-label="Clear board search"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* The list scrolls on its own so the "New board" button below stays
          pinned once there are more boards than fit the rail. */}
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overflow-x-hidden",
          collapsed ? "flex flex-col items-center gap-0.5" : "flex flex-col gap-0.5"
        )}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={boardIds}
            strategy={verticalListSortingStrategy}
          >
            {visibleBoards.map((board) => (
              <BoardRow
                key={board.id}
                board={board}
                isActive={board.id === activeBoardId}
                collapsed={collapsed}
                sortable={canReorder}
                onSelect={onSelect}
                onEdit={setEditing}
                onDelete={handleDelete}
              />
            ))}
          </SortableContext>
        </DndContext>

        {visibleBoards.length === 0 && (
          <p className="px-2 py-3 text-[13px] text-muted-foreground">
            No boards match “{query.trim()}”.
          </p>
        )}
      </div>

      {!collapsed && (
        <div className="shrink-0">
          <div className="my-2 h-px bg-border" />
          <button
            onClick={onNewBoard}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Plus className="h-[15px] w-[15px]" />
            New board
          </button>
        </div>
      )}

      {editing && (
        <BoardDialog
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          board={editing}
        />
      )}
    </div>
  );
}
