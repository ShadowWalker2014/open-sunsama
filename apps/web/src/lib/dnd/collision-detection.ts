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
 * 1. Check collisions with both tasks AND columns
 * 2. Return ALL potential collisions in order of priority
 * 3. Let event handlers resolve what to drop on
 *
 * Tasks use closestCenter for accurate sorting, columns use pointerWithin with
 * rectIntersection fallback for edge cases.
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

    // Add task collisions (filter out the active item itself)
    const validTaskCollisions = taskCollisions.filter(
      (c) => c.id !== active?.id
    );
    collisions.push(...validTaskCollisions);
  }

  // Always check column collisions to support empty column drops
  if (columnContainers.length > 0) {
    const columnCollisions = pointerWithin({
      ...args,
      droppableContainers: columnContainers,
    });

    if (columnCollisions.length > 0) {
      collisions.push(...columnCollisions);
    } else {
      // Fallback to rect intersection for columns at edges
      const rectCollisions = rectIntersection({
        ...args,
        droppableContainers: columnContainers,
      });

      if (rectCollisions.length > 0) {
        collisions.push(...rectCollisions);
      }
    }
  }

  // Return ALL collisions - both tasks and columns
  // Event handlers will determine what to do based on over.type
  if (collisions.length > 0) {
    return collisions;
  }

  // Final fallback
  return rectIntersection(args);
};
