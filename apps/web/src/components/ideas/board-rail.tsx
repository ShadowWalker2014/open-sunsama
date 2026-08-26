import * as React from "react";
import { Plus, ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { IdeaBoard } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { BoardRailContent } from "./board-rail-content";

const COLLAPSED_KEY = "open-sunsama-ideas-rail-collapsed";

interface BoardRailProps {
  boards: IdeaBoard[];
  activeBoardId: string | null;
  onSelect: (boardId: string) => void;
  onNewBoard: () => void;
}

/** Desktop board rail — collapsible like the backlog sidebar. */
export function BoardRail({
  boards,
  activeBoardId,
  onSelect,
  onNewBoard,
}: BoardRailProps) {
  const [collapsed, setCollapsed] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(COLLAPSED_KEY) === "true";
  });

  // Search lives here so its trigger can sit in the header row; the field
  // itself is rendered by BoardRailContent, and only while open.
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const closeSearch = React.useCallback(() => {
    setSearchOpen(false);
    setQuery("");
  }, []);

  const toggle = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_KEY, String(next));
      return next;
    });
  }, []);

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-border bg-background p-2.5 transition-all duration-300 ease-in-out lg:flex",
        collapsed ? "w-12 items-center" : "w-60"
      )}
    >
      {collapsed ? (
        <button
          onClick={toggle}
          title="Expand boards"
          className="mb-1.5 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      ) : (
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Boards
          </span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
              title="Search boards"
              aria-label="Search boards"
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground",
                searchOpen && "bg-muted text-foreground"
              )}
            >
              <Search className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onNewBoard}
              title="New board"
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={toggle}
              title="Collapse boards"
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <BoardRailContent
        boards={boards}
        activeBoardId={activeBoardId}
        onSelect={onSelect}
        onNewBoard={onNewBoard}
        collapsed={collapsed}
        searchOpen={searchOpen && !collapsed}
        query={query}
        onQueryChange={setQuery}
        onCloseSearch={closeSearch}
      />
    </aside>
  );
}
