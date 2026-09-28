import * as React from "react";

/**
 * Subtask rows come in two sizes: "md" for side panels and forms, "lg" for
 * the task modal and focus mode, where they sit under a large title as in
 * Sunsama. The size is set once around a list instead of on every row.
 */
export type SubtaskSize = "md" | "lg";

export const SubtaskSizeContext = React.createContext<SubtaskSize>("md");

export const SUBTASK_STYLES = {
  md: {
    row: "min-h-8 gap-2.5 py-1.5",
    check: "mt-0.5 h-4 w-4",
    checkIcon: "h-2.5 w-2.5",
    text: "text-sm leading-5",
  },
  lg: {
    row: "min-h-9 gap-3.5 py-1.5",
    check: "mt-0.5 h-5 w-5",
    checkIcon: "h-3 w-3",
    text: "text-base leading-6",
  },
} as const;

export function useSubtaskSize() {
  return React.useContext(SubtaskSizeContext);
}

export function useSubtaskStyles() {
  return SUBTASK_STYLES[React.useContext(SubtaskSizeContext)];
}

/** Unchecked circles show a faint check, like Sunsama's. */
export const subtaskCheckState = (completed: boolean) =>
  completed
    ? "border-emerald-500 bg-emerald-500 text-white"
    : "border-muted-foreground/40 text-muted-foreground/40 hover:border-emerald-500 hover:text-emerald-500";
