import { createApi, createOpenSunsamaClient, type OpenSunsamaClient } from '@open-sunsama/api-client';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// API URL from environment or default to production
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api-production-3cc5.up.railway.app';

const AUTH_TOKEN_KEY = 'open_sunsama_token';

/**
 * Get stored auth token from SecureStore
 */
export async function getToken(): Promise<string | undefined> {
  try {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    return token || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Store auth token in SecureStore
 */
export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

/**
 * Remove auth token from SecureStore
 */
export async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}

// Current token (cached for synchronous access)
let currentToken: string | undefined;

/**
 * Set the current token for API requests
 */
export function setAuthToken(token: string | null): void {
  currentToken = token || undefined;
}

/**
 * Clear the current token
 */
export function clearAuthToken(): void {
  currentToken = undefined;
}

/**
 * Get the API client configured with current token
 */
export function getApi() {
  return createApi({
    baseUrl: API_URL,
    token: currentToken,
  });
}

/**
 * Get the low-level API client
 */
export function getApiClient(): OpenSunsamaClient {
  return createOpenSunsamaClient({
    baseUrl: API_URL,
    token: currentToken,
  });
}

/**
 * Initialize the API with a stored token
 * Call this on app startup
 */
export async function initializeApi(): Promise<void> {
  const token = await getToken();
  if (token) {
    currentToken = token;
  }
}

export { API_URL };
