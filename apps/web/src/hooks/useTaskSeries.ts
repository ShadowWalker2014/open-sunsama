import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  TaskSeriesWithMeta,
  CreateTaskSeriesInput,
  UpdateTaskSeriesInput,
  TaskSeriesFilterInput,
  CreateTaskSeriesResponse,
  Task,
} from "@open-sunsama/types";
import { getApiClient as getClient } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { taskKeys } from "./useTasks";

/**
 * API response types
 */
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Query key factory for task series
 */
export const taskSeriesKeys = {
  all: ["taskSeries"] as const,
  lists: () => [...taskSeriesKeys.all, "list"] as const,
  list: (filters: TaskSeriesFilterInput) =>
    [...taskSeriesKeys.lists(), filters] as const,
  details: () => [...taskSeriesKeys.all, "detail"] as const,
  detail: (id: string) => [...taskSeriesKeys.details(), id] as const,
  instances: (id: string) =>
    [...taskSeriesKeys.detail(id), "instances"] as const,
};

/**
 * Helper to get typed API methods
 */
function createApiClient() {
  const client = getClient();
  return {
    get: <T>(path: string) => client.get<T>(path),
    post: <T>(path: string, body?: unknown) => client.post<T>(path, body),
    patch: <T>(path: string, body?: unknown) => client.patch<T>(path, body),
    delete: <T>(path: string) => client.delete<T>(path),
  };
}

/**
 * Fetch all task series (routines)
 */
export function useTaskSeriesList(filters?: TaskSeriesFilterInput) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: taskSeriesKeys.list(filters ?? {}),
    queryFn: async () => {
      const client = createApiClient();
      const searchParams = new URLSearchParams();
      if (filters?.isActive !== undefined)
        searchParams.set("isActive", String(filters.isActive));
      if (filters?.recurrenceType)
        searchParams.set("recurrenceType", filters.recurrenceType);
      if (filters?.titleSearch)
        searchParams.set("titleSearch", filters.titleSearch);
      if (filters?.page) searchParams.set("page", String(filters.page));
      if (filters?.limit) searchParams.set("limit", String(filters.limit));

      const queryStr = searchParams.toString();
      const path = queryStr ? `task-series?${queryStr}` : "task-series";
      const response =
        await client.get<PaginatedResponse<TaskSeriesWithMeta[]>>(path);
      return response.data;
    },
    enabled: isAuthenticated,
  });
}

/**
 * Fetch a single task series by ID
 */
export function useTaskSeries(id: string | null) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: taskSeriesKeys.detail(id ?? ""),
    queryFn: async () => {
      if (!id) throw new Error("No series ID provided");
      const client = createApiClient();
      const response = await client.get<ApiResponse<TaskSeriesWithMeta>>(
        `task-series/${id}`
      );
      return response.data;
    },
    enabled: !!id && isAuthenticated,
  });
}

/**
 * Create a new task series (recurring task)
 */
export function useCreateTaskSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateTaskSeriesInput
    ): Promise<CreateTaskSeriesResponse> => {
      const client = createApiClient();
      const response = await client.post<ApiResponse<CreateTaskSeriesResponse>>(
        "task-series",
        data
      );
      return response.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: taskSeriesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });

      toast({
        title: "Recurring task created",
        description: `"${result.series.title}" will repeat ${result.series.recurrenceType}`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create recurring task",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

/**
 * Update an existing task series
 */
export function useUpdateTaskSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateTaskSeriesInput;
    }) => {
      const client = createApiClient();
      const response = await client.patch<ApiResponse<TaskSeriesWithMeta>>(
        `task-series/${id}`,
        input
      );
      return response.data;
    },
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(taskSeriesKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: taskSeriesKeys.lists() });

      toast({
        title: "Recurring task updated",
        description: "The recurrence settings have been updated.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update recurring task",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

/**
 * Stop a task series (stop repeating)
 */
export function useStopTaskSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const client = createApiClient();
      await client.post(`task-series/${id}/stop`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: taskSeriesKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: taskSeriesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });

      toast({
        title: "Stopped repeating",
        description: "This task will no longer repeat.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to stop recurring task",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

/**
 * Delete all incomplete instances and stop the series
 */
export function useDeleteTaskSeriesInstances() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const client = createApiClient();
      const response = await client.post<ApiResponse<{ deletedCount: number }>>(
        `task-series/${id}/delete-instances`
      );
      return response.data;
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: taskSeriesKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: taskSeriesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });

      toast({
        title: "Stopped and deleted",
        description: `Deleted ${data.deletedCount} incomplete instances.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete instances",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

/**
 * Update all incomplete instances to match the series template
 */
export function useSyncTaskSeriesInstances() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const client = createApiClient();
      const response = await client.post<ApiResponse<{ updatedCount: number }>>(
        `task-series/${id}/sync-instances`
      );
      return response.data;
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: taskSeriesKeys.instances(id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });

      toast({
        title: "Instances updated",
        description: `Updated ${data.updatedCount} incomplete instances.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to sync instances",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

/**
 * Fetch task instances for a series
 */
export function useTaskSeriesInstances(
  id: string | null,
  filters?: { page?: number; limit?: number; completed?: boolean }
) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [...taskSeriesKeys.instances(id ?? ""), filters ?? {}],
    queryFn: async () => {
      if (!id) throw new Error("No series ID provided");
      const client = createApiClient();

      const searchParams = new URLSearchParams();
      if (filters?.page) searchParams.set("page", String(filters.page));
      if (filters?.limit) searchParams.set("limit", String(filters.limit));
      if (filters?.completed !== undefined)
        searchParams.set("completed", String(filters.completed));

      const queryStr = searchParams.toString();
      const path = queryStr
        ? `task-series/${id}/instances?${queryStr}`
        : `task-series/${id}/instances`;
      const response = await client.get<PaginatedResponse<Task[]>>(path);
      return response.data;
    },
    enabled: !!id && isAuthenticated,
  });
}
