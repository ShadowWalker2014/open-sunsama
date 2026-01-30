/**
 * WebSocket authentication utilities
 * Handles JWT verification for WebSocket connections
 */

import { verifyToken } from '../jwt.js';

export interface AuthResult {
  success: boolean;
  userId?: string;
  error?: string;
}

/**
 * Authenticate a WebSocket connection using JWT from query string
 * URL format: ws://host/ws?token=<jwt>
 *
 * @param url - The request URL containing the token query parameter
 * @returns Authentication result with userId on success, error on failure
 */
export function authenticateWebSocket(url: string): AuthResult {
  try {
    // Parse URL to extract query parameters
    // Use a dummy base URL since we only care about the path and query
    const urlObj = new URL(url, 'http://localhost');
    const token = urlObj.searchParams.get('token');

    if (!token) {
      return { success: false, error: 'Token required' };
    }

    // Verify the JWT token
    const { userId } = verifyToken(token);

    if (!userId) {
      return { success: false, error: 'Invalid token payload' };
    }

    return { success: true, userId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid token',
    };
  }
}
