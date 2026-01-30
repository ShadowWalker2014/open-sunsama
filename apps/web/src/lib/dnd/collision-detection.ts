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
 * 2. If not over a task, check if we're over a column (for cross-column moves)
 * 3. This allows visual drop indicators between tasks while still supporting
 *    column-level drop detection for empty columns or non-task areas
 * 
 * Tasks use closestCenter for accurate sorting, columns use pointerWithin.
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
  
  // First, check collisions with tasks using closestCenter for accurate sorting
  if (taskContainers.length > 0) {
    const taskCollisions = closestCenter({
      ...args,
      droppableContainers: taskContainers,
    });
    
    // If we found a task collision (not the active item itself), use it
    const firstCollision = taskCollisions[0];
    if (taskCollisions.length > 0 && firstCollision && firstCollision.id !== active?.id) {
      return taskCollisions;
    }
  }
  
  // If no task collision, check column collisions
  if (columnContainers.length > 0) {
    const columnCollisions = pointerWithin({
      ...args,
      droppableContainers: columnContainers,
    });
    
    if (columnCollisions.length > 0) {
      return columnCollisions;
    }
    
    // Fallback to rect intersection for columns
    const rectCollisions = rectIntersection({
      ...args,
      droppableContainers: columnContainers,
    });
    
    if (rectCollisions.length > 0) {
      return rectCollisions;
    }
  }
  
  // Final fallback to all containers
  return rectIntersection(args);
};
