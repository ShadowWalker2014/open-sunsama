/**
 * Subtask-related type definitions for Chronoflow
 * @module @chronoflow/types/subtask
 */

/**
 * Represents a subtask belonging to a task in the Chronoflow system.
 * Subtasks are smaller work items that make up a larger task.
 */
export interface Subtask {
  /** Unique identifier for the subtask (UUID format) */
  id: string;

  /** ID of the parent task this subtask belongs to */
  taskId: string;

  /** Title/description of the subtask */
  title: string;

  /** Whether the subtask has been completed */
  completed: boolean;

  /** Position of the subtask for ordering purposes */
  position: number;

  /** Timestamp when the subtask was created */
  createdAt: string;

  /** Timestamp when the subtask was last updated */
  updatedAt: string;
}

/**
 * Input data required to create a new subtask.
 */
export interface CreateSubtaskInput {
  /** ID of the parent task */
  taskId: string;

  /** Title/description of the subtask */
  title: string;

  /** Optional position for ordering */
  position?: number;
}

/**
 * Input data for updating an existing subtask.
 * All fields are optional; only provided fields will be updated.
 */
export interface UpdateSubtaskInput {
  /** Updated title */
  title?: string;

  /** Updated completion status */
  completed?: boolean;

  /** Updated position for ordering */
  position?: number;
}

/**
 * Input for reordering subtasks within a task.
 */
export interface ReorderSubtasksInput {
  /** ID of the parent task */
  taskId: string;

  /** Array of subtask IDs in their new order */
  subtaskIds: string[];
}
