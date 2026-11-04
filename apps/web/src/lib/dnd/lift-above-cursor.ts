import type { Modifier } from "@dnd-kit/core";

/** Lifts the drag overlay clear above the cursor, where the drop preview starts. */
export const liftAboveCursor: Modifier = ({ transform, draggingNodeRect }) => ({
  ...transform,
  y: transform.y - (draggingNodeRect?.height ?? 0) / 2 - 22,
});
