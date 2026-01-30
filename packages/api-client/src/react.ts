/**
 * React Query hooks factory for Open Sunsama API
 * @module @open-sunsama/api-client/react
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
  type QueryClient,
} from "@tanstack/react-query";
import type {
  User,
  CreateUserInput,
  LoginInput,
  AuthResponse,
  UpdateUserInput,
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  ReorderTasksInput,
  TaskFilterInput,
  TaskStats,
  TimeBlock,
  CreateTimeBlockInput,
  UpdateTimeBlockInput,
  TimeBlockFilterInput,
  TimeBlockWithTask,
  QuickScheduleInput,
  TimeBlockSummary,
  ApiKey,
  CreateApiKeyInput,
  CreateApiKeyResponse,
  UpdateApiKeyInput,
  ApiKeyFilterInput,
  ApiKeyWithStats,
} from "@open-sunsama/types";
import type { OpenSunsamaClient } from "./client.js";
import type { AuthApi } from "./auth.js";
import type { TasksApi } from "./tasks.js";
import type { TimeBlocksApi } from "./time-blocks.js";
import type { ApiKeysApi } from "./api-keys.js";
import { createAuthApi } from "./auth.js";
import { createTasksApi } from "./tasks.js";
import { createTimeBlocksApi } from "./time-blocks.js";
import { createApiKeysApi } from "./api-keys.js";
import type { ApiError } from "./errors.js";

/**
 * Query key factory for consistent cache key management
 */
export const queryKeys = {
  // Auth
  auth: {
    all: ["auth"] as const,
    me: () => [...queryKeys.auth.all, "me"] as const,
  },

  // Tasks
  tasks: {
    all: ["tasks"] as const,
    lists: () => [...queryKeys.tasks.all, "list"] as const,
    list: (filters?: TaskFilterInput) =>
      [...queryKeys.tasks.lists(), filters ?? {}] as const,
    details: () => [...queryKeys.tasks.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.tasks.details(), id] as const,
    stats: (filters?: TaskFilterInput) =>
      [...queryKeys.tasks.all, "stats", filters ?? {}] as const,
  },

  // Time Blocks
  timeBlocks: {
    all: ["timeBlocks"] as const,
    lists: () => [...queryKeys.timeBlocks.all, "list"] as const,
    list: (filters?: TimeBlockFilterInput) =>
      [...queryKeys.timeBlocks.lists(), filters ?? {}] as const,
    details: () => [...queryKeys.timeBlocks.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.timeBlocks.details(), id] as const,
    summary: (startDate: string, endDate: string) =>
      [...queryKeys.timeBlocks.all, "summary", startDate, endDate] as const,
  },

  // API Keys
  apiKeys: {
    all: ["apiKeys"] as const,
    lists: () => [...queryKeys.apiKeys.all, "list"] as const,
    list: (filters?: ApiKeyFilterInput) =>
      [...queryKeys.apiKeys.lists(), filters ?? {}] as const,
    details: () => [...queryKeys.apiKeys.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.apiKeys.details(), id] as const,
  },
} as const;

/**
 * React hooks for Open Sunsama API
 */
export interface OpenSunsamaHooks {
  // Auth hooks
  useMe: (
    options?: Omit<UseQueryOptions<User, ApiError>, "queryKey" | "queryFn">
  ) => ReturnType<typeof useQuery<User, ApiError>>;

  useLogin: (
    options?: UseMutationOptions<AuthResponse, ApiError, LoginInput>
  ) => ReturnType<typeof useMutation<AuthResponse, ApiError, LoginInput>>;

  useRegister: (
    options?: UseMutationOptions<AuthResponse, ApiError, CreateUserInput>
  ) => ReturnType<typeof useMutation<AuthResponse, ApiError, CreateUserInput>>;

  useLogout: (
    options?: UseMutationOptions<void, ApiError, void>
  ) => ReturnType<typeof useMutation<void, ApiError, void>>;

  useUpdateMe: (
    options?: UseMutationOptions<User, ApiError, UpdateUserInput>
  ) => ReturnType<typeof useMutation<User, ApiError, UpdateUserInput>>;

  // Task hooks
  useTasks: (
    filters?: TaskFilterInput,
    options?: Omit<UseQueryOptions<Task[], ApiError>, "queryKey" | "queryFn">
  ) => ReturnType<typeof useQuery<Task[], ApiError>>;

  useTask: (
    id: string,
    options?: Omit<UseQueryOptions<Task, ApiError>, "queryKey" | "queryFn">
  ) => ReturnType<typeof useQuery<Task, ApiError>>;

  useTaskStats: (
    filters?: TaskFilterInput,
    options?: Omit<UseQueryOptions<TaskStats, ApiError>, "queryKey" | "queryFn">
  ) => ReturnType<typeof useQuery<TaskStats, ApiError>>;

  useCreateTask: (
    options?: UseMutationOptions<Task, ApiError, CreateTaskInput>
  ) => ReturnType<typeof useMutation<Task, ApiError, CreateTaskInput>>;

  useUpdateTask: (
    options?: UseMutationOptions<
      Task,
      ApiError,
      { id: string; input: UpdateTaskInput }
    >
  ) => ReturnType<
    typeof useMutation<Task, ApiError, { id: string; input: UpdateTaskInput }>
  >;

  useDeleteTask: (
    options?: UseMutationOptions<void, ApiError, string>
  ) => ReturnType<typeof useMutation<void, ApiError, string>>;

  useReorderTasks: (
    options?: UseMutationOptions<void, ApiError, ReorderTasksInput>
  ) => ReturnType<typeof useMutation<void, ApiError, ReorderTasksInput>>;

  useCompleteTask: (
    options?: UseMutationOptions<Task, ApiError, string>
  ) => ReturnType<typeof useMutation<Task, ApiError, string>>;

  useUncompleteTask: (
    options?: UseMutationOptions<Task, ApiError, string>
  ) => ReturnType<typeof useMutation<Task, ApiError, string>>;

  // Time Block hooks
  useTimeBlocks: (
    filters?: TimeBlockFilterInput,
    options?: Omit<
      UseQueryOptions<TimeBlock[], ApiError>,
      "queryKey" | "queryFn"
    >
  ) => ReturnType<typeof useQuery<TimeBlock[], ApiError>>;

  useTimeBlocksWithTasks: (
    filters?: TimeBlockFilterInput,
    options?: Omit<
      UseQueryOptions<TimeBlockWithTask[], ApiError>,
      "queryKey" | "queryFn"
    >
  ) => ReturnType<typeof useQuery<TimeBlockWithTask[], ApiError>>;

  useTimeBlock: (
    id: string,
    options?: Omit<UseQueryOptions<TimeBlock, ApiError>, "queryKey" | "queryFn">
  ) => ReturnType<typeof useQuery<TimeBlock, ApiError>>;

  useTimeBlockSummary: (
    startDate: string,
    endDate: string,
    options?: Omit<
      UseQueryOptions<TimeBlockSummary, ApiError>,
      "queryKey" | "queryFn"
    >
  ) => ReturnType<typeof useQuery<TimeBlockSummary, ApiError>>;

  useCreateTimeBlock: (
    options?: UseMutationOptions<TimeBlock, ApiError, CreateTimeBlockInput>
  ) => ReturnType<typeof useMutation<TimeBlock, ApiError, CreateTimeBlockInput>>;

  useUpdateTimeBlock: (
    options?: UseMutationOptions<
      TimeBlock,
      ApiError,
      { id: string; input: UpdateTimeBlockInput }
    >
  ) => ReturnType<
    typeof useMutation<
      TimeBlock,
      ApiError,
      { id: string; input: UpdateTimeBlockInput }
    >
  >;

  useDeleteTimeBlock: (
    options?: UseMutationOptions<void, ApiError, string>
  ) => ReturnType<typeof useMutation<void, ApiError, string>>;

  useQuickSchedule: (
    options?: UseMutationOptions<TimeBlock, ApiError, QuickScheduleInput>
  ) => ReturnType<typeof useMutation<TimeBlock, ApiError, QuickScheduleInput>>;

  // API Key hooks
  useApiKeys: (
    filters?: ApiKeyFilterInput,
    options?: Omit<UseQueryOptions<ApiKey[], ApiError>, "queryKey" | "queryFn">
  ) => ReturnType<typeof useQuery<ApiKey[], ApiError>>;

  useApiKeysWithStats: (
    filters?: ApiKeyFilterInput,
    options?: Omit<
      UseQueryOptions<ApiKeyWithStats[], ApiError>,
      "queryKey" | "queryFn"
    >
  ) => ReturnType<typeof useQuery<ApiKeyWithStats[], ApiError>>;

  useApiKey: (
    id: string,
    options?: Omit<UseQueryOptions<ApiKey, ApiError>, "queryKey" | "queryFn">
  ) => ReturnType<typeof useQuery<ApiKey, ApiError>>;

  useCreateApiKey: (
    options?: UseMutationOptions<CreateApiKeyResponse, ApiError, CreateApiKeyInput>
  ) => ReturnType<
    typeof useMutation<CreateApiKeyResponse, ApiError, CreateApiKeyInput>
  >;

  useUpdateApiKey: (
    options?: UseMutationOptions<
      ApiKey,
      ApiError,
      { id: string; input: UpdateApiKeyInput }
    >
  ) => ReturnType<
    typeof useMutation<ApiKey, ApiError, { id: string; input: UpdateApiKeyInput }>
  >;

  useRevokeApiKey: (
    options?: UseMutationOptions<void, ApiError, string>
  ) => ReturnType<typeof useMutation<void, ApiError, string>>;

  // Utilities
  invalidateQueries: (keys: readonly unknown[]) => Promise<void>;
}

/**
 * Create React Query hooks for Open Sunsama API
 * @param client The Open Sunsama client instance
 * @returns Object containing all hooks
 */
export function createReactHooks(client: OpenSunsamaClient): OpenSunsamaHooks {
  const authApi: AuthApi = createAuthApi(client);
  const tasksApi: TasksApi = createTasksApi(client);
  const timeBlocksApi: TimeBlocksApi = createTimeBlocksApi(client);
  const apiKeysApi: ApiKeysApi = createApiKeysApi(client);

  return {
    // Auth hooks
    useMe: (options) => {
      return useQuery({
        queryKey: queryKeys.auth.me(),
        queryFn: () => authApi.getMe(),
        ...options,
      });
    },

    useLogin: (options) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (input: LoginInput) => authApi.login(input),
        onSuccess: (data) => {
          // Update the current user in cache
          queryClient.setQueryData(queryKeys.auth.me(), data.user);
          // Update the client's token
          client.setToken(data.token);
        },
        ...options,
      });
    },

    useRegister: (options) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (input: CreateUserInput) => authApi.register(input),
        onSuccess: (data) => {
          queryClient.setQueryData(queryKeys.auth.me(), data.user);
          client.setToken(data.token);
        },
        ...options,
      });
    },

    useLogout: (options) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: () => authApi.logout(),
        onSuccess: () => {
          // Clear all queries
          queryClient.clear();
          client.setToken(undefined);
        },
        ...options,
      });
    },

    useUpdateMe: (options) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (input: UpdateUserInput) => authApi.updateMe(input),
        onSuccess: (data) => {
          queryClient.setQueryData(queryKeys.auth.me(), data);
        },
        ...options,
      });
    },

    // Task hooks
    useTasks: (filters, options) => {
      return useQuery({
        queryKey: queryKeys.tasks.list(filters),
        queryFn: async () => {
          const response = await tasksApi.list(filters);
          return response.data;
        },
        ...options,
      });
    },

    useTask: (id, options) => {
      return useQuery({
        queryKey: queryKeys.tasks.detail(id),
        queryFn: () => tasksApi.get(id),
        ...options,
      });
    },

    useTaskStats: (filters, options) => {
      return useQuery({
        queryKey: queryKeys.tasks.stats(filters),
        queryFn: () => tasksApi.getStats(filters),
        ...options,
      });
    },

    useCreateTask: (options) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (input: CreateTaskInput) => tasksApi.create(input),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
          queryClient.invalidateQueries({
            queryKey: [...queryKeys.tasks.all, "stats"],
          });
        },
        ...options,
      });
    },

    useUpdateTask: (options) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) =>
          tasksApi.update(id, input),
        onSuccess: (data, { id }) => {
          queryClient.setQueryData(queryKeys.tasks.detail(id), data);
          queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
          queryClient.invalidateQueries({
            queryKey: [...queryKeys.tasks.all, "stats"],
          });
        },
        ...options,
      });
    },

    useDeleteTask: (options) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (id: string) => tasksApi.delete(id),
        onSuccess: (_, id) => {
          queryClient.removeQueries({ queryKey: queryKeys.tasks.detail(id) });
          queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
          queryClient.invalidateQueries({
            queryKey: [...queryKeys.tasks.all, "stats"],
          });
        },
        ...options,
      });
    },

    useReorderTasks: (options) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (input: ReorderTasksInput) => tasksApi.reorder(input),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
        },
        ...options,
      });
    },

    useCompleteTask: (options) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (id: string) => tasksApi.complete(id),
        onSuccess: (data, id) => {
          queryClient.setQueryData(queryKeys.tasks.detail(id), data);
          queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
          queryClient.invalidateQueries({
            queryKey: [...queryKeys.tasks.all, "stats"],
          });
        },
        ...options,
      });
    },

    useUncompleteTask: (options) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (id: string) => tasksApi.uncomplete(id),
        onSuccess: (data, id) => {
          queryClient.setQueryData(queryKeys.tasks.detail(id), data);
          queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
          queryClient.invalidateQueries({
            queryKey: [...queryKeys.tasks.all, "stats"],
          });
        },
        ...options,
      });
    },

    // Time Block hooks
    useTimeBlocks: (filters, options) => {
      return useQuery({
        queryKey: queryKeys.timeBlocks.list(filters),
        queryFn: () => timeBlocksApi.list(filters),
        ...options,
      });
    },

    useTimeBlocksWithTasks: (filters, options) => {
      return useQuery({
        queryKey: [...queryKeys.timeBlocks.list(filters), "withTasks"],
        queryFn: () => timeBlocksApi.listWithTasks(filters),
        ...options,
      });
    },

    useTimeBlock: (id, options) => {
      return useQuery({
        queryKey: queryKeys.timeBlocks.detail(id),
        queryFn: () => timeBlocksApi.get(id),
        ...options,
      });
    },

    useTimeBlockSummary: (startDate, endDate, options) => {
      return useQuery({
        queryKey: queryKeys.timeBlocks.summary(startDate, endDate),
        queryFn: () => timeBlocksApi.getSummary(startDate, endDate),
        ...options,
      });
    },

    useCreateTimeBlock: (options) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (input: CreateTimeBlockInput) => timeBlocksApi.create(input),
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.timeBlocks.lists(),
          });
        },
        ...options,
      });
    },

    useUpdateTimeBlock: (options) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({
          id,
          input,
        }: {
          id: string;
          input: UpdateTimeBlockInput;
        }) => timeBlocksApi.update(id, input),
        onSuccess: (data, { id }) => {
          queryClient.setQueryData(queryKeys.timeBlocks.detail(id), data);
          queryClient.invalidateQueries({
            queryKey: queryKeys.timeBlocks.lists(),
          });
        },
        ...options,
      });
    },

    useDeleteTimeBlock: (options) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (id: string) => timeBlocksApi.delete(id),
        onSuccess: (_, id) => {
          queryClient.removeQueries({
            queryKey: queryKeys.timeBlocks.detail(id),
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.timeBlocks.lists(),
          });
        },
        ...options,
      });
    },

    useQuickSchedule: (options) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (input: QuickScheduleInput) =>
          timeBlocksApi.quickSchedule(input),
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.timeBlocks.lists(),
          });
        },
        ...options,
      });
    },

    // API Key hooks
    useApiKeys: (filters, options) => {
      return useQuery({
        queryKey: queryKeys.apiKeys.list(filters),
        queryFn: () => apiKeysApi.list(filters),
        ...options,
      });
    },

    useApiKeysWithStats: (filters, options) => {
      return useQuery({
        queryKey: [...queryKeys.apiKeys.list(filters), "withStats"],
        queryFn: () => apiKeysApi.listWithStats(filters),
        ...options,
      });
    },

    useApiKey: (id, options) => {
      return useQuery({
        queryKey: queryKeys.apiKeys.detail(id),
        queryFn: () => apiKeysApi.get(id),
        ...options,
      });
    },

    useCreateApiKey: (options) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (input: CreateApiKeyInput) => apiKeysApi.create(input),
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.apiKeys.lists(),
          });
        },
        ...options,
      });
    },

    useUpdateApiKey: (options) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateApiKeyInput }) =>
          apiKeysApi.update(id, input),
        onSuccess: (data, { id }) => {
          queryClient.setQueryData(queryKeys.apiKeys.detail(id), data);
          queryClient.invalidateQueries({
            queryKey: queryKeys.apiKeys.lists(),
          });
        },
        ...options,
      });
    },

    useRevokeApiKey: (options) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (id: string) => apiKeysApi.revoke(id),
        onSuccess: (_, id) => {
          queryClient.removeQueries({ queryKey: queryKeys.apiKeys.detail(id) });
          queryClient.invalidateQueries({
            queryKey: queryKeys.apiKeys.lists(),
          });
        },
        ...options,
      });
    },

    // Utilities
    invalidateQueries: async (keys) => {
      const queryClient = useQueryClient();
      await queryClient.invalidateQueries({ queryKey: keys });
    },
  };
}

/**
 * Create a standalone function to invalidate queries
 * Useful outside of React components
 */
export function createInvalidator(queryClient: QueryClient) {
  return {
    invalidateAuth: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all }),
    invalidateTasks: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
    invalidateTimeBlocks: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.timeBlocks.all }),
    invalidateApiKeys: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.all }),
    invalidateAll: () => queryClient.invalidateQueries(),
  };
}
