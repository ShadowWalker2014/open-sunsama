import * as React from "react";
import type * as ShortcutsModalModuleNS from "./shortcuts-modal";

/**
 * Lazy entry point for the keyboard shortcuts cheat-sheet modal.
 * Only opened when the user hits "?" — no need to ship the markup +
 * Radix Dialog wiring with the boot bundle.
 */

type ShortcutsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ShortcutsModalModule = typeof ShortcutsModalModuleNS;

let preload: Promise<ShortcutsModalModule> | null = null;

function importShortcutsModal(): Promise<ShortcutsModalModule> {
  if (!preload) {
    preload = import("./shortcuts-modal") as Promise<ShortcutsModalModule>;
  }
  return preload;
}

const LazyShortcutsModal = React.lazy(async () => {
  const mod = await importShortcutsModal();
  return { default: mod.ShortcutsModal };
});

export function prefetchShortcutsModal(): Promise<unknown> {
  return importShortcutsModal();
}

function ShortcutsModalLoadingShell({ open }: { open: boolean }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm"
      aria-hidden="true"
    >
      <div className="w-[min(560px,90vw)] rounded-lg border bg-popover p-6 shadow-lg">
        <div className="h-3 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-4 space-y-2">
          <div className="h-2 w-full animate-pulse rounded bg-muted/40" />
          <div className="h-2 w-5/6 animate-pulse rounded bg-muted/40" />
          <div className="h-2 w-4/6 animate-pulse rounded bg-muted/40" />
        </div>
      </div>
    </div>
  );
}

export function ShortcutsModal(props: ShortcutsModalProps) {
  const seenOpenRef = React.useRef(false);
  if (props.open) seenOpenRef.current = true;

  if (!seenOpenRef.current) return null;

  return (
    <React.Suspense fallback={<ShortcutsModalLoadingShell open={props.open} />}>
      <LazyShortcutsModal {...props} />
    </React.Suspense>
  );
}
