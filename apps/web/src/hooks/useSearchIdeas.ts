import { useQuery } from "@tanstack/react-query";
import type { Idea, IdeaBoard } from "@open-sunsama/types";
import { getApi } from "@/lib/api";
import { ideaKeys, ideaBoardKeys } from "@/lib/query-keys";
import { useAuth } from "@/hooks/useAuth";

export interface IdeaSearchResult {
  idea: Idea;
  board: IdeaBoard | undefined;
}

/**
 * Cross-board idea search for the command palette.
 *
 * `GET /ideas` with no board filter returns every idea the user owns, so one
 * cached list backs all queries; matching is client-side (title + notes) which
 * keeps typing instant. Only runs while the palette has a query.
 */
export function useSearchIdeas(query: string, limit = 20): IdeaSearchResult[] {
  const { isAuthenticated } = useAuth();
  const trimmed = query.trim().toLowerCase();

  const { data: ideas = [] } = useQuery({
    // Distinct from the per-board lists, but still under ideaKeys.all so the
    // websocket invalidations refresh it.
    queryKey: [...ideaKeys.all, "search-all"],
    queryFn: async () => {
      const api = getApi();
      return await api.ideas.list({});
    },
    enabled: isAuthenticated && trimmed.length > 0,
    staleTime: 30_000,
  });

  const { data: boards = [] } = useQuery({
    queryKey: ideaBoardKeys.lists(),
    queryFn: async () => {
      const api = getApi();
      return await api.ideas.boards.list();
    },
    enabled: isAuthenticated && trimmed.length > 0,
    staleTime: 60_000,
  });

  if (!trimmed) return [];

  const byId = new Map(boards.map((b) => [b.id, b]));
  return ideas
    .filter((idea) => {
      const notes = idea.notes?.replace(/<[^>]*>/g, " ") ?? "";
      return (
        idea.title.toLowerCase().includes(trimmed) ||
        notes.toLowerCase().includes(trimmed)
      );
    })
    .slice(0, limit)
    .map((idea) => ({ idea, board: byId.get(idea.boardId) }));
}
