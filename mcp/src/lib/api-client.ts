/**
 * API client for Open Sunsama REST API
 * Handles authentication and HTTP requests
 */

export interface ApiClientConfig {
  baseUrl: string;
  apiKey: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    statusCode: number;
    errors?: Record<string, string[]>;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

export class ApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.apiKey = config.apiKey;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, string | number | boolean | undefined>
  ): Promise<ApiResponse<T>> {
    let url = `${this.baseUrl}${path}`;

    // Add query parameters
    if (query) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      }
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const headers: Record<string, string> = {
      "X-API-Key": this.apiKey,
      "Content-Type": "application/json",
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === "POST" || method === "PATCH" || method === "PUT")) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      const data = await response.json();
      return data as ApiResponse<T>;
    } catch (error) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message:
            error instanceof Error ? error.message : "Network request failed",
          statusCode: 0,
        },
      };
    }
  }

  // Tasks
  async listTasks(params?: {
    date?: string;
    from?: string;
    to?: string;
    completed?: boolean;
    backlog?: boolean;
    sortBy?: "priority" | "position" | "createdAt";
    page?: number;
    limit?: number;
  }) {
    return this.request<Task[]>("GET", "/tasks", undefined, {
      date: params?.date,
      from: params?.from,
      to: params?.to,
      completed: params?.completed,
      backlog: params?.backlog,
      sortBy: params?.sortBy,
      page: params?.page,
      limit: params?.limit,
    });
  }

  async getTask(id: string) {
    return this.request<Task>("GET", `/tasks/${id}`);
  }

  async createTask(data: CreateTaskInput) {
    return this.request<Task>("POST", "/tasks", data);
  }

  async updateTask(id: string, data: UpdateTaskInput) {
    return this.request<Task>("PATCH", `/tasks/${id}`, data);
  }

  async deleteTask(id: string) {
    return this.request<{ message: string }>("DELETE", `/tasks/${id}`);
  }

  async reorderTasks(date: string | "backlog", taskIds: string[]) {
    return this.request<Task[]>("POST", "/tasks/reorder", { date, taskIds });
  }

  // Subtasks
  async listSubtasks(taskId: string) {
    return this.request<Subtask[]>("GET", `/tasks/${taskId}/subtasks`);
  }

  async createSubtask(taskId: string, data: CreateSubtaskInput) {
    return this.request<Subtask>("POST", `/tasks/${taskId}/subtasks`, data);
  }

  async updateSubtask(
    taskId: string,
    subtaskId: string,
    data: UpdateSubtaskInput
  ) {
    return this.request<Subtask>(
      "PATCH",
      `/tasks/${taskId}/subtasks/${subtaskId}`,
      data
    );
  }

  async deleteSubtask(taskId: string, subtaskId: string) {
    return this.request<{ message: string }>(
      "DELETE",
      `/tasks/${taskId}/subtasks/${subtaskId}`
    );
  }

  // Time Blocks
  async listTimeBlocks(params?: {
    date?: string;
    from?: string;
    to?: string;
    taskId?: string;
    page?: number;
    limit?: number;
  }) {
    return this.request<TimeBlock[]>("GET", "/time-blocks", undefined, {
      date: params?.date,
      from: params?.from,
      to: params?.to,
      taskId: params?.taskId,
      page: params?.page,
      limit: params?.limit,
    });
  }

  async getTimeBlock(id: string) {
    return this.request<TimeBlock>("GET", `/time-blocks/${id}`);
  }

  async createTimeBlock(data: CreateTimeBlockInput) {
    return this.request<TimeBlock>("POST", "/time-blocks", data);
  }

  async updateTimeBlock(id: string, data: UpdateTimeBlockInput) {
    return this.request<TimeBlock>("PATCH", `/time-blocks/${id}`, data);
  }

  async deleteTimeBlock(id: string) {
    return this.request<{ message: string }>("DELETE", `/time-blocks/${id}`);
  }

  // User
  async getMe() {
    return this.request<User>("GET", "/auth/me");
  }

  async updateMe(data: UpdateUserInput) {
    return this.request<User>("PATCH", "/auth/me", data);
  }
}

// Types
export type TaskPriority = "P0" | "P1" | "P2" | "P3";

export interface Task {
  id: string;
  userId: string;
  title: string;
  notes: string | null;
  scheduledDate: string | null;
  estimatedMins: number | null;
  actualMins: number | null;
  priority: TaskPriority;
  completedAt: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  notes?: string;
  scheduledDate?: string;
  estimatedMins?: number;
  priority?: TaskPriority;
  position?: number;
}

export interface UpdateTaskInput {
  title?: string;
  notes?: string | null;
  scheduledDate?: string | null;
  estimatedMins?: number | null;
  actualMins?: number | null;
  priority?: TaskPriority;
  completedAt?: string | null;
  position?: number;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubtaskInput {
  title: string;
  position?: number;
}

export interface UpdateSubtaskInput {
  title?: string;
  completed?: boolean;
  position?: number;
}

export interface TimeBlock {
  id: string;
  userId: string;
  taskId: string | null;
  title: string;
  description: string | null;
  date: string;
  startTime: string;
  endTime: string;
  durationMins: number;
  color: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  task?: Task | null;
}

export interface CreateTimeBlockInput {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  taskId?: string;
  description?: string;
  color?: string;
  position?: number;
}

export interface UpdateTimeBlockInput {
  title?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  taskId?: string | null;
  description?: string | null;
  color?: string | null;
  position?: number;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  preferences: UserPreferences | null;
}

export interface UserPreferences {
  themeMode: "light" | "dark" | "system";
  colorTheme: string;
  fontFamily: string;
}

export interface UpdateUserInput {
  name?: string;
  avatarUrl?: string | null;
  timezone?: string;
  preferences?: Partial<UserPreferences>;
}
