import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ApiKey,
  CreateApiKeyInput,
  CreateApiKeyResponse,
} from "@chronoflow/types";
import { getApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

/**
 * Query key factory for API keys
 */
export const apiKeyKeys = {
  all: ["apiKeys"] as const,
  lists: () => [...apiKeyKeys.all, "list"] as const,
  detail: (id: string) => [...apiKeyKeys.all, "detail", id] as const,
};

/**
 * Fetch all API keys for the current user
 */
export function useApiKeys() {
  return useQuery({
    queryKey: apiKeyKeys.lists(),
    queryFn: async (): Promise<ApiKey[]> => {
      const api = getApi();
      return await api.apiKeys.list();
    },
  });
}

/**
 * Create a new API key
 */
export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateApiKeyInput): Promise<CreateApiKeyResponse> => {
      const api = getApi();
      return await api.apiKeys.create(data);
    },
    onSuccess: (response) => {
      // Invalidate and refetch API keys list
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.lists() });

      toast({
        title: "API key created",
        description: `"${response.apiKey.name}" has been created. Make sure to copy it now!`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create API key",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

/**
 * Revoke an API key
 */
export function useRevokeApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<string> => {
      const api = getApi();
      await api.apiKeys.revoke(id);
      return id;
    },
    onSuccess: () => {
      // Invalidate and refetch API keys list
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.lists() });

      toast({
        title: "API key revoked",
        description: "The API key has been permanently revoked.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to revoke API key",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

// Re-export types for convenience
export type { ApiKey, CreateApiKeyInput, CreateApiKeyResponse };
