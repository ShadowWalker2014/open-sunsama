/**
 * Hook for syncing user preferences to the database
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { UserPreferences } from "@open-sunsama/types";

/**
 * Hook to save user preferences to the database
 * Returns a mutation that persists preferences to the server
 */
export function useSavePreferences() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (preferences: UserPreferences) => {
      const token = localStorage.getItem("open_sunsama_token");
      if (!token || !user) {
        // Not authenticated, skip saving to server
        return null;
      }

      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const response = await fetch(`${baseUrl}/auth/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ preferences }),
      });

      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate user query to refresh cached user data
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}
