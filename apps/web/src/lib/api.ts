import { createApi, createOpenSunsamaClient, type OpenSunsamaClient } from "@open-sunsama/api-client";

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Get token from localStorage
function getToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem("open_sunsama_token") || undefined;
}

// Create the low-level client
let client = createOpenSunsamaClient({
  baseUrl,
  token: getToken() as string | undefined,
});

// Create the typed API wrapper
let api = createApi({ baseUrl, token: getToken() as string | undefined });

/**
 * Set the authentication token for API requests
 */
export function setAuthToken(token: string | null): void {
  const newToken = token || undefined;
  
  // Update the client and api instances
  client = createOpenSunsamaClient({
    baseUrl,
    token: newToken as string | undefined,
  });
  
  api = createApi({ baseUrl, token: newToken as string | undefined });
}

/**
 * Get the current API instance
 */
export function getApi() {
  // Always return with current token from storage
  const token = getToken();
  return createApi({ baseUrl, token: token as string | undefined });
}

/**
 * Get the API client for making requests
 */
export function getApiClient() {
  const token = getToken();
  return createOpenSunsamaClient({ baseUrl, token: token as string | undefined });
}

/**
 * Clear the API client (useful for logout)
 */
export function clearApiClient(): void {
  client = createOpenSunsamaClient({ baseUrl });
  api = createApi({ baseUrl });
}

// Export the api for direct access
export { api, client };
export type { OpenSunsamaClient };
