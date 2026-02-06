/**
 * WebSocket client for realtime updates
 *
 * Connects to the API's WebSocket server and broadcasts events
 * to all subscribed handlers. Uses exponential backoff for reconnection.
 */

export type WebSocketEventType =
  | "task:created"
  | "task:updated"
  | "task:deleted"
  | "task:completed"
  | "task:reordered"
  | "timer:started"
  | "timer:stopped"
  | "timeblock:created"
  | "timeblock:updated"
  | "timeblock:deleted"
  | "calendar:synced"
  | "calendar:account-disconnected"
  | "calendar:updated"
  | "user:updated"
  | "connected";

export interface WebSocketEvent<T = unknown> {
  type: WebSocketEventType;
  payload: T;
  timestamp: string;
}

export interface TaskEvent {
  taskId: string;
  scheduledDate?: string | null;
}

export interface TaskReorderedEvent {
  date: string;
  taskIds: string[];
}

export interface TimeBlockEvent {
  timeBlockId: string;
  date: string;
}

export interface UserEvent {
  fields: string[];
  preferences?: {
    themeMode?: string;
    colorTheme?: string;
    fontFamily?: string;
  } | null;
}

export interface TimerStartedEvent {
  taskId: string;
  startedAt: string;
  accumulatedSeconds: number;
}

export interface TimerStoppedEvent {
  taskId: string;
  actualMins: number;
}

export interface ConnectedEvent {
  userId: string;
}

type EventHandler = (event: WebSocketEvent) => void;

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3001";

class WebSocketClient {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private handlers = new Set<EventHandler>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isIntentionallyClosed = false;

  /**
   * Connect to the WebSocket server with the provided JWT token
   */
  connect(token: string): void {
    // Don't reconnect if we're already connected with the same token
    if (this.ws && this.token === token && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    // Disconnect existing connection if any
    if (this.ws) {
      this.disconnect();
    }

    this.token = token;
    this.isIntentionallyClosed = false;
    this.doConnect();
  }

  private doConnect(): void {
    if (!this.token) return;

    const url = `${WS_URL}/ws?token=${encodeURIComponent(this.token)}`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log("[WS] Connected");
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketEvent;
          this.handlers.forEach((handler) => handler(data));
        } catch (error) {
          console.error("[WS] Failed to parse message:", error);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`[WS] Disconnected: ${event.code} ${event.reason}`);

        // Don't reconnect if intentionally closed or if auth failed (4001)
        if (!this.isIntentionallyClosed && event.code !== 4001) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error("[WS] Error:", error);
      };
    } catch (error) {
      console.error("[WS] Failed to connect:", error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("[WS] Max reconnect attempts reached");
      return;
    }

    if (this.reconnectTimer) return;

    // Exponential backoff: 1s, 2s, 4s, 8s... max 30s
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      30000
    );

    console.log(
      `[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttempts++;
      this.doConnect();
    }, delay);
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.isIntentionallyClosed = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, "User disconnected");
      this.ws = null;
    }

    this.token = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Subscribe to WebSocket events
   * @param handler - Function to call when an event is received
   * @returns Unsubscribe function
   */
  subscribe(handler: EventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /**
   * Check if the WebSocket is currently connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const wsClient = new WebSocketClient();

/**
 * Simple event emitter for preferences updates from WebSocket
 * This allows the ThemeProvider to sync preferences in realtime
 */
type PreferencesHandler = (preferences: NonNullable<UserEvent['preferences']>) => void;
const preferencesHandlers = new Set<PreferencesHandler>();

export function subscribeToPreferencesUpdates(handler: PreferencesHandler): () => void {
  preferencesHandlers.add(handler);
  return () => preferencesHandlers.delete(handler);
}

export function emitPreferencesUpdate(preferences: NonNullable<UserEvent['preferences']>): void {
  preferencesHandlers.forEach(handler => handler(preferences));
}
