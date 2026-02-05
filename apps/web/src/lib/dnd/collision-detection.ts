import {
  closestCenter,
  pointerWithin,
  rectIntersection,
  getFirstCollision,
  type CollisionDetection,
  type DroppableContainer,
} from "@dnd-kit/core";

/**
 * Custom collision detection for kanban boards that handles:
 * 1. Empty columns (must use pointerWithin to detect column boundaries)
 * 2. Columns with tasks (should detect tasks for reordering)
 * 3. Cross-column drops (should detect target column)
 *
 * Strategy:
 * - First check if pointer is within a column using pointerWithin
 * - If in a column, check for task collisions within that column
 * - Return the most specific collision (task if hovering task, column otherwise)
 */
export const taskPriorityCollision: CollisionDetection = (args) => {
  const { droppableContainers, pointerCoordinates } = args;

  // Separate columns and tasks
  const columns = droppableContainers.filter(
    (c) => c.data.current?.type === "column"
  );
  const tasks = droppableContainers.filter(
    (c) => c.data.current?.type === "task"
  );

  // First, find which column the pointer is over using pointerWithin
  // This works reliably for both empty and populated columns
  const columnCollisions = pointerWithin({
    ...args,
    droppableContainers: columns,
  });

  if (columnCollisions.length === 0) {
    // Not over any column - fall back to checking tasks directly
    // This handles edge cases at column borders
    const taskCollisions = rectIntersection({
      ...args,
      droppableContainers: tasks,
    });
    return taskCollisions.length > 0 ? taskCollisions : [];
  }

  // We're over a column - now check if we're specifically over a task in that column
  const targetColumn = columnCollisions[0]!;
  const targetColumnId = targetColumn.id;

  // Get tasks that belong to this column
  const columnDate =
    typeof targetColumnId === "string" && targetColumnId.startsWith("day-")
      ? targetColumnId.replace("day-", "")
      : targetColumnId === "backlog"
        ? "backlog"
        : null;

  const tasksInColumn = tasks.filter((t) => {
    const taskColumnId = t.data.current?.columnId;
    return taskColumnId === columnDate || taskColumnId === targetColumnId;
  });

  // Check for task collisions within this column
  if (tasksInColumn.length > 0) {
    const taskCollisions = pointerWithin({
      ...args,
      droppableContainers: tasksInColumn,
    });

    if (taskCollisions.length > 0) {
      // Hovering over a specific task - return the task
      return taskCollisions;
    }
  }

  // Not over a specific task, but over the column - return the column
  return columnCollisions;
};
