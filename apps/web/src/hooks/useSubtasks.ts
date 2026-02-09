import { useQuery } from "@tanstack/react-query";
import type { Subtask } from "@open-sunsama/types";
import { getApi } from "@/lib/api";

// Re-export types for convenience
export type { Subtask };
export type { CreateSubtaskInput, UpdateSubtaskInput } from "@open-sunsama/types";

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
 */
export function useSubtasks(taskId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: subtaskKeys.list(taskId),
    queryFn: async (): Promise<Subtask[]> => {
      const api = getApi();
      return await api.subtasks.list(taskId);
    },
    enabled: !!taskId && options?.enabled !== false,
  });
}

// Re-export mutations for convenience
export {
  useCreateSubtask,
  useUpdateSubtask,
  useDeleteSubtask,
  useReorderSubtasks,
} from "./useSubtaskMutations";
