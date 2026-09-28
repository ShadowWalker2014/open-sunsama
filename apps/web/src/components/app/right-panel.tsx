import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
  Inbox,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui";
import { shouldIgnoreShortcut } from "@/hooks/useKeyboardShortcuts";

export type RightPanelTab = "calendar" | "backlog";

const STORAGE_KEY = "open-sunsama-right-panel";

function readState(): { open: boolean; tab: RightPanelTab } {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (saved && (saved.tab === "calendar" || saved.tab === "backlog")) {
      return { open: saved.open !== false, tab: saved.tab };
    }
  } catch {
    // Storage unavailable or corrupt; fall back to the default.
  }
  return { open: true, tab: "calendar" };
}

/**
 * Sunsama-style right panel: an icon rail on the far right that switches
 * the panel beside it. Clicking the active icon, the chevrons, or pressing
 * ">" collapses the panel to the rail; clicking any icon opens its panel.
 */
export function RightPanel({
  calendar,
  backlog,
}: {
  /** Left out when the page already shows the calendar (Today view). */
  calendar?: React.ReactNode;
  backlog: React.ReactNode;
}) {
  const [saved, setState] = React.useState(readState);
  // Without a calendar here, only the backlog can open.
  const state =
    calendar === undefined && saved.tab === "calendar"
      ? { open: false, tab: "backlog" as RightPanelTab }
      : saved;

  const update = React.useCallback(
    (next: { open: boolean; tab: RightPanelTab }) => {
      setState(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // The choice lasts for this visit only.
      }
    },
    []
  );

  const selectTab = (tab: RightPanelTab) =>
    update(
      state.open && state.tab === tab
        ? { open: false, tab }
        : { open: true, tab }
    );
  const toggle = React.useCallback(
    () => update({ ...state, open: !state.open }),
    [state, update]
  );

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== ">" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (shouldIgnoreShortcut(e)) return;
      e.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  const { data: backlogTasks } = useTasks({ backlog: true, limit: 500 });
  const backlogCount = backlogTasks?.filter((t) => !t.completedAt).length ?? 0;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full flex-shrink-0">
        {state.open && (
          <div className="h-full w-[300px] border-l border-border/40">
            {state.tab === "calendar" ? calendar : backlog}
          </div>
        )}

        {/* Rail */}
        <nav
          aria-label="Right panel"
          className="flex h-full w-12 flex-col items-center gap-1 border-l border-border/40 py-2"
        >
          <RailButton
            label={state.open ? "Collapse right panel" : "Expand right panel"}
            shortcut=">"
            onClick={toggle}
          >
            {state.open ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <ChevronsLeft className="h-4 w-4" />
            )}
          </RailButton>
          {calendar !== undefined && (
            <RailButton
              label="Calendar"
              active={state.open && state.tab === "calendar"}
              onClick={() => selectTab("calendar")}
            >
              <CalendarDays className="h-4 w-4" />
            </RailButton>
          )}
          <RailButton
            label="Backlog"
            active={state.open && state.tab === "backlog"}
            onClick={() => selectTab("backlog")}
            badge={backlogCount}
          >
            <Inbox className="h-4 w-4" />
          </RailButton>
          <div className="my-1 h-px w-6 bg-border/60" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/app/settings"
                search={{ tab: "calendars" } as never}
                aria-label="Connect a calendar"
                className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="left">Connect a calendar</TooltipContent>
          </Tooltip>
        </nav>
      </div>
    </TooltipProvider>
  );
}

function RailButton({
  label,
  shortcut,
  active = false,
  badge = 0,
  onClick,
  children,
}: {
  label: string;
  shortcut?: string;
  active?: boolean;
  badge?: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          aria-pressed={active}
          className={cn(
            "relative flex h-9 w-9 items-center justify-center rounded-md transition-colors",
            active
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          {children}
          {badge > 0 && (
            <span className="absolute -right-0.5 -top-0.5 min-w-[16px] rounded-full bg-muted px-1 text-center text-[9px] font-semibold leading-4 text-muted-foreground">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="flex items-center gap-2">
        {label}
        {shortcut && (
          <kbd className="rounded border border-border/60 px-1 text-[10px] text-muted-foreground">
            {shortcut}
          </kbd>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
