import { useQuery } from "@tanstack/react-query";

/**
 * Subtask type (to be moved to @chronoflow/types when API is ready)
 */
export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubtaskInput {
  title: string;
  completed?: boolean;
}

export interface UpdateSubtaskInput {
  title?: string;
  completed?: boolean;
  position?: number;
}

/**
 * Query key factory for subtasks
 */
export const subtaskKeys = {
  all: ["subtasks"] as const,
  lists: () => [...subtaskKeys.all, "list"] as const,
  list: (taskId: string) => [...subtaskKeys.lists(), taskId] as const,
  details: () => [...subtaskKeys.all, "detail"] as const,
  detail: (id: string) => [...subtaskKeys.details(), id] as const,
};

/**
 * Fetch subtasks for a task
 * NOTE: This hook is prepared for when the subtasks API is implemented.
 * Currently returns empty array as the API doesn't exist yet.
 */
export function useSubtasks(taskId: string) {
  return useQuery({
    queryKey: subtaskKeys.list(taskId),
    queryFn: async (): Promise<Subtask[]> => {
      // TODO: Implement when API is ready
      return [];
    },
    enabled: !!taskId,
  });
}

// Re-export mutations for convenience
export {
  useCreateSubtask,
  useUpdateSubtask,
  useDeleteSubtask,
  useReorderSubtasks,
} from "./useSubtaskMutations";
