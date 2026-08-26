/**
 * React Query hooks for the Ideas feature (boards / columns / idea cards).
 * Mirrors the patterns in useTasks: cached singleton API, optimistic creates
 * and reorders, invalidation on the rest, toast on failure.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Idea,
  IdeaBoard,
  IdeaColumn,
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
} from "@open-sunsama/types";
import { getApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { ideaBoardKeys, ideaKeys, taskKeys } from "@/lib/query-keys";

export { ideaBoardKeys, ideaKeys };

// ───────────────────────── queries ─────────────────────────

export function useIdeaBoards() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ideaBoardKeys.lists(),
    queryFn: async () => {
      const api = getApi();
      return await api.ideas.boards.list();
    },
    enabled: isAuthenticated,
  });
}

export function useIdeaColumns(boardId: string | undefined) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ideaBoardKeys.columns(boardId ?? ""),
    queryFn: async () => {
      const api = getApi();
      return await api.ideas.columns.list(boardId!);
    },
    enabled: isAuthenticated && !!boardId,
  });
}

export function useIdeas(boardId: string | undefined) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ideaKeys.byBoard(boardId ?? ""),
    queryFn: async () => {
      const api = getApi();
      return await api.ideas.list({ boardId });
    },
    enabled: isAuthenticated && !!boardId,
  });
}

// ───────────────────────── boards ─────────────────────────

export function useCreateIdeaBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateIdeaBoardInput) => {
      const api = getApi();
      return await api.ideas.boards.create(input);
    },
    onSuccess: (board) => {
      queryClient.invalidateQueries({ queryKey: ideaBoardKeys.lists() });
      // Seed the columns cache with the default column the server created.
      queryClient.setQueryData<IdeaColumn[]>(
        ideaBoardKeys.columns(board.id),
        board.columns ?? []
      );
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create board",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

export function useUpdateIdeaBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateIdeaBoardInput;
    }) => {
      const api = getApi();
      return await api.ideas.boards.update(id, input);
    },
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: ideaBoardKeys.lists() });
      const previous = queryClient.getQueryData<IdeaBoard[]>(
        ideaBoardKeys.lists()
      );
      queryClient.setQueryData<IdeaBoard[]>(ideaBoardKeys.lists(), (old) =>
        (old ?? []).map((b) => (b.id === id ? { ...b, ...input } : b))
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(ideaBoardKeys.lists(), context.previous);
      }
      toast({
        variant: "destructive",
        title: "Failed to update board",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ideaBoardKeys.lists() });
    },
  });
}

export function useDeleteIdeaBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const api = getApi();
      await api.ideas.boards.delete(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ideaBoardKeys.lists() });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete board",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

export function useReorderIdeaBoards() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ReorderIdeaBoardsInput) => {
      const api = getApi();
      return await api.ideas.boards.reorder(input);
    },
    onMutate: async ({ boardIds }) => {
      await queryClient.cancelQueries({ queryKey: ideaBoardKeys.lists() });
      const previous = queryClient.getQueryData<IdeaBoard[]>(
        ideaBoardKeys.lists()
      );
      if (previous) {
        const byId = new Map(previous.map((b) => [b.id, b]));
        const reordered = boardIds
          .map((id, index) => {
            const b = byId.get(id);
            return b ? { ...b, position: index } : undefined;
          })
          .filter((b): b is IdeaBoard => !!b);
        queryClient.setQueryData<IdeaBoard[]>(ideaBoardKeys.lists(), reordered);
      }
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(ideaBoardKeys.lists(), context.previous);
      }
      toast({
        variant: "destructive",
        title: "Failed to reorder boards",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ideaBoardKeys.lists() });
    },
  });
}

// ───────────────────────── columns ─────────────────────────

export function useCreateIdeaColumn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateIdeaColumnInput) => {
      const api = getApi();
      return await api.ideas.columns.create(input);
    },
    onSuccess: (column) => {
      queryClient.invalidateQueries({
        queryKey: ideaBoardKeys.columns(column.boardId),
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to add column",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

export function useUpdateIdeaColumn(boardId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateIdeaColumnInput;
    }) => {
      const api = getApi();
      return await api.ideas.columns.update(id, input);
    },
    onMutate: async ({ id, input }) => {
      if (!boardId) return {};
      const key = ideaBoardKeys.columns(boardId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<IdeaColumn[]>(key);
      queryClient.setQueryData<IdeaColumn[]>(key, (old) =>
        (old ?? []).map((col) => (col.id === id ? { ...col, ...input } : col))
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (boardId && context?.previous) {
        queryClient.setQueryData(
          ideaBoardKeys.columns(boardId),
          context.previous
        );
      }
      toast({
        variant: "destructive",
        title: "Failed to rename column",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
    onSettled: () => {
      if (boardId) {
        queryClient.invalidateQueries({
          queryKey: ideaBoardKeys.columns(boardId),
        });
      }
    },
  });
}

export function useDeleteIdeaColumn(boardId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const api = getApi();
      await api.ideas.columns.delete(id);
      return id;
    },
    onSuccess: () => {
      if (boardId) {
        queryClient.invalidateQueries({
          queryKey: ideaBoardKeys.columns(boardId),
        });
        queryClient.invalidateQueries({ queryKey: ideaKeys.byBoard(boardId) });
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete column",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

export function useReorderIdeaColumns(boardId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ReorderIdeaColumnsInput) => {
      const api = getApi();
      return await api.ideas.columns.reorder(input);
    },
    onMutate: async ({ columnIds }) => {
      if (!boardId) return {};
      const key = ideaBoardKeys.columns(boardId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<IdeaColumn[]>(key);
      if (previous) {
        const byId = new Map(previous.map((c) => [c.id, c]));
        const reordered = columnIds
          .map((id, index) => {
            const c = byId.get(id);
            return c ? { ...c, position: index } : undefined;
          })
          .filter((c): c is IdeaColumn => !!c);
        queryClient.setQueryData<IdeaColumn[]>(key, reordered);
      }
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (boardId && context?.previous) {
        queryClient.setQueryData(
          ideaBoardKeys.columns(boardId),
          context.previous
        );
      }
      toast({
        variant: "destructive",
        title: "Failed to reorder columns",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
    onSettled: () => {
      if (boardId) {
        queryClient.invalidateQueries({
          queryKey: ideaBoardKeys.columns(boardId),
        });
      }
    },
  });
}

// ───────────────────────── ideas ─────────────────────────

export function useCreateIdea(boardId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateIdeaInput) => {
      const api = getApi();
      return await api.ideas.create(input);
    },
    onMutate: async (input) => {
      if (!boardId) return {};
      const key = ideaKeys.byBoard(boardId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Idea[]>(key);
      const now = new Date();
      const optimistic: Idea = {
        id: `optimistic-${now.getTime()}-${Math.random()
          .toString(36)
          .slice(2)}`,
        userId: "",
        boardId: input.boardId,
        columnId: input.columnId,
        title: input.title,
        notes: input.notes ?? null,
        estimatedMins: input.estimatedMins ?? null,
        priority: input.priority ?? "P2",
        position: Number.MAX_SAFE_INTEGER,
        completedAt: null,
        promotedTaskId: null,
        createdAt: now,
        updatedAt: now,
      };
      queryClient.setQueryData<Idea[]>(key, (old) => [
        ...(old ?? []),
        optimistic,
      ]);
      return { previous, tempId: optimistic.id };
    },
    onSuccess: (created, _input, context) => {
      if (!boardId) return;
      queryClient.setQueryData<Idea[]>(ideaKeys.byBoard(boardId), (old) =>
        (old ?? []).map((i) => (i.id === context?.tempId ? created : i))
      );
    },
    onError: (error, _input, context) => {
      if (boardId && context?.previous) {
        queryClient.setQueryData(ideaKeys.byBoard(boardId), context.previous);
      }
      toast({
        variant: "destructive",
        title: "Failed to add idea",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

export function useUpdateIdea(boardId: string | undefined) {
  const queryClient = useQueryClient();
  const { record } = useUndoRedo();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateIdeaInput;
    }) => {
      const api = getApi();
      return await api.ideas.update(id, input);
    },
    onMutate: async ({ id, input }) => {
      if (!boardId) return {};
      const key = ideaKeys.byBoard(boardId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Idea[]>(key);
      const prevCompletedAt =
        previous?.find((i) => i.id === id)?.completedAt ?? null;
      queryClient.setQueryData<Idea[]>(key, (old) =>
        (old ?? []).map((i) =>
          i.id === id
            ? {
                ...i,
                ...input,
                completedAt:
                  input.completedAt !== undefined
                    ? input.completedAt
                    : i.completedAt,
              }
            : i
        )
      );
      return { previous, prevCompletedAt };
    },
    onError: (error, _vars, context) => {
      if (boardId && context?.previous) {
        queryClient.setQueryData(ideaKeys.byBoard(boardId), context.previous);
      }
      toast({
        variant: "destructive",
        title: "Failed to update idea",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
    onSuccess: (_data, { id, input }, context) => {
      // Make completion toggles undoable (other field edits aren't recorded).
      if (input.completedAt === undefined) return;
      const prevCompletedAt = context?.prevCompletedAt ?? null;
      const nextCompletedAt = input.completedAt;
      try {
        record({
          label: nextCompletedAt ? "Complete idea" : "Uncomplete idea",
          undo: async () => {
            await getApi().ideas.update(id, { completedAt: prevCompletedAt });
            if (boardId) {
              queryClient.invalidateQueries({
                queryKey: ideaKeys.byBoard(boardId),
              });
            }
          },
          redo: async () => {
            await getApi().ideas.update(id, { completedAt: nextCompletedAt });
            if (boardId) {
              queryClient.invalidateQueries({
                queryKey: ideaKeys.byBoard(boardId),
              });
            }
          },
        });
      } catch {
        // history bookkeeping must never break the update
      }
    },
    onSettled: () => {
      if (boardId) {
        queryClient.invalidateQueries({ queryKey: ideaKeys.byBoard(boardId) });
      }
    },
  });
}

export function useDeleteIdea(boardId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const api = getApi();
      await api.ideas.delete(id);
      return id;
    },
    onMutate: async (id) => {
      if (!boardId) return {};
      const key = ideaKeys.byBoard(boardId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Idea[]>(key);
      queryClient.setQueryData<Idea[]>(key, (old) =>
        (old ?? []).filter((i) => i.id !== id)
      );
      return { previous };
    },
    onError: (error, _id, context) => {
      if (boardId && context?.previous) {
        queryClient.setQueryData(ideaKeys.byBoard(boardId), context.previous);
      }
      toast({
        variant: "destructive",
        title: "Failed to delete idea",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

export function useReorderIdeas(boardId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ReorderIdeasInput) => {
      const api = getApi();
      return await api.ideas.reorder(input);
    },
    onMutate: async ({ columnId, ideaIds }) => {
      if (!boardId) return {};
      const key = ideaKeys.byBoard(boardId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Idea[]>(key);
      if (previous) {
        const orderIndex = new Map(ideaIds.map((id, index) => [id, index]));
        const next = previous.map((idea) =>
          orderIndex.has(idea.id)
            ? {
                ...idea,
                columnId,
                position: orderIndex.get(idea.id)!,
              }
            : idea
        );
        queryClient.setQueryData<Idea[]>(key, next);
      }
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (boardId && context?.previous) {
        queryClient.setQueryData(ideaKeys.byBoard(boardId), context.previous);
      }
      toast({
        variant: "destructive",
        title: "Failed to reorder ideas",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
    onSettled: () => {
      if (boardId) {
        queryClient.invalidateQueries({ queryKey: ideaKeys.byBoard(boardId) });
      }
    },
  });
}

export function usePromoteIdea(boardId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input?: PromoteIdeaInput;
    }) => {
      const api = getApi();
      return await api.ideas.promote(id, input);
    },
    onSuccess: (result) => {
      if (boardId) {
        // Reflect the new promotedTaskId on the card.
        queryClient.setQueryData<Idea[]>(ideaKeys.byBoard(boardId), (old) =>
          (old ?? []).map((i) => (i.id === result.idea.id ? result.idea : i))
        );
      }
      // The promote created a real task — refresh task lists.
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      const scheduled = result.task.scheduledDate;
      const today = new Date().toISOString().slice(0, 10);
      const title = !scheduled
        ? "Added to Backlog"
        : scheduled === today
          ? "Added to Today"
          : "Scheduled";
      toast({
        title,
        description: `"${result.task.title}" is now in your planner.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to promote idea",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}
