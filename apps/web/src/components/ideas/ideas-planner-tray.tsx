import * as React from "react";
import type { IdeaColumn } from "@open-sunsama/types";
import { Link } from "@tanstack/react-router";
import { useDroppable, useDndContext } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ChevronDown, ArrowUpRight, Plus, Lightbulb } from "lucide-react";
import { useIdeaBoards, useIdeaColumns, useIdeas } from "@/hooks/useIdeas";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { IdeaCard } from "./idea-card";
import { AddIdeaModal } from "./add-idea-modal";

export function IdeasPlannerTray() {
  const { active } = useDndContext();
  const { data: boards = [] } = useIdeaBoards();
  const [selectedBoard, setBoard] = React.useState(
    () => localStorage.getItem("planner-ideas-board") ?? ""
  );
  const board = boards.find((b) => b.id === selectedBoard) ?? boards[0];
  const { data: columns = [] } = useIdeaColumns(board?.id);
  const { data: ideas = [] } = useIdeas(board?.id);
  const [selectedColumn, setColumn] = React.useState("");
  const column = columns.find((c) => c.id === selectedColumn) ?? columns[0];
  const [adding, setAdding] = React.useState(false);
  const cards = ideas
    .filter((i) => i.columnId === column?.id)
    .sort((a, b) => a.position - b.position);
  const { setNodeRef, isOver } = useDroppable({
    id: `ideas-tray-${column?.id ?? "empty"}`,
    data: { type: "idea-tray", boardId: board?.id, columnId: column?.id },
    disabled: !column,
  });
  return (
    <section aria-label="Ideas tray" className="flex h-full min-h-0 flex-col">
      <header className="flex h-12 shrink-0 items-center gap-1 px-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Choose ideas board"
              className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1.5 text-sm font-medium hover:bg-accent"
            >
              <Lightbulb
                className="h-4 w-4 shrink-0"
                style={{ color: board?.color }}
              />
              <span className="truncate">{board?.name ?? "Ideas"}</span>
              <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {boards.map((b) => (
              <DropdownMenuItem
                key={b.id}
                onSelect={() => {
                  setBoard(b.id);
                  setColumn("");
                  localStorage.setItem("planner-ideas-board", b.id);
                }}
              >
                {b.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Link
          to="/app/ideas"
          search={{ board: board?.id } as never}
          aria-label="Open ideas board"
          title="Open ideas board"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </header>
      {column ? (
        <>
          <div
            role="tablist"
            aria-label="Idea columns"
            className="flex shrink-0 gap-1 overflow-x-auto px-3 pb-2"
          >
            {columns.map((c) => (
              <ColumnTab
                key={c.id}
                column={c}
                onDragOverColumn={() => setColumn(c.id)}
                role="tab"
                aria-label={`${c.name} ${ideas.filter((i) => i.columnId === c.id).length}`}
                aria-selected={column.id === c.id}
                tabIndex={column.id === c.id ? 0 : -1}
                onKeyDown={(event) => {
                  const index = columns.findIndex((item) => item.id === c.id);
                  const next =
                    event.key === "ArrowRight"
                      ? (index + 1) % columns.length
                      : event.key === "ArrowLeft"
                        ? (index - 1 + columns.length) % columns.length
                        : event.key === "Home"
                          ? 0
                          : event.key === "End"
                            ? columns.length - 1
                            : -1;
                  if (next < 0) return;
                  event.preventDefault();
                  setColumn(columns[next]!.id);
                  event.currentTarget.parentElement
                    ?.querySelectorAll<HTMLButtonElement>("[role=tab]")
                    .item(next)?.focus();
                }}
                onClick={() => setColumn(c.id)}
                className={cn(
                  "whitespace-nowrap rounded-md px-2 py-1 text-xs",
                  column.id === c.id
                    ? "bg-accent font-medium text-foreground"
                    : "text-muted-foreground hover:bg-accent/50"
                )}
              >
                {c.name}
                <span className="ml-1.5 text-[10px] opacity-60">
                  {ideas.filter((i) => i.columnId === c.id).length}
                </span>
              </ColumnTab>
            ))}
          </div>
          <div
            ref={setNodeRef}
            data-ideas-tray-drop
            className={cn(
              "mx-2 mb-2 flex min-h-0 flex-1 flex-col rounded-xl bg-tray",
              isOver && "ring-2 ring-inset ring-primary/30"
            )}
          >
            {isOver && active?.data.current?.task && (
              <p className="px-3 pt-2 text-xs text-primary">Save linked idea</p>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              <SortableContext
                items={cards.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {cards.map((idea) => (
                    <IdeaCard
                      key={idea.id}
                      idea={idea}
                      boardId={board!.id}
                      columns={columns}
                    />
                  ))}
                </div>
              </SortableContext>
              {!cards.length && (
                <p className="px-3 py-8 text-center text-xs text-muted-foreground">
                  Ideas for {column.name.toLowerCase()} go here.
                </p>
              )}
            </div>
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-2 rounded-b-xl px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              Add idea
            </button>
          </div>
          <AddIdeaModal
            open={adding}
            onOpenChange={setAdding}
            boardId={board!.id}
            columnId={column.id}
            columnName={column.name}
          />
        </>
      ) : (
        <div className="p-4 text-sm text-muted-foreground">
          Create a board in{" "}
          <Link to="/app/ideas" className="text-primary underline">
            Ideas
          </Link>{" "}
          to collect and plan your next tasks.
        </div>
      )}
    </section>
  );
}

function ColumnTab({
  column,
  onDragOverColumn,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  column: IdeaColumn;
  onDragOverColumn: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `idea-tab-${column.id}`,
    data: { type: "idea-tray", boardId: column.boardId, columnId: column.id },
  });
  React.useEffect(() => {
    if (isOver) onDragOverColumn();
  }, [isOver, onDragOverColumn]);
  return (
    <button ref={setNodeRef} {...props}>
      {children}
    </button>
  );
}
