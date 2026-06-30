import * as React from "react";
import { Lightbulb, LayoutGrid, Loader2, Plus } from "lucide-react";
import {
  Button,
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui";
import {
  SHORTCUTS,
  matchesShortcut,
  shouldIgnoreShortcut,
} from "@/hooks/useKeyboardShortcuts";
import { useIdeaBoards, useIdeaColumns } from "@/hooks/useIdeas";
import { BoardRail } from "@/components/ideas/board-rail";
import { BoardRailContent } from "@/components/ideas/board-rail-content";
import { BoardDialog } from "@/components/ideas/board-dialog";
import { BoardIcon } from "@/components/ideas/board-icon";
import { IdeasBoardView } from "@/components/ideas/ideas-board-view";
import { AddIdeaModal } from "@/components/ideas/add-idea-modal";

const ACTIVE_BOARD_KEY = "open-sunsama-ideas-active-board";

export default function IdeasPage() {
  const { data: boards, isLoading } = useIdeaBoards();
  const [activeBoardId, setActiveBoardId] = React.useState<string | null>(() =>
    typeof window === "undefined"
      ? null
      : localStorage.getItem(ACTIVE_BOARD_KEY)
  );
  const [newBoardOpen, setNewBoardOpen] = React.useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = React.useState(false);
  const [quickAddOpen, setQuickAddOpen] = React.useState(false);

  // First column of the active board — the target for the "A" quick-add.
  const { data: activeColumns } = useIdeaColumns(activeBoardId ?? undefined);
  const firstColumn = React.useMemo(
    () =>
      activeColumns
        ? [...activeColumns].sort((a, b) => a.position - b.position)[0]
        : undefined,
    [activeColumns]
  );

  // Press "A" on the Ideas page → open the Add Idea modal (not Add Task).
  // Capture phase runs before the app-shell's global window listener, so the
  // task modal never fires here.
  React.useEffect(() => {
    if (!activeBoardId || !firstColumn) return;
    const handler = (e: KeyboardEvent) => {
      if (shouldIgnoreShortcut(e)) return;
      if (SHORTCUTS.addTask && matchesShortcut(e, SHORTCUTS.addTask)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        setQuickAddOpen(true);
      }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [activeBoardId, firstColumn?.id]);

  // Keep a valid active board selected as boards load / change.
  React.useEffect(() => {
    if (!boards || boards.length === 0) return;
    const stillValid =
      activeBoardId && boards.some((b) => b.id === activeBoardId);
    if (!stillValid && boards[0]) {
      setActiveBoardId(boards[0].id);
    }
  }, [boards, activeBoardId]);

  const selectBoard = React.useCallback((id: string) => {
    setActiveBoardId(id);
    localStorage.setItem(ACTIVE_BOARD_KEY, id);
    setMobileSheetOpen(false);
  }, []);

  const activeBoard = boards?.find((b) => b.id === activeBoardId) ?? null;

  if (isLoading) {
    return (
      <div className="flex h-[calc(100dvh-4rem)] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No boards yet — full-page empty state.
  if (!boards || boards.length === 0) {
    return (
      <>
        <div className="flex h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-muted text-muted-foreground">
            <LayoutGrid className="h-6 w-6" />
          </div>
          <h2 className="text-base font-semibold">Your idea boards live here</h2>
          <p className="max-w-xs text-sm text-muted-foreground">
            Make a board per kind of thought — startup ideas, movies, someday
            projects.
          </p>
          <Button onClick={() => setNewBoardOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Create your first board
          </Button>
        </div>
        <BoardDialog
          open={newBoardOpen}
          onOpenChange={setNewBoardOpen}
          onCreated={selectBoard}
        />
      </>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col lg:h-[calc(100vh-2.75rem)] lg:flex-row">
      {/* Desktop rail */}
      <BoardRail
        boards={boards}
        activeBoardId={activeBoardId}
        onSelect={selectBoard}
        onNewBoard={() => setNewBoardOpen(true)}
      />

      {/* Canvas */}
      <main className="flex min-w-0 flex-1 flex-col bg-muted/30 dark:bg-background">
        {/* Header */}
        <div className="flex items-center gap-2.5 border-b border-border bg-background px-4 py-2.5">
          {/* Mobile board switcher */}
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetTrigger asChild>
              <button
                className="flex items-center lg:hidden"
                aria-label="Switch board"
              >
                {activeBoard ? (
                  <BoardIcon
                    icon={activeBoard.icon}
                    color={activeBoard.color}
                    size={24}
                  />
                ) : (
                  <Lightbulb className="h-5 w-5" />
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-3">
              <SheetHeader className="mb-3">
                <SheetTitle className="text-left">Boards</SheetTitle>
              </SheetHeader>
              <BoardRailContent
                boards={boards}
                activeBoardId={activeBoardId}
                onSelect={selectBoard}
                onNewBoard={() => {
                  setMobileSheetOpen(false);
                  setNewBoardOpen(true);
                }}
              />
            </SheetContent>
          </Sheet>

          {activeBoard && (
            <div className="flex items-center gap-2.5">
              <span className="hidden lg:inline-flex">
                <BoardIcon
                  icon={activeBoard.icon}
                  color={activeBoard.color}
                  size={24}
                />
              </span>
              <h1 className="text-base font-semibold tracking-tight">
                {activeBoard.name}
              </h1>
            </div>
          )}
        </div>

        {/* Board */}
        {activeBoardId && <IdeasBoardView boardId={activeBoardId} />}
      </main>

      <BoardDialog
        open={newBoardOpen}
        onOpenChange={setNewBoardOpen}
        onCreated={selectBoard}
      />

      {/* "A" quick-add → adds to the active board's first column */}
      {activeBoardId && firstColumn && (
        <AddIdeaModal
          open={quickAddOpen}
          onOpenChange={setQuickAddOpen}
          boardId={activeBoardId}
          columnId={firstColumn.id}
          columnName={firstColumn.name}
        />
      )}
    </div>
  );
}
