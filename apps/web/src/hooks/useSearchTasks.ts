import { useQuery } from "@tanstack/react-query";
import type { Task, TaskPriority } from "@open-sunsama/types";
import { getApi } from "@/lib/api";

export interface SearchTasksParams {
  query?: string;
  status?: "all" | "active" | "completed";
  priority?: TaskPriority;
  limit?: number;
}

/**
 * Hook for searching tasks with filters
 * Uses server-side filtering when possible, client-side for text search
 */
export function useSearchTasks(params: SearchTasksParams) {
  const { query = "", status = "all", priority, limit = 100 } = params;
  
  return useQuery({
    queryKey: ["tasks", "search", { query, status, priority, limit }],
    queryFn: async (): Promise<Task[]> => {
      const api = getApi();
      
      // Build filter params
      const filters: Record<string, string> = {
        limit: String(limit),
      };
      
      // Status filter
      if (status === "active") {
        filters.completed = "false";
      } else if (status === "completed") {
        filters.completed = "true";
      }
      
      // Priority filter - supported by API
      if (priority) {
        filters.priority = priority;
      }
      
      const response = await api.tasks.list(filters as Parameters<typeof api.tasks.list>[0]);
      const tasks = response || [];
      
      return tasks;
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false,
    select: (data) => {
      // Client-side text search for responsiveness
      if (!query.trim()) return data;
      
      const lowerQuery = query.toLowerCase().trim();
      const searchTerms = lowerQuery.split(/\s+/);
      
      return data.filter(task => {
        const titleLower = task.title.toLowerCase();
        const notesLower = (task.notes || "").toLowerCase();
        
        // All search terms must match either title or notes
        return searchTerms.every(term => 
          titleLower.includes(term) || notesLower.includes(term)
        );
      });
    },
  });
}

/**
 * Hook for getting all tasks (cached) for client-side operations
 */
export function useAllTasks() {
  return useQuery({
    queryKey: ["tasks", "all"],
    queryFn: async (): Promise<Task[]> => {
      const api = getApi();
      const response = await api.tasks.list({ limit: 1000 } as Parameters<typeof api.tasks.list>[0]);
      return response || [];
    },
    staleTime: 60000, // Cache for 1 minute
  });
}
