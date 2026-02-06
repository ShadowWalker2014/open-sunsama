import { createApi, createOpenSunsamaClient, type OpenSunsamaClient } from "@open-sunsama/api-client";
import { isDesktop } from "./desktop";

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Tauri HTTP plugin fetch - loaded lazily when running in desktop
let tauriFetch: typeof globalThis.fetch | undefined;

/**
 * Get the appropriate fetch function.
 * Uses Tauri HTTP plugin in desktop mode to bypass WebView CORS restrictions.
 */
async function loadTauriFetch(): Promise<typeof globalThis.fetch | undefined> {
  if (!isDesktop()) return undefined;
  if (tauriFetch) return tauriFetch;
  const { fetch } = await import("@tauri-apps/plugin-http");
  tauriFetch = fetch;
  return tauriFetch;
}

// Eagerly load Tauri fetch if in desktop mode
if (isDesktop()) {
  loadTauriFetch();
}

// Get token from localStorage
function getToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem("open_sunsama_token") || undefined;
}

// Create the low-level client
let client = createOpenSunsamaClient({
  baseUrl,
  token: getToken() as string | undefined,
  customFetch: tauriFetch,
});

// Create the typed API wrapper
let api = createApi({ baseUrl, token: getToken() as string | undefined, customFetch: tauriFetch });

/**
 * Set the authentication token for API requests
 */
export function setAuthToken(token: string | null): void {
  const newToken = token || undefined;
  
  // Update the client and api instances
  client = createOpenSunsamaClient({
    baseUrl,
    token: newToken as string | undefined,
    customFetch: tauriFetch,
  });
  
  api = createApi({ baseUrl, token: newToken as string | undefined, customFetch: tauriFetch });
}

/**
 * Get the current API instance
 */
export function getApi() {
  // Always return with current token from storage
  const token = getToken();
  return createApi({ baseUrl, token: token as string | undefined, customFetch: tauriFetch });
}

/**
 * Get the API client for making requests
 */
export function getApiClient() {
  const token = getToken();
  return createOpenSunsamaClient({ baseUrl, token: token as string | undefined, customFetch: tauriFetch });
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
