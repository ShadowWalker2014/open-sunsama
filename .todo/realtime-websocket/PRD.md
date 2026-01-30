# Realtime WebSocket

## Problem

When users have multiple browser tabs open, or when AI agents modify tasks via the API, changes don't reflect in real-time across clients. Users must manually refresh to see updates made elsewhere, leading to stale data and potential conflicts.

## Solution

Implement a WebSocket-based realtime notification system that broadcasts data changes to all connected clients for a given user. The system uses Redis pub/sub for horizontal scaling across multiple API instances.

## Technical Implementation

### Architecture Overview

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Web App    │     │   Web App    │     │  AI Agent    │
│   (Tab 1)    │     │   (Tab 2)    │     │  (API Key)   │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │ WS                 │ WS                 │ REST
       ▼                    ▼                    ▼
┌──────────────────────────────────────────────────────────┐
│                    API Server (Hono)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  WS Server  │  │  WS Server  │  │  Route Handlers │  │
│  │  (ws pkg)   │  │  (ws pkg)   │  │  (emit events)  │  │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │
│         │                │                   │           │
│         └────────┬───────┴───────────────────┘           │
│                  ▼                                       │
│           ┌─────────────┐                               │
│           │    Redis    │                               │
│           │   Pub/Sub   │                               │
│           └─────────────┘                               │
└──────────────────────────────────────────────────────────┘
```

### File Structure

```
apps/api/src/
├── lib/
│   ├── redis.ts              # Redis client + pub/sub
│   └── websocket/
│       ├── index.ts          # WebSocket server setup
│       ├── manager.ts        # Connection manager
│       ├── events.ts         # Event types + publisher
│       └── auth.ts           # WebSocket JWT auth
├── index.ts                  # Modified to attach WS server

apps/web/src/
├── lib/
│   └── websocket/
│       ├── index.ts          # WebSocket client
│       ├── events.ts         # Event types (shared)
│       └── reconnect.ts      # Reconnection logic
├── hooks/
│   └── useWebSocket.ts       # WebSocket hook + query invalidation
```

---

## API Implementation

### 1. Redis Client (`apps/api/src/lib/redis.ts`)

```typescript
import Redis from 'ioredis';

let redisClient: Redis | null = null;
let redisSub: Redis | null = null;
let redisPub: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error('REDIS_URL not configured');
    redisClient = new Redis(url);
  }
  return redisClient;
}

export function getRedisSubscriber(): Redis {
  if (!redisSub) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error('REDIS_URL not configured');
    redisSub = new Redis(url);
  }
  return redisSub;
}

export function getRedisPublisher(): Redis {
  if (!redisPub) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error('REDIS_URL not configured');
    redisPub = new Redis(url);
  }
  return redisPub;
}

export async function closeRedisConnections(): Promise<void> {
  await Promise.all([
    redisClient?.quit(),
    redisSub?.quit(),
    redisPub?.quit(),
  ]);
  redisClient = null;
  redisSub = null;
  redisPub = null;
}
```

### 2. Event Types (`apps/api/src/lib/websocket/events.ts`)

```typescript
export type WebSocketEventType =
  // Task events
  | 'task:created'
  | 'task:updated'
  | 'task:deleted'
  | 'task:completed'
  | 'task:reordered'
  // Time block events
  | 'timeblock:created'
  | 'timeblock:updated'
  | 'timeblock:deleted'
  // User events
  | 'user:updated';

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
  date: string; // 'backlog' or 'YYYY-MM-DD'
  taskIds: string[];
}

export interface TimeBlockEvent {
  timeBlockId: string;
  date: string;
}

export interface UserEvent {
  fields: string[]; // Which fields changed: ['name', 'timezone', 'avatarUrl']
}

// Redis channel name for a user
export function getUserChannel(userId: string): string {
  return `user:${userId}:events`;
}
```

### 3. WebSocket Auth (`apps/api/src/lib/websocket/auth.ts`)

```typescript
import { verifyToken } from '../jwt.js';

export interface AuthResult {
  success: boolean;
  userId?: string;
  error?: string;
}

/**
 * Authenticate WebSocket connection using JWT from query string
 * URL format: ws://host/ws?token=<jwt>
 */
export function authenticateWebSocket(url: string): AuthResult {
  try {
    const urlObj = new URL(url, 'http://localhost');
    const token = urlObj.searchParams.get('token');

    if (!token) {
      return { success: false, error: 'Token required' };
    }

    const { userId } = verifyToken(token);
    return { success: true, userId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid token',
    };
  }
}
```

### 4. Connection Manager (`apps/api/src/lib/websocket/manager.ts`)

```typescript
import type { WebSocket } from 'ws';
import type { WebSocketEvent } from './events.js';

interface Connection {
  ws: WebSocket;
  userId: string;
  connectedAt: Date;
}

class WebSocketManager {
  private connections = new Map<WebSocket, Connection>();
  private userConnections = new Map<string, Set<WebSocket>>();

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

    console.log(`[WS] User ${userId} connected. Total: ${this.connections.size}`);
  }

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

    console.log(`[WS] User ${connection.userId} disconnected. Total: ${this.connections.size}`);
  }

  /**
   * Broadcast event to all connections for a specific user
   */
  broadcastToUser(userId: string, event: WebSocketEvent): void {
    const sockets = this.userConnections.get(userId);
    if (!sockets || sockets.size === 0) return;

    const message = JSON.stringify(event);

    for (const ws of sockets) {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    }
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  getUserConnectionCount(userId: string): number {
    return this.userConnections.get(userId)?.size ?? 0;
  }
}

export const wsManager = new WebSocketManager();
```

### 5. WebSocket Server (`apps/api/src/lib/websocket/index.ts`)

```typescript
import { WebSocketServer, type WebSocket } from 'ws';
import type { Server } from 'http';
import { wsManager } from './manager.js';
import { authenticateWebSocket } from './auth.js';
import { getUserChannel, type WebSocketEvent } from './events.js';
import { getRedisSubscriber, getRedisPublisher } from '../redis.js';

let wss: WebSocketServer | null = null;

/**
 * Initialize WebSocket server attached to HTTP server
 */
export function initWebSocket(server: Server): WebSocketServer {
  wss = new WebSocketServer({
    server,
    path: '/ws',
  });

  wss.on('connection', (ws: WebSocket, req) => {
    // Authenticate connection
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
      // Connection is alive
    });

    ws.on('close', () => {
      wsManager.removeConnection(ws);
      // Note: Redis subscription persists (shared across connections)
    });

    ws.on('error', (error) => {
      console.error(`[WS] Error for user ${userId}:`, error);
      wsManager.removeConnection(ws);
    });

    // Send connection confirmation
    ws.send(JSON.stringify({
      type: 'connected',
      payload: { userId },
      timestamp: new Date().toISOString(),
    }));
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

// Track which user channels we've subscribed to
const subscribedChannels = new Set<string>();

/**
 * Subscribe to a user's Redis channel
 */
function subscribeToUserChannel(userId: string): void {
  const channel = getUserChannel(userId);

  if (subscribedChannels.has(channel)) return;

  const subscriber = getRedisSubscriber();
  subscriber.subscribe(channel);
  subscribedChannels.add(channel);

  console.log(`[WS] Subscribed to Redis channel: ${channel}`);
}

/**
 * Initialize Redis subscriber message handler
 * Call once during server startup
 */
export function initRedisSubscriber(): void {
  const subscriber = getRedisSubscriber();

  subscriber.on('message', (channel: string, message: string) => {
    // Extract userId from channel name (user:{userId}:events)
    const match = channel.match(/^user:([^:]+):events$/);
    if (!match) return;

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
 * Publish event to a user's channel (called from route handlers)
 */
export async function publishEvent(
  userId: string,
  type: WebSocketEvent['type'],
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

export function getWebSocketServer(): WebSocketServer | null {
  return wss;
}
```

### 6. Modified API Entry Point (`apps/api/src/index.ts`)

Add WebSocket initialization to the server startup:

```typescript
// ... existing imports ...
import { createServer } from 'http';
import { initWebSocket, initRedisSubscriber } from './lib/websocket/index.js';
import { closeRedisConnections } from './lib/redis.js';

// ... existing app setup ...

async function startServer(): Promise<void> {
  // ... existing worker initialization ...

  // Create HTTP server from Hono app
  const server = createServer(async (req, res) => {
    const response = await app.fetch(
      new Request(`http://${req.headers.host}${req.url}`, {
        method: req.method,
        headers: req.headers as HeadersInit,
        body: req.method !== 'GET' && req.method !== 'HEAD' ? req : undefined,
        // @ts-expect-error duplex is required for streaming
        duplex: 'half',
      })
    );

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    if (response.body) {
      const reader = response.body.getReader();
      const pump = async () => {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          return;
        }
        res.write(value);
        await pump();
      };
      await pump();
    } else {
      res.end();
    }
  });

  // Initialize Redis subscriber for WebSocket events
  if (process.env.REDIS_URL) {
    initRedisSubscriber();
    initWebSocket(server);
  } else {
    console.log('[WS] REDIS_URL not set, WebSocket disabled');
  }

  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

// Update graceful shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`\n[Server] Received ${signal}, shutting down gracefully...`);

  try {
    await stopPgBoss();
    await closeRedisConnections();
    console.log('[Server] Cleanup complete');
  } catch (error) {
    console.error('[Server] Error during shutdown:', error);
  }

  process.exit(0);
}
```

### 7. Event Publishing in Routes

Modify route handlers to publish events after successful operations.

**Example: tasks.ts**

```typescript
import { publishEvent } from '../lib/websocket/index.js';

// In POST /tasks handler, after creating task:
tasksRouter.post('/', requireScopes('tasks:write'), zValidator('json', createTaskSchema), async (c) => {
  // ... existing task creation logic ...
  const [newTask] = await db.insert(tasks).values({ ... }).returning();

  // Publish realtime event
  if (process.env.REDIS_URL) {
    await publishEvent(userId, 'task:created', {
      taskId: newTask.id,
      scheduledDate: newTask.scheduledDate,
    });
  }

  return c.json({ success: true, data: newTask }, 201);
});

// In PATCH /tasks/:id handler:
tasksRouter.patch('/:id', ..., async (c) => {
  // ... existing update logic ...
  const [updatedTask] = await db.update(tasks).set(updateData).where(...).returning();

  // Check if task was completed
  const eventType = updates.completedAt ? 'task:completed' : 'task:updated';

  if (process.env.REDIS_URL) {
    await publishEvent(userId, eventType, {
      taskId: updatedTask.id,
      scheduledDate: updatedTask.scheduledDate,
    });
  }

  return c.json({ success: true, data: updatedTask });
});

// In DELETE /tasks/:id handler:
tasksRouter.delete('/:id', ..., async (c) => {
  // ... existing delete logic ...

  if (process.env.REDIS_URL) {
    await publishEvent(userId, 'task:deleted', {
      taskId: id,
      scheduledDate: existing.scheduledDate,
    });
  }

  return c.json({ success: true, message: 'Task deleted successfully' });
});

// In POST /tasks/reorder handler:
tasksRouter.post('/reorder', ..., async (c) => {
  // ... existing reorder logic ...

  if (process.env.REDIS_URL) {
    await publishEvent(userId, 'task:reordered', {
      date,
      taskIds,
    });
  }

  return c.json({ success: true, data: updatedTasks });
});
```

Apply the same pattern to `time-blocks.ts` and `auth.ts` (for user profile updates).

---

## Web Implementation

### 1. WebSocket Client (`apps/web/src/lib/websocket/index.ts`)

```typescript
export type WebSocketEventType =
  | 'task:created'
  | 'task:updated'
  | 'task:deleted'
  | 'task:completed'
  | 'task:reordered'
  | 'timeblock:created'
  | 'timeblock:updated'
  | 'timeblock:deleted'
  | 'user:updated'
  | 'connected';

export interface WebSocketEvent<T = unknown> {
  type: WebSocketEventType;
  payload: T;
  timestamp: string;
}

type EventHandler = (event: WebSocketEvent) => void;

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

class WebSocketClient {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private handlers = new Set<EventHandler>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isIntentionallyClosed = false;

  connect(token: string): void {
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
        console.log('[WS] Connected');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketEvent;
          this.handlers.forEach((handler) => handler(data));
        } catch (error) {
          console.error('[WS] Failed to parse message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`[WS] Disconnected: ${event.code} ${event.reason}`);

        if (!this.isIntentionallyClosed && event.code !== 4001) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WS] Error:', error);
      };
    } catch (error) {
      console.error('[WS] Failed to connect:', error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WS] Max reconnect attempts reached');
      return;
    }

    if (this.reconnectTimer) return;

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      30000
    );

    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttempts++;
      this.doConnect();
    }, delay);
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
    }

    this.token = null;
    this.reconnectAttempts = 0;
  }

  subscribe(handler: EventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsClient = new WebSocketClient();
```

### 2. WebSocket Hook (`apps/web/src/hooks/useWebSocket.ts`)

```typescript
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { wsClient, type WebSocketEvent } from '@/lib/websocket';
import { useAuth } from '@/hooks/useAuth';
import { taskKeys } from '@/hooks/useTasks';
import { timeBlockKeys } from '@/hooks/useTimeBlocks';

/**
 * Hook that manages WebSocket connection and query invalidation
 * Automatically connects when authenticated, disconnects on logout
 */
export function useWebSocket(): void {
  const { token, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (connectedRef.current) {
        wsClient.disconnect();
        connectedRef.current = false;
      }
      return;
    }

    // Connect WebSocket
    wsClient.connect(token);
    connectedRef.current = true;

    // Subscribe to events and invalidate queries
    const unsubscribe = wsClient.subscribe((event: WebSocketEvent) => {
      handleWebSocketEvent(event, queryClient);
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, token, queryClient]);
}

function handleWebSocketEvent(
  event: WebSocketEvent,
  queryClient: ReturnType<typeof useQueryClient>
): void {
  console.log('[WS] Event received:', event.type, event.payload);

  switch (event.type) {
    // Task events
    case 'task:created':
    case 'task:updated':
    case 'task:deleted':
    case 'task:completed':
    case 'task:reordered':
      // Invalidate all task lists to refetch
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });

      // For individual task changes, also invalidate the specific task
      if ('taskId' in (event.payload as object)) {
        const { taskId } = event.payload as { taskId: string };
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      }
      break;

    // Time block events
    case 'timeblock:created':
    case 'timeblock:updated':
    case 'timeblock:deleted':
      // Invalidate all time block lists
      queryClient.invalidateQueries({ queryKey: timeBlockKeys.lists() });

      if ('timeBlockId' in (event.payload as object)) {
        const { timeBlockId } = event.payload as { timeBlockId: string };
        queryClient.invalidateQueries({ queryKey: timeBlockKeys.detail(timeBlockId) });
      }
      break;

    // User events
    case 'user:updated':
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      break;

    case 'connected':
      console.log('[WS] Connection confirmed');
      break;
  }
}
```

### 3. Integrate in App Root (`apps/web/src/routes/__root.tsx`)

```typescript
import { useWebSocket } from '@/hooks/useWebSocket';

function RootComponent() {
  // Initialize WebSocket connection
  useWebSocket();

  return (
    // ... existing root component JSX
  );
}
```

---

## Dependencies

**API (`apps/api/package.json`):**

```json
{
  "dependencies": {
    "ws": "^8.18.0",
    "ioredis": "^5.4.1"
  },
  "devDependencies": {
    "@types/ws": "^8.5.13"
  }
}
```

**Web (`apps/web/package.json`):**
No additional dependencies - uses native WebSocket API.

---

## Environment Variables

```env
# apps/api/.env
REDIS_URL=redis://localhost:6379

# apps/web/.env
VITE_WS_URL=ws://localhost:3001
```

For production with TLS:
```env
VITE_WS_URL=wss://api.yourdomain.com
```

---

## Flow Diagrams

### Task Created Flow

```
1. User creates task in Tab A
   │
2. POST /tasks → API creates task
   │
3. API publishes to Redis: user:{userId}:events
   │
4. Redis broadcasts to all API instances
   │
5. Each instance's subscriber receives message
   │
6. wsManager.broadcastToUser(userId, event)
   │
7. Tab B receives 'task:created' event
   │
8. useWebSocket invalidates taskKeys.lists()
   │
9. TanStack Query refetches, Tab B shows new task
```

### Connection Authentication Flow

```
1. User logs in, receives JWT
   │
2. useWebSocket calls wsClient.connect(token)
   │
3. Client opens: ws://api/ws?token=<jwt>
   │
4. Server authenticates via verifyToken()
   │
5. On success: wsManager.addConnection(ws, userId)
   │
6. Server subscribes to Redis channel: user:{userId}:events
   │
7. Server sends: { type: 'connected', payload: { userId } }
   │
8. Client ready to receive events
```

---

## Edge Cases

- **Expired JWT during connection**: Server closes with code 4001, client does not reconnect
- **Network disconnect**: Exponential backoff reconnection (1s → 2s → 4s → 8s, max 30s)
- **Multiple tabs**: Each tab has its own WebSocket, all receive the same events
- **API scaling**: Redis pub/sub ensures all instances receive events
- **Redis unavailable**: API continues working, WebSocket features disabled
- **No REDIS_URL**: WebSocket initialization skipped, no errors
- **User logout**: `wsClient.disconnect()` called, no reconnection attempted
- **Server restart**: Client auto-reconnects when server becomes available

---

## Testing

### Manual Testing

1. Open two browser tabs, log in with same user
2. Create a task in Tab A
3. Verify Tab B shows the task without refresh
4. Repeat for: update, delete, complete, reorder
5. Test time blocks: create, update, delete
6. Test disconnection: stop API, verify reconnection

### Redis CLI Testing

```bash
# Subscribe to user events
redis-cli SUBSCRIBE user:USER_ID_HERE:events

# In another terminal, create a task via API
curl -X POST http://localhost:3001/tasks \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test task"}'

# Should see event in Redis subscriber
```

---

## Performance Considerations

- **Connection limit**: Node.js can handle ~10k concurrent WebSocket connections per instance
- **Redis pub/sub**: Near-instant message delivery, minimal overhead
- **Message size**: Events are small JSON (~100-200 bytes)
- **Query invalidation**: Only invalidates relevant query keys, not full cache
- **Heartbeat**: 30s ping/pong interval to detect dead connections
