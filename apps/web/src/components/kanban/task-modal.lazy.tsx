import * as React from "react";
import type { Task } from "@open-sunsama/types";
import type * as TaskModalModuleNS from "./task-modal";

/**
 * Lazy entry point for the heavy task-modal module.
 *
 * `task-modal.tsx` is ~1290 lines and statically imports the recurrence
 * preview calendar, the Tiptap-backed description/notes fields (already
 * deferred), the time-block editor, the subtask DnD context, and a stack
 * of Radix primitives. None of that is needed until the user clicks a task
 * card or hits the keyboard shortcut to open one — but it was being pulled
 * into the /app boot bundle because `routes/app.tsx` mounts a hidden
 * `<TaskModal>` for the command palette flow.
 *
 * This wrapper:
 *   - skips rendering entirely (and skips module load) when `open` is false
 *     and the task is null, so the chunk is only fetched on first interaction
 *   - prefetches the chunk on idle once the user is in /app
 *   - preserves the same interface so callers don't change
 */

type TaskModalProps = {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type TaskModalModule = typeof TaskModalModuleNS;

let preload: Promise<TaskModalModule> | null = null;

function importTaskModal(): Promise<TaskModalModule> {
  if (!preload) {
    preload = import("./task-modal") as Promise<TaskModalModule>;
  }
  return preload;
}

const LazyTaskModal = React.lazy(async () => {
  const mod = await importTaskModal();
  return { default: mod.TaskModal };
});

export function prefetchTaskModal(): Promise<unknown> {
  return importTaskModal();
}

export function TaskModal(props: TaskModalProps) {
  // The modal is dormant most of the time. We sidestep both the module
  // download and the React reconciliation cost by not mounting anything
  // until something has actually been opened. Once it's been opened once
  // we keep it mounted (so closing/reopening is instant) — `seenOpenRef`
  // tracks that.
  const seenOpenRef = React.useRef(false);
  if (props.open) seenOpenRef.current = true;

  if (!seenOpenRef.current && !props.task) {
    return null;
  }

  return (
    <React.Suspense fallback={null}>
      <LazyTaskModal {...props} />
    </React.Suspense>
  );
}
