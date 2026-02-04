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
 * 1. First check if we're over a sortable task item (for reordering within column)
 * 2. Always check column collisions to ensure drop target highlighting updates smoothly
 *    when moving between columns
 * 3. This allows visual drop indicators between tasks while still supporting
 *    column-level drop detection for empty columns or non-task areas
 *
 * Tasks use closestCenter for accurate sorting, columns use pointerWithin with
 * rectIntersection fallback for better edge detection.
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

  // First, check collisions with tasks using closestCenter for accurate sorting
  if (taskContainers.length > 0) {
    const taskCollisions = closestCenter({
      ...args,
      droppableContainers: taskContainers,
    });

    // If we found a task collision (not the active item itself), use it
    const firstCollision = taskCollisions[0];
    if (
      taskCollisions.length > 0 &&
      firstCollision &&
      firstCollision.id !== active?.id
    ) {
      collisions.push(...taskCollisions);
    }
  }

  // Always check column collisions to ensure smooth updates when dragging between columns
  // Use pointerWithin first (cursor must be inside rect), then rectIntersection fallback
  if (columnContainers.length > 0) {
    const columnCollisions = pointerWithin({
      ...args,
      droppableContainers: columnContainers,
    });

    if (columnCollisions.length > 0) {
      collisions.push(...columnCollisions);
    } else {
      // Fallback to rect intersection for columns - allows better edge detection
      const rectCollisions = rectIntersection({
        ...args,
        droppableContainers: columnContainers,
      });

      if (rectCollisions.length > 0) {
        collisions.push(...rectCollisions);
      }
    }
  }

  // Return found collisions, or fallback to global rectIntersection
  if (collisions.length > 0) {
    return collisions;
  }

  return rectIntersection(args);
};
