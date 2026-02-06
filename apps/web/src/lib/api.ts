import { createApi, createOpenSunsamaClient, type OpenSunsamaClient } from "@open-sunsama/api-client";
import { isDesktop } from "./desktop";

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Desktop fetch wrapper that routes requests through Tauri's HTTP plugin.
 * This bypasses WKWebView CORS restrictions for the tauri:// protocol.
 * The dynamic import is awaited on every call (cached by the module system).
 */
const desktopFetch: typeof globalThis.fetch = async (input, init) => {
  const { fetch } = await import("@tauri-apps/plugin-http");
  return fetch(input, init);
};

// Use Tauri fetch in desktop mode, native fetch otherwise
const customFetch = isDesktop() ? desktopFetch : undefined;

// Get token from localStorage
function getToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem("open_sunsama_token") || undefined;
}

// Create the low-level client
let client = createOpenSunsamaClient({
  baseUrl,
  token: getToken() as string | undefined,
  customFetch,
});

// Create the typed API wrapper
let api = createApi({ baseUrl, token: getToken() as string | undefined, customFetch });

/**
 * Set the authentication token for API requests
 */
export function setAuthToken(token: string | null): void {
  const newToken = token || undefined;
  
  // Update the client and api instances
  client = createOpenSunsamaClient({
    baseUrl,
    token: newToken as string | undefined,
    customFetch,
  });
  
  api = createApi({ baseUrl, token: newToken as string | undefined, customFetch });
}

/**
 * Get the current API instance
 */
export function getApi() {
  // Always return with current token from storage
  const token = getToken();
  return createApi({ baseUrl, token: token as string | undefined, customFetch });
}

/**
 * Get the API client for making requests
 */
export function getApiClient() {
  const token = getToken();
  return createOpenSunsamaClient({ baseUrl, token: token as string | undefined, customFetch });
}

/**
 * React hook to get the API instance
 * Returns the typed API wrapper for use in React components/hooks
 */
export function useApiClient() {
  return getApi();
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
