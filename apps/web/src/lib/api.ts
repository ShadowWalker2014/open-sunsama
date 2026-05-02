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

const TOKEN_KEY = "open_sunsama_token";

function getToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem(TOKEN_KEY) || undefined;
}

// Singleton instances. We keep one client + one api wrapper for the entire
// session and only swap them when the token changes — recreating these on
// every getApi() call (the previous behavior) allocated a fresh ky instance
// per query/mutation, which adds up under heavy use.
let currentToken: string | undefined = getToken();
let client: OpenSunsamaClient = createOpenSunsamaClient({
  baseUrl,
  token: currentToken,
  customFetch,
});
let api = createApi({ baseUrl, token: currentToken, customFetch });

/**
 * Set the authentication token for API requests.
 * Rebuilds the singleton client+api so all in-flight callers pick up the
 * new auth header on their next request.
 */
export function setAuthToken(token: string | null): void {
  const newToken = token || undefined;
  if (newToken === currentToken) return;
  currentToken = newToken;
  client = createOpenSunsamaClient({
    baseUrl,
    token: newToken,
    customFetch,
  });
  api = createApi({ baseUrl, token: newToken, customFetch });
}

/**
 * Get the current API instance.
 * Cheap — returns the cached singleton. If localStorage was mutated by a
 * non-React path (rare), we sync the token before returning.
 */
export function getApi() {
  const stored = getToken();
  if (stored !== currentToken) {
    setAuthToken(stored ?? null);
  }
  return api;
}

/**
 * Get the API client for making requests (cached singleton).
 */
export function getApiClient() {
  const stored = getToken();
  if (stored !== currentToken) {
    setAuthToken(stored ?? null);
  }
  return client;
}

/**
 * React hook to get the API instance.
 * Returns the typed API wrapper for use in React components/hooks.
 */
export function useApiClient() {
  return getApi();
}

/**
 * Clear the API client (useful for logout).
 */
export function clearApiClient(): void {
  currentToken = undefined;
  client = createOpenSunsamaClient({ baseUrl, customFetch });
  api = createApi({ baseUrl, customFetch });
}

export { api, client };
export type { OpenSunsamaClient };
