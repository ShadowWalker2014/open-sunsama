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

export function CommandPalette(props: CommandPaletteProps) {
  // The palette is dormant on every page view that doesn't hit ⌘K. Skip
  // mounting (and downloading) the chunk until it's actually opened, then
  // keep it mounted so subsequent opens are instant.
  const seenOpenRef = React.useRef(false);
  if (props.open) seenOpenRef.current = true;

  if (!seenOpenRef.current) return null;

  return (
    <React.Suspense fallback={null}>
      <LazyCommandPalette {...props} />
    </React.Suspense>
  );
}
