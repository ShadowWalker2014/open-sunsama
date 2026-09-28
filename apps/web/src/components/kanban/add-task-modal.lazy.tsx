import * as React from "react";
import type * as AddTaskModalModuleNS from "./add-task-modal";
import type { AddPosition } from "./add-task-modal";
import { preloadableLazy } from "@/lib/preloadable-lazy";

export type { AddPosition };

/**
 * Lazy entry point for `add-task-modal.tsx`. Mounted at the app shell level
 * so the global "+ Add Task" shortcut can fire from anywhere, but never
 * needed on first paint — defer the chunk until the user actually opens it.
 */

type AddTaskModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduledDate?: string | null;
  addPosition?: AddPosition;
  onAddPositionChange?: (position: AddPosition) => void;
  initialTitle?: string;
};

const { Component: LoadedAddTaskModal, preload } = preloadableLazy<AddTaskModalProps>(() =>
  (import("./add-task-modal") as Promise<typeof AddTaskModalModuleNS>).then(
    (mod) => mod.AddTaskModal
  )
);

export function prefetchAddTaskModal(): Promise<unknown> {
  return preload();
}

/**
 * A bare-bones loading shell rendered while the underlying modal chunk
 * downloads on first interaction. We render an empty Radix-style overlay
 * so the user has visual feedback that the click registered (instead of
 * "click did nothing") on slow networks.
 */
function AddTaskModalLoadingShell({ open }: { open: boolean }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm"
      aria-hidden="true"
    >
      <div className="rounded-lg border bg-background p-6 shadow-lg">
        <div className="h-2 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-3 h-2 w-24 animate-pulse rounded bg-muted/60" />
      </div>
    </div>
  );
}

export function AddTaskModal(props: AddTaskModalProps) {
  const seenOpenRef = React.useRef(false);
  if (props.open) seenOpenRef.current = true;

  if (!seenOpenRef.current) return null;

  return (
    <React.Suspense fallback={<AddTaskModalLoadingShell open={props.open} />}>
      <LoadedAddTaskModal {...props} />
    </React.Suspense>
  );
}
