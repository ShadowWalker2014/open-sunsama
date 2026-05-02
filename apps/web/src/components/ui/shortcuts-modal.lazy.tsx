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

export function ShortcutsModal(props: ShortcutsModalProps) {
  const seenOpenRef = React.useRef(false);
  if (props.open) seenOpenRef.current = true;

  if (!seenOpenRef.current) return null;

  return (
    <React.Suspense fallback={null}>
      <LazyShortcutsModal {...props} />
    </React.Suspense>
  );
}
