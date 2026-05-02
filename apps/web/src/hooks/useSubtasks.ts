import { useQuery } from "@tanstack/react-query";
import type { Subtask } from "@open-sunsama/types";
import { useSubtasksBatcher } from "./useSubtasksBatcher";
import { subtaskKeys } from "@/lib/query-keys";

// Re-export types for convenience
export type { Subtask };
export type { CreateSubtaskInput, UpdateSubtaskInput } from "@open-sunsama/types";

// Re-export the canonical key factory.
export { subtaskKeys };

/**
 * Fetch subtasks for a task.
 *
 * The queryFn doesn't hit the per-task `GET /tasks/:id/subtasks` endpoint
 * directly — it goes through the batcher, which coalesces every other
 * `useSubtasks` mounted in the same render pass into a single
 * `POST /tasks/subtasks-batch` call. This is what stops the kanban from
 * fanning out one request per visible card.
 */
export function useSubtasks(taskId: string, options?: { enabled?: boolean }) {
  const batcher = useSubtasksBatcher();
  return useQuery({
    queryKey: subtaskKeys.list(taskId),
    queryFn: async (): Promise<Subtask[]> => {
      return batcher.fetch(taskId);
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
