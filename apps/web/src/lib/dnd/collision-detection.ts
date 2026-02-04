import {
  closestCenter,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
  type DroppableContainer,
} from "@dnd-kit/core";

/**
 * Custom collision detection that handles both task reordering and column drops.
 *
 * Strategy:
 * 1. Prioritize column detection for cross-column drops
 * 2. Check tasks for reordering within columns
 * 3. Return collisions in priority order (columns first, then tasks)
 *
 * This ensures that dragging across columns always detects the column even
 * when the cursor is over a task within that column.
 */
export const taskPriorityCollision: CollisionDetection = (args) => {
  const { droppableContainers, active } = args;

  // Separate containers into tasks and columns
  const taskContainers: DroppableContainer[] = [];
  const columnContainers: DroppableContainer[] = [];

  droppableContainers.forEach((container) => {
    const type = container.data.current?.type;
    if (type === "column") {
      columnContainers.push(container);
    } else if (type === "task") {
      taskContainers.push(container);
    }
  });

  const collisions: ReturnType<CollisionDetection> = [];

  // PRIORITIZE column detection first - use rectIntersection to detect columns
  // even when the cursor is over tasks inside the column
  if (columnContainers.length > 0) {
    const columnCollisions = rectIntersection({
      ...args,
      droppableContainers: columnContainers,
    });

    if (columnCollisions.length > 0) {
      collisions.push(...columnCollisions);
    }
  }

  // Then check task collisions for reordering within the same column
  if (taskContainers.length > 0) {
    const taskCollisions = closestCenter({
      ...args,
      droppableContainers: taskContainers,
    });

    // Add task collisions (filter out the active item itself)
    const validTaskCollisions = taskCollisions.filter(
      (c) => c.id !== active?.id
    );
    collisions.push(...validTaskCollisions);
  }

  // Return ALL collisions - columns first, then tasks
  // Event handlers will determine what to do based on over.type
  if (collisions.length > 0) {
    return collisions;
  }

  // Final fallback
  return rectIntersection(args);
};
