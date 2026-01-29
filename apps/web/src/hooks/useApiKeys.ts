import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

/**
 * API Key type definition
 */
export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

/**
 * Response after creating an API key (includes full key)
 */
export interface CreateApiKeyResponse {
  apiKey: ApiKey;
  key: string; // Full key - only shown once!
}

/**
 * Input for creating a new API key
 */
export interface CreateApiKeyInput {
  name: string;
  scopes: string[];
  expiresAt?: string | null;
}

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
    queryFn: async () => {
      const client = getApiClient();
      const response = await client.request<{ apiKeys: ApiKey[] }>("GET", "/api-keys");
      return response.apiKeys;
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
      const client = getApiClient();
      const response = await client.request<CreateApiKeyResponse>("POST", "/api-keys", {
        body: data,
      });
      return response;
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
    mutationFn: async (id: string) => {
      const client = getApiClient();
      await client.request("DELETE", `/api-keys/${id}`);
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
