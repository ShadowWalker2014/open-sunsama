/**
 * Ideas API methods (boards / columns / idea cards)
 * @module @open-sunsama/api-client/ideas
 */

import type {
  Idea,
  IdeaBoard,
  IdeaColumn,
  Task,
  CreateIdeaBoardInput,
  UpdateIdeaBoardInput,
  CreateIdeaColumnInput,
  UpdateIdeaColumnInput,
  CreateIdeaInput,
  UpdateIdeaInput,
  ReorderIdeasInput,
  ReorderIdeaColumnsInput,
  ReorderIdeaBoardsInput,
  PromoteIdeaInput,
  IdeaFilterInput,
  IdeaSubtask,
  CreateIdeaSubtaskInput,
  UpdateIdeaSubtaskInput,
} from "@open-sunsama/types";
import type { OpenSunsamaClient, RequestOptions } from "./client.js";

interface ApiResponseWrapper<T> {
  success: boolean;
  data: T;
}

/** A board returned from create, with its seeded default column. */
export type IdeaBoardWithColumns = IdeaBoard & { columns: IdeaColumn[] };

/** Boards sub-API */
export interface IdeaBoardsApi {
  list(options?: RequestOptions): Promise<IdeaBoard[]>;
  create(
    input: CreateIdeaBoardInput,
    options?: RequestOptions
  ): Promise<IdeaBoardWithColumns>;
  update(
    id: string,
    input: UpdateIdeaBoardInput,
    options?: RequestOptions
  ): Promise<IdeaBoard>;
  delete(id: string, options?: RequestOptions): Promise<void>;
  reorder(
    input: ReorderIdeaBoardsInput,
    options?: RequestOptions
  ): Promise<IdeaBoard[]>;
}

/** Columns sub-API */
export interface IdeaColumnsApi {
  list(boardId: string, options?: RequestOptions): Promise<IdeaColumn[]>;
  create(
    input: CreateIdeaColumnInput,
    options?: RequestOptions
  ): Promise<IdeaColumn>;
  update(
    id: string,
    input: UpdateIdeaColumnInput,
    options?: RequestOptions
  ): Promise<IdeaColumn>;
  delete(id: string, options?: RequestOptions): Promise<void>;
  reorder(
    input: ReorderIdeaColumnsInput,
    options?: RequestOptions
  ): Promise<IdeaColumn[]>;
}

/** Idea subtasks sub-API */
export interface IdeaSubtasksApi {
  list(ideaId: string, options?: RequestOptions): Promise<IdeaSubtask[]>;
  create(
    ideaId: string,
    input: CreateIdeaSubtaskInput,
    options?: RequestOptions
  ): Promise<IdeaSubtask>;
  update(
    ideaId: string,
    subtaskId: string,
    input: UpdateIdeaSubtaskInput,
    options?: RequestOptions
  ): Promise<IdeaSubtask>;
  delete(
    ideaId: string,
    subtaskId: string,
    options?: RequestOptions
  ): Promise<void>;
  reorder(
    ideaId: string,
    subtaskIds: string[],
    options?: RequestOptions
  ): Promise<IdeaSubtask[]>;
}

/** Full Ideas API */
export interface IdeasApi {
  fromTask(
    input: { taskId: string; boardId: string; columnId: string },
    options?: RequestOptions
  ): Promise<Idea>;
  boards: IdeaBoardsApi;
  columns: IdeaColumnsApi;
  subtasks: IdeaSubtasksApi;
  list(filters?: IdeaFilterInput, options?: RequestOptions): Promise<Idea[]>;
  create(input: CreateIdeaInput, options?: RequestOptions): Promise<Idea>;
  update(
    id: string,
    input: UpdateIdeaInput,
    options?: RequestOptions
  ): Promise<Idea>;
  delete(id: string, options?: RequestOptions): Promise<void>;
  reorder(input: ReorderIdeasInput, options?: RequestOptions): Promise<Idea[]>;
  promote(
    id: string,
    input?: PromoteIdeaInput,
    options?: RequestOptions
  ): Promise<{ idea: Idea; task: Task }>;
}

/**
 * Create ideas API methods bound to a client.
 */
export function createIdeasApi(client: OpenSunsamaClient): IdeasApi {
  return {
    boards: {
      async list(options?: RequestOptions): Promise<IdeaBoard[]> {
        const res = await client.get<ApiResponseWrapper<IdeaBoard[]>>(
          "ideas/boards",
          options
        );
        return res.data ?? [];
      },
      async create(
        input: CreateIdeaBoardInput,
        options?: RequestOptions
      ): Promise<IdeaBoardWithColumns> {
        const res = await client.post<ApiResponseWrapper<IdeaBoardWithColumns>>(
          "ideas/boards",
          input,
          options
        );
        return res.data;
      },
      async update(
        id: string,
        input: UpdateIdeaBoardInput,
        options?: RequestOptions
      ): Promise<IdeaBoard> {
        const res = await client.patch<ApiResponseWrapper<IdeaBoard>>(
          `ideas/boards/${id}`,
          input,
          options
        );
        return res.data;
      },
      async delete(id: string, options?: RequestOptions): Promise<void> {
        await client.delete<ApiResponseWrapper<void>>(
          `ideas/boards/${id}`,
          options
        );
      },
      async reorder(
        input: ReorderIdeaBoardsInput,
        options?: RequestOptions
      ): Promise<IdeaBoard[]> {
        const res = await client.post<ApiResponseWrapper<IdeaBoard[]>>(
          "ideas/boards/reorder",
          input,
          options
        );
        return res.data ?? [];
      },
    },

    columns: {
      async list(
        boardId: string,
        options?: RequestOptions
      ): Promise<IdeaColumn[]> {
        const res = await client.get<ApiResponseWrapper<IdeaColumn[]>>(
          "ideas/columns",
          {
            ...options,
            searchParams: { ...options?.searchParams, boardId },
          }
        );
        return res.data ?? [];
      },
      async create(
        input: CreateIdeaColumnInput,
        options?: RequestOptions
      ): Promise<IdeaColumn> {
        const res = await client.post<ApiResponseWrapper<IdeaColumn>>(
          "ideas/columns",
          input,
          options
        );
        return res.data;
      },
      async update(
        id: string,
        input: UpdateIdeaColumnInput,
        options?: RequestOptions
      ): Promise<IdeaColumn> {
        const res = await client.patch<ApiResponseWrapper<IdeaColumn>>(
          `ideas/columns/${id}`,
          input,
          options
        );
        return res.data;
      },
      async delete(id: string, options?: RequestOptions): Promise<void> {
        await client.delete<ApiResponseWrapper<void>>(
          `ideas/columns/${id}`,
          options
        );
      },
      async reorder(
        input: ReorderIdeaColumnsInput,
        options?: RequestOptions
      ): Promise<IdeaColumn[]> {
        const res = await client.post<ApiResponseWrapper<IdeaColumn[]>>(
          "ideas/columns/reorder",
          input,
          options
        );
        return res.data ?? [];
      },
    },

    async list(
      filters?: IdeaFilterInput,
      options?: RequestOptions
    ): Promise<Idea[]> {
      const searchParams: Record<string, string | undefined> = {
        boardId: filters?.boardId,
        columnId: filters?.columnId,
        completed:
          filters?.completed !== undefined
            ? String(filters.completed)
            : undefined,
      };
      const res = await client.get<ApiResponseWrapper<Idea[]>>("ideas", {
        ...options,
        searchParams: { ...options?.searchParams, ...searchParams },
      });
      return res.data ?? [];
    },

    async create(
      input: CreateIdeaInput,
      options?: RequestOptions
    ): Promise<Idea> {
      const res = await client.post<ApiResponseWrapper<Idea>>(
        "ideas",
        input,
        options
      );
      return res.data;
    },

    async update(
      id: string,
      input: UpdateIdeaInput,
      options?: RequestOptions
    ): Promise<Idea> {
      const res = await client.patch<ApiResponseWrapper<Idea>>(
        `ideas/${id}`,
        input,
        options
      );
      return res.data;
    },

    async delete(id: string, options?: RequestOptions): Promise<void> {
      await client.delete<ApiResponseWrapper<void>>(`ideas/${id}`, options);
    },

    async reorder(
      input: ReorderIdeasInput,
      options?: RequestOptions
    ): Promise<Idea[]> {
      const res = await client.post<ApiResponseWrapper<Idea[]>>(
        "ideas/reorder",
        input,
        options
      );
      return res.data ?? [];
    },

    async fromTask(input, options) {
      const response = await client.post<ApiResponseWrapper<Idea>>(
        "ideas/from-task",
        input,
        options
      );
      return response.data;
    },

    async promote(
      id: string,
      input?: PromoteIdeaInput,
      options?: RequestOptions
    ): Promise<{ idea: Idea; task: Task }> {
      const res = await client.post<
        ApiResponseWrapper<{ idea: Idea; task: Task }>
      >(`ideas/${id}/promote`, input ?? {}, options);
      return res.data;
    },

    subtasks: {
      async list(
        ideaId: string,
        options?: RequestOptions
      ): Promise<IdeaSubtask[]> {
        const res = await client.get<ApiResponseWrapper<IdeaSubtask[]>>(
          `ideas/${ideaId}/subtasks`,
          options
        );
        return res.data ?? [];
      },
      async create(
        ideaId: string,
        input: CreateIdeaSubtaskInput,
        options?: RequestOptions
      ): Promise<IdeaSubtask> {
        const res = await client.post<ApiResponseWrapper<IdeaSubtask>>(
          `ideas/${ideaId}/subtasks`,
          input,
          options
        );
        return res.data;
      },
      async update(
        ideaId: string,
        subtaskId: string,
        input: UpdateIdeaSubtaskInput,
        options?: RequestOptions
      ): Promise<IdeaSubtask> {
        const res = await client.patch<ApiResponseWrapper<IdeaSubtask>>(
          `ideas/${ideaId}/subtasks/${subtaskId}`,
          input,
          options
        );
        return res.data;
      },
      async delete(
        ideaId: string,
        subtaskId: string,
        options?: RequestOptions
      ): Promise<void> {
        await client.delete<ApiResponseWrapper<void>>(
          `ideas/${ideaId}/subtasks/${subtaskId}`,
          options
        );
      },
      async reorder(
        ideaId: string,
        subtaskIds: string[],
        options?: RequestOptions
      ): Promise<IdeaSubtask[]> {
        const res = await client.post<ApiResponseWrapper<IdeaSubtask[]>>(
          `ideas/${ideaId}/subtasks/reorder`,
          { subtaskIds },
          options
        );
        return res.data ?? [];
      },
    },
  };
}
