import * as React from "react";
import type * as AddTaskModalModuleNS from "./add-task-modal";
import type { AddPosition } from "./add-task-modal";

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
};

type AddTaskModalModule = typeof AddTaskModalModuleNS;

let preload: Promise<AddTaskModalModule> | null = null;

function importAddTaskModal(): Promise<AddTaskModalModule> {
  if (!preload) {
    preload = import("./add-task-modal") as Promise<AddTaskModalModule>;
  }
  return preload;
}

const LazyAddTaskModal = React.lazy(async () => {
  const mod = await importAddTaskModal();
  return { default: mod.AddTaskModal };
});

export function prefetchAddTaskModal(): Promise<unknown> {
  return importAddTaskModal();
}

export function AddTaskModal(props: AddTaskModalProps) {
  const seenOpenRef = React.useRef(false);
  if (props.open) seenOpenRef.current = true;

  if (!seenOpenRef.current) return null;

  return (
    <React.Suspense fallback={null}>
      <LazyAddTaskModal {...props} />
    </React.Suspense>
  );
}
