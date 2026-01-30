/**
 * WebSocket server for real-time notifications
 * Integrates with Redis pub/sub for horizontal scaling
 */

import { WebSocketServer, type WebSocket } from 'ws';
import type { Server } from 'http';
import { wsManager } from './manager.js';
import { authenticateWebSocket } from './auth.js';
import { getUserChannel, type WebSocketEvent, type WebSocketEventType } from './events.js';
import { getRedisSubscriber, getRedisPublisher } from '../redis.js';

let wss: WebSocketServer | null = null;

// Track which user channels we've subscribed to
const subscribedChannels = new Set<string>();

/**
 * Initialize the WebSocket server and attach it to the HTTP server
 * @param server - The HTTP server to attach to
 * @returns The WebSocket server instance
 */
export function initWebSocket(server: Server): WebSocketServer {
  wss = new WebSocketServer({
    server,
    path: '/ws',
  });

  wss.on('connection', (ws: WebSocket, req) => {
    // Authenticate connection using JWT from query string
    const url = req.url || '';
    const auth = authenticateWebSocket(url);

    if (!auth.success || !auth.userId) {
      ws.close(4001, auth.error || 'Unauthorized');
      return;
    }

    const userId = auth.userId;

    // Add to connection manager
    wsManager.addConnection(ws, userId);

    // Subscribe to user's Redis channel for this connection
    subscribeToUserChannel(userId);

    // Handle ping/pong for connection health
    ws.on('pong', () => {
      // Connection is alive - could track last pong time here
    });

    ws.on('close', () => {
      wsManager.removeConnection(ws);
      // Note: Redis subscription persists (shared across all connections for this user)
    });

    ws.on('error', (error) => {
      console.error(`[WS] Error for user ${userId}:`, error);
      wsManager.removeConnection(ws);
    });

    // Send connection confirmation
    ws.send(
      JSON.stringify({
        type: 'connected',
        payload: { userId },
        timestamp: new Date().toISOString(),
      })
    );
  });

  // Heartbeat interval to detect dead connections
  const heartbeatInterval = setInterval(() => {
    wss?.clients.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.ping();
      }
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  console.log('[WS] WebSocket server initialized at /ws');
  return wss;
}

/**
 * Subscribe to a user's Redis channel
 * Called when a user connects to ensure we receive their events
 *
 * @param userId - The user ID to subscribe to
 */
function subscribeToUserChannel(userId: string): void {
  const channel = getUserChannel(userId);

  // Don't subscribe twice to the same channel
  if (subscribedChannels.has(channel)) return;

  const subscriber = getRedisSubscriber();
  subscriber.subscribe(channel);
  subscribedChannels.add(channel);

  console.log(`[WS] Subscribed to Redis channel: ${channel}`);
}

/**
 * Initialize the Redis subscriber message handler
 * Call once during server startup BEFORE initializing WebSocket
 */
export function initRedisSubscriber(): void {
  const subscriber = getRedisSubscriber();

  subscriber.on('message', (channel: string, message: string) => {
    // Extract userId from channel name (user:{userId}:events)
    const match = channel.match(/^user:([^:]+):events$/);
    if (!match || !match[1]) return;

    const userId = match[1];

    try {
      const event = JSON.parse(message) as WebSocketEvent;
      wsManager.broadcastToUser(userId, event);
    } catch (error) {
      console.error('[WS] Failed to parse Redis message:', error);
    }
  });

  console.log('[WS] Redis subscriber initialized');
}

/**
 * Publish an event to a user's channel
 * Called from route handlers after data mutations
 *
 * @param userId - The user ID to publish to
 * @param type - The event type
 * @param payload - The event payload
 */
export async function publishEvent(
  userId: string,
  type: WebSocketEventType,
  payload: unknown
): Promise<void> {
  const publisher = getRedisPublisher();
  const channel = getUserChannel(userId);

  const event: WebSocketEvent = {
    type,
    payload,
    timestamp: new Date().toISOString(),
  };

  await publisher.publish(channel, JSON.stringify(event));
}

/**
 * Get the WebSocket server instance
 * Returns null if not initialized
 */
export function getWebSocketServer(): WebSocketServer | null {
  return wss;
}

// Re-export types and utilities for convenience
export type { WebSocketEvent, WebSocketEventType } from './events.js';
export type { TaskEvent, TaskReorderedEvent, TimeBlockEvent, UserEvent } from './events.js';
