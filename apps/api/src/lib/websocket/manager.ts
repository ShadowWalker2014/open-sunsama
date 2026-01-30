/**
 * WebSocket connection manager
 * Tracks all active connections and handles broadcasting to users
 */

import type { WebSocket } from 'ws';
import type { WebSocketEvent } from './events.js';

interface Connection {
  ws: WebSocket;
  userId: string;
  connectedAt: Date;
}

/**
 * Manages WebSocket connections and provides broadcasting capabilities
 */
class WebSocketManager {
  /** Map of WebSocket instance to connection info */
  private connections = new Map<WebSocket, Connection>();

  /** Map of userId to their WebSocket connections (supports multiple tabs) */
  private userConnections = new Map<string, Set<WebSocket>>();

  /**
   * Register a new WebSocket connection
   * @param ws - The WebSocket instance
   * @param userId - The authenticated user's ID
   */
  addConnection(ws: WebSocket, userId: string): void {
    const connection: Connection = {
      ws,
      userId,
      connectedAt: new Date(),
    };

    this.connections.set(ws, connection);

    // Track by userId for broadcasting
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(ws);

    console.log(
      `[WS] User ${userId} connected. Total connections: ${this.connections.size}`
    );
  }

  /**
   * Remove a WebSocket connection
   * @param ws - The WebSocket instance to remove
   */
  removeConnection(ws: WebSocket): void {
    const connection = this.connections.get(ws);
    if (!connection) return;

    this.connections.delete(ws);

    // Remove from user tracking
    const userSockets = this.userConnections.get(connection.userId);
    if (userSockets) {
      userSockets.delete(ws);
      if (userSockets.size === 0) {
        this.userConnections.delete(connection.userId);
      }
    }

    console.log(
      `[WS] User ${connection.userId} disconnected. Total connections: ${this.connections.size}`
    );
  }

  /**
   * Broadcast an event to all connections for a specific user
   * Used when receiving messages from Redis pub/sub
   *
   * @param userId - The user ID to broadcast to
   * @param event - The event to send
   */
  broadcastToUser(userId: string, event: WebSocketEvent): void {
    const sockets = this.userConnections.get(userId);
    if (!sockets || sockets.size === 0) return;

    const message = JSON.stringify(event);
    let sentCount = 0;

    for (const ws of sockets) {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
        sentCount++;
      }
    }

    if (sentCount > 0) {
      console.log(
        `[WS] Broadcast ${event.type} to user ${userId} (${sentCount} connections)`
      );
    }
  }

  /**
   * Get the total number of active connections
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Get the number of connections for a specific user
   * @param userId - The user ID to check
   */
  getUserConnectionCount(userId: string): number {
    return this.userConnections.get(userId)?.size ?? 0;
  }

  /**
   * Get the number of unique connected users
   */
  getUniqueUserCount(): number {
    return this.userConnections.size;
  }
}

/** Singleton instance of the WebSocket manager */
export const wsManager = new WebSocketManager();
