import { useInfiniteQuery } from "@tanstack/react-query";
import type { TaskPriority } from "@open-sunsama/types";
import { getApi } from "@/lib/api";

export interface InfiniteSearchTasksParams {
  query?: string;
  status?: "all" | "active" | "completed";
  priority?: TaskPriority;
  limit?: number;
}

/**
 * Hook for searching tasks with infinite scroll pagination
 * Uses server-side pagination and filtering
 */
export function useInfiniteSearchTasks(params: InfiniteSearchTasksParams) {
  const { query = "", status = "all", priority, limit = 50 } = params;

  return useInfiniteQuery({
    queryKey: ["tasks", "search", "infinite", { query, status, priority, limit }],
    queryFn: async ({ pageParam = 1 }) => {
      const api = getApi();

      // Build filter params matching what the API expects
      const filters: Parameters<typeof api.tasks.list>[0] = {
        limit,
        page: pageParam,
      };

      // Status filter
      if (status === "active") {
        filters.completed = false;
      } else if (status === "completed") {
        filters.completed = true;
      }

      // Priority filter
      if (priority) {
        filters.priority = priority;
      }

      const response = await api.tasks.list(filters);

      // Apply client-side text filtering if query is provided
      let filteredData = response.data;
      if (query.trim()) {
        const lowerQuery = query.toLowerCase().trim();
        const searchTerms = lowerQuery.split(/\s+/);

        filteredData = response.data.filter((task) => {
          const titleLower = task.title.toLowerCase();
          const notesLower = (task.notes || "").toLowerCase();

          // All search terms must match either title or notes
          return searchTerms.every(
            (term) => titleLower.includes(term) || notesLower.includes(term)
          );
        });
      }

      return {
        data: filteredData,
        meta: response.meta,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const meta = lastPage.meta;
      if (!meta) return undefined;
      if (meta.page < meta.totalPages) {
        return meta.page + 1;
      }
      return undefined;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
