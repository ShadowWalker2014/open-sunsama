import * as React from "react";
import type { Task } from "@open-sunsama/types";
import type * as CommandPaletteModuleNS from "./command-palette";

/**
 * Lazy entry point for the command palette.
 *
 * The palette pulls in `useSearchTasks` (with debouncing + abort logic),
 * the command, task-command, and MCP-command catalogs, the search hook,
 * Tiptap-free task creation flow, and the contextual-commands matcher.
 * Total ~1000 lines of code that nothing on the page renders until the
 * user hits ⌘K. Defer it.
 */

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTask: (task: Task) => void;
  onAddTask: () => void;
};

type CommandPaletteModule = typeof CommandPaletteModuleNS;

let preload: Promise<CommandPaletteModule> | null = null;

function importCommandPalette(): Promise<CommandPaletteModule> {
  if (!preload) {
    preload = import("./command-palette") as Promise<CommandPaletteModule>;
  }
  return preload;
}

const LazyCommandPalette = React.lazy(async () => {
  const mod = await importCommandPalette();
  return { default: mod.CommandPalette };
});

export function prefetchCommandPalette(): Promise<unknown> {
  return importCommandPalette();
}

/**
 * Loading shell shown while the palette chunk downloads on first ⌘K. We
 * mimic the palette's positioning + dialog framing so the user sees an
 * immediate response instead of a "did the keystroke register?" pause on
 * slow connections.
 */
function CommandPaletteLoadingShell({ open }: { open: boolean }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/40 pt-[15vh] backdrop-blur-sm"
      aria-hidden="true"
    >
      <div className="w-[min(640px,90vw)] rounded-lg border bg-popover p-4 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-32 animate-pulse rounded bg-muted/70" />
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-2 w-3/4 animate-pulse rounded bg-muted/40" />
          <div className="h-2 w-2/3 animate-pulse rounded bg-muted/40" />
          <div className="h-2 w-1/2 animate-pulse rounded bg-muted/40" />
        </div>
      </div>
    </div>
  );
}

export function CommandPalette(props: CommandPaletteProps) {
  // The palette is dormant on every page view that doesn't hit ⌘K. Skip
  // mounting (and downloading) the chunk until it's actually opened, then
  // keep it mounted so subsequent opens are instant.
  const seenOpenRef = React.useRef(false);
  if (props.open) seenOpenRef.current = true;

  if (!seenOpenRef.current) return null;

  return (
    <React.Suspense fallback={<CommandPaletteLoadingShell open={props.open} />}>
      <LazyCommandPalette {...props} />
    </React.Suspense>
  );
}
