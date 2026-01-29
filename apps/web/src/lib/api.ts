import { createApiClient, type ApiClient } from "@chronoflow/api-client";

// Create a singleton API client instance
let apiClient: ApiClient | null = null;

/**
 * Get the API client instance
 * Creates a new instance if one doesn't exist
 */
export function getApiClient(): ApiClient {
  if (!apiClient) {
    apiClient = createApiClient({
      baseUrl: import.meta.env.VITE_API_URL || "/api",
      timeout: 30000,
    });
  }
  return apiClient;
}

/**
 * Set the authentication token for API requests
 */
export function setAuthToken(token: string | null): void {
  apiClient = createApiClient({
    baseUrl: import.meta.env.VITE_API_URL || "/api",
    timeout: 30000,
    defaultHeaders: token
      ? { Authorization: `Bearer ${token}` }
      : {},
  });
}

/**
 * Clear the API client (useful for logout)
 */
export function clearApiClient(): void {
  apiClient = null;
}

// Re-export types
export type { ApiClient };
