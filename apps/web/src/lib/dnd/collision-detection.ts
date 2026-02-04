import {
  closestCenter,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
  type DroppableContainer,
} from "@dnd-kit/core";

/**
 * Custom collision detection that prioritizes columns for cross-column drops.
 *
 * Strategy:
 * 1. Check for column collisions first (using pointerWithin or rectIntersection)
 * 2. If column found, return column(s) first, then all other collisions (tasks)
 * 3. If no column, return all collisions for within-column sorting
 *
 * This ensures:
 * - Cross-column drops always detect the target column first
 * - Within-column reordering still works via SortableContext
 */
export const taskPriorityCollision: CollisionDetection = (args) => {
  const { pointerCoordinates, droppableContainers } = args;

  // Find all column droppables
  const columnContainers = droppableContainers.filter(
    (container) => container.data.current?.type === "column"
  );

  if (columnContainers.length === 0) {
    // No columns found, return all collisions (for within-column sorting)
    return pointerWithin(args) || rectIntersection(args);
  }

  // Use pointerWithin to find which column the cursor is currently over
  let pointerCollisions = pointerWithin({
    ...args,
    droppableContainers: columnContainers,
  });

  if (pointerCollisions.length > 0) {
    // Found column - return ONLY the column collision to ensure "over" is the column
    return pointerCollisions;
  }

  // Fallback to rectIntersection for edge cases (column borders, etc.)
  let rectCollisions = rectIntersection({
    ...args,
    droppableContainers: columnContainers,
  });

  if (rectCollisions.length > 0) {
    // Found column via rect intersection - return ONLY column collision
    return rectCollisions;
  }

  // No column collision found - return all collisions for within-column reordering
  return pointerWithin(args) || rectIntersection(args);
};
