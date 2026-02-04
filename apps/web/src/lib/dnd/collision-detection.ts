import {
  closestCenter,
  closestCorners,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
  type DroppableContainer,
} from "@dnd-kit/core";

/**
 * Optimal collision detection for kanban boards.
 *
 * Uses closestCorners for stacked items (columns with tasks) which yields results
 * aligned with human eye expectations. Falls back to pointerWithin for edge cases.
 *
 * This works optimally with the drag handler pattern that:
 * - Checks columnId from drag data to determine source
 * - Uses "over" element's columnId to determine destination
 * - Handles both reordering (same column) and moving (different columns)
 */
export const taskPriorityCollision: CollisionDetection = (args) => {
  return closestCorners(args) || pointerWithin(args);
};
