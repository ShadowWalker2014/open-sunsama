# Focus Timer WebSocket Sync

## Overview

Move the focus timer from a purely client-side `localStorage` model to a server-authoritative model. The server owns timer state (running/stopped, accumulated time), persists it in the `tasks` table, and broadcasts changes over WebSocket so every connected client stays in sync.

## Problem

- Timer state lives only in `localStorage` — opening a second browser tab or device shows a stale timer.
- If the browser crashes while the timer is running, the accumulated time is lost.
- `actualMins` is only saved when the user manually stops the timer via `PATCH /tasks/:id`; there is no server-side record that a timer is currently running.
- Completing a task from outside focus mode (`useCompleteTask`) reads `localStorage` to stop the timer, which only works in the same browser.

## Solution

Add two columns to the `tasks` table (`timer_started_at`, `timer_accumulated_seconds`) that represent the canonical timer state. Expose three new API endpoints for start/stop/query. Broadcast `timer:started` and `timer:stopped` events over the existing WebSocket infrastructure. Refactor `useTimer` to treat the server as source of truth while keeping client-side ticking for a responsive UI.

---

## Database Changes

**Table:** `tasks` (in `packages/database/src/schema/tasks.ts`)

| Column | Type | Default | Description |
|---|---|---|---|
| `timer_started_at` | `timestamp` (nullable) | `null` | Set to `now()` when timer starts; cleared on stop |
| `timer_accumulated_seconds` | `integer` | `0` | Total seconds accumulated across all start/stop cycles for the current work session |

**Index:** Add a partial index for quickly finding the active timer per user:

```sql
CREATE INDEX tasks_active_timer_idx ON tasks (user_id)
  WHERE timer_started_at IS NOT NULL;
```

**Migration notes:**
- Both columns are nullable/defaulted, so the migration is backward-compatible and requires no data backfill.
- The `timer_accumulated_seconds` column resets to `0` each time `actualMins` is synced on stop (accumulated is a working buffer, `actualMins` is the permanent record).

**Schema diff** (`packages/database/src/schema/tasks.ts`):

```typescript
// Add to the tasks table definition:
timerStartedAt: timestamp("timer_started_at"),
timerAccumulatedSeconds: integer("timer_accumulated_seconds").notNull().default(0),
```

**Zod schemas** — these fields are NOT added to `updateTaskSchema` (timer state is only mutated through dedicated endpoints).

---

## API Changes

All three endpoints go in `apps/api/src/routes/tasks.ts` and require `tasks:write` scope (start/stop) or `tasks:read` scope (active query).

### 1. `POST /tasks/:id/timer/start`

**Auth:** JWT or API Key with `tasks:write`

**Behavior:**
1. Verify the task belongs to the authenticated user.
2. Check if any other task for this user has `timer_started_at IS NOT NULL`. If so, auto-stop it first (calculate elapsed, add to its `timer_accumulated_seconds`, compute `actualMins`, clear its timer fields, broadcast `timer:stopped` for that task).
3. Set `timer_started_at = now()` on the target task. Leave `timer_accumulated_seconds` at its current value (may be >0 if resuming).
4. Broadcast `timer:started` event.
5. Return the updated task.

**Response:**
```json
{
  "success": true,
  "data": { /* full task object */ },
  "stoppedTask": { /* task that was auto-stopped, or null */ }
}
```

### 2. `POST /tasks/:id/timer/stop`

**Auth:** JWT or API Key with `tasks:write`

**Behavior:**
1. Verify task belongs to user and has `timer_started_at IS NOT NULL`. If timer is not running, return 400.
2. Compute `elapsed = now() - timer_started_at` (in seconds).
3. `totalSeconds = timer_accumulated_seconds + elapsed`
4. `actualMins = Math.ceil(totalSeconds / 60)` — accumulates on top of existing `actualMins` if the task already had manual time entries (design decision: replace, don't add — the timer tracks total actual time for this task).
5. Set `actualMins = Math.ceil(totalSeconds / 60)`, `timer_started_at = null`, `timer_accumulated_seconds = 0`.
6. Broadcast `timer:stopped` event.
7. Return the updated task.

**Response:**
```json
{
  "success": true,
  "data": { /* full task object with updated actualMins */ }
}
```

### 3. `GET /tasks/timer/active`

**Auth:** JWT or API Key with `tasks:read`

**Behavior:**
1. Find the task for this user where `timer_started_at IS NOT NULL`.
2. Return the task, or `null` if no active timer.

**Response:**
```json
{
  "success": true,
  "data": { /* task with active timer, or null */ }
}
```

**Note:** Because `/tasks/timer/active` is a parameterless sub-route of `/tasks`, it must be registered **before** the `/tasks/:id` route in Hono to avoid `timer` being parsed as a task ID.

### 4. Modify `POST /tasks/:id/complete`

**Behavior change:** Before marking the task complete, check if `timer_started_at IS NOT NULL`. If so, auto-stop the timer (same logic as the stop endpoint) and save `actualMins`. Then proceed with completion as normal. Broadcast both `timer:stopped` and `task:completed`.

### Validation

Add a validation file or extend `apps/api/src/validation/tasks.ts`:

```typescript
// No body needed for timer start/stop — just the :id param
// Reuse existing: z.object({ id: uuidSchema })
```

---

## WebSocket Events

**File:** `apps/api/src/lib/websocket/events.ts`

Add two new event types:

```typescript
export type WebSocketEventType =
  // ... existing types ...
  | "timer:started"
  | "timer:stopped";
```

Add event payload interfaces:

```typescript
export interface TimerStartedEvent {
  taskId: string;
  startedAt: string;           // ISO 8601 timestamp
  accumulatedSeconds: number;  // seconds already accumulated before this start
}

export interface TimerStoppedEvent {
  taskId: string;
  actualMins: number;          // final actualMins saved on the task
}
```

**Client-side mirror:** Update `apps/web/src/lib/websocket/index.ts` with the same two event types and interfaces.

---

## Client Changes

### 1. API Client (`packages/api-client/src/tasks.ts`)

Add three new methods to `TasksApi`:

```typescript
timerStart(id: string, options?: RequestOptions): Promise<{ task: Task; stoppedTask: Task | null }>;
timerStop(id: string, options?: RequestOptions): Promise<Task>;
timerActive(options?: RequestOptions): Promise<Task | null>;
```

Implement in `createTasksApi()`:

```typescript
async timerStart(id, options) {
  const res = await client.post<...>(`tasks/${id}/timer/start`, undefined, options);
  return { task: res.data, stoppedTask: res.stoppedTask ?? null };
},
async timerStop(id, options) {
  const res = await client.post<...>(`tasks/${id}/timer/stop`, undefined, options);
  return res.data;
},
async timerActive(options) {
  const res = await client.get<...>(`tasks/timer/active`, options);
  return res.data;
},
```

### 2. Types (`packages/types/src/task.ts`)

Add to `Task` interface:

```typescript
/** Timestamp when the focus timer was started. null = timer not running. */
timerStartedAt: Date | null;

/** Accumulated seconds from previous start/stop cycles in the current session. */
timerAccumulatedSeconds: number;
```

### 3. Timer Hook (`apps/web/src/hooks/useTimer.ts`)

**Major refactor.** The hook becomes a thin client over the server state:

```
                  ┌─────────────────────┐
                  │   Server (DB)       │
                  │ timer_started_at    │
                  │ accumulated_seconds │
                  └──────┬──────────────┘
                         │ API + WS
          ┌──────────────┼──────────────┐
          │              │              │
    ┌─────▼─────┐  ┌────▼─────┐  ┌────▼─────┐
    │ Tab A     │  │ Tab B    │  │ Mobile   │
    │ useTimer  │  │ useTimer │  │ useTimer │
    │ (tick)    │  │ (tick)   │  │ (tick)   │
    └───────────┘  └──────────┘  └──────────┘
```

**New `useTimer` signature** (options stay the same, but internals change):

```typescript
interface UseTimerOptions {
  taskId: string;
  initialSeconds?: number;   // from task.actualMins * 60
  onStop?: (totalSeconds: number) => void;
}
```

**Initialization:**
1. On mount, call `GET /tasks/timer/active`.
2. If the active timer's `taskId` matches the hook's `taskId`, hydrate local state from the response (`startedAt`, `accumulatedSeconds`).
3. If no active timer and `localStorage` has state for this task, use that as a fallback (offline scenario).

**Start:**
1. Optimistically set local `isRunning = true`, `startedAt = Date.now()`.
2. Call `POST /tasks/:id/timer/start`.
3. On success, update local `startedAt` from server response (authoritative timestamp).
4. On failure, roll back local state.

**Stop:**
1. Optimistically set local `isRunning = false`, calculate `totalSeconds`.
2. Call `POST /tasks/:id/timer/stop`.
3. On success, call `onStop(totalSeconds)` and update `accumulatedSeconds = 0`.
4. On failure, roll back local state.

**Tick:**
- Still uses `setInterval(1000)` client-side.
- Elapsed = `Math.floor((Date.now() - startedAt) / 1000)`.
- Display = `accumulatedSeconds + elapsed`.

**WebSocket integration** (new):
- Listen for `timer:started` and `timer:stopped` events.
- On `timer:started` where `taskId` matches: update local state to running with the server's `startedAt` and `accumulatedSeconds`.
- On `timer:stopped` where `taskId` matches: update local state to stopped.
- On `timer:stopped` for a **different** task (auto-stop): if that task's timer hook is mounted, stop its local state.

**localStorage:**
- Continue writing state to `localStorage` on each state change (offline fallback).
- On mount, prefer server state over `localStorage`.
- On reconnect (WebSocket `connected` event), re-fetch active timer to reconcile.

**Exported utilities:**
- Keep `getRunningTimerSeconds()` and `stopAndClearTimer()` but mark them as **deprecated** — they read from `localStorage` and are only used as a fallback when the server is unreachable.

### 4. WebSocket Handler (`apps/web/src/hooks/useWebSocket.ts`)

Add cases for the new events:

```typescript
case "timer:started":
case "timer:stopped":
  // Invalidate the specific task (to refresh actualMins, timerStartedAt, etc.)
  if (event.payload && typeof event.payload === "object" && "taskId" in event.payload) {
    const { taskId } = event.payload as { taskId: string };
    queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
  }
  // Also invalidate the active timer query
  queryClient.invalidateQueries({ queryKey: ["tasks", "timer", "active"] });
  break;
```

### 5. Focus Timer Component (`apps/web/src/components/focus/focus-timer.tsx`)

Minimal changes — the component already delegates to `useTimer`. The hook's interface stays the same, so the component doesn't need to change. The only difference is that `start()` and `stop()` are now async (fire API calls), but since the hook handles optimistic updates internally, the component can remain synchronous from its perspective.

### 6. `useCompleteTask` (`apps/web/src/hooks/useTasks.ts`)

Remove the `stopAndClearTimer(id)` call. The server's `POST /tasks/:id/complete` now handles stopping the timer. The client just calls `api.tasks.complete(id)` and the server returns the task with updated `actualMins`.

```typescript
// Before:
const totalSeconds = stopAndClearTimer(id);
if (totalSeconds !== null) {
  const actualMins = Math.ceil(totalSeconds / 60);
  await api.tasks.update(id, { actualMins });
}
return await api.tasks.complete(id);

// After:
return await api.tasks.complete(id);
// Server auto-stops timer and saves actualMins
```

### 7. New Query Key

Add to `useTasks.ts` or a new `useActiveTimer.ts`:

```typescript
export const timerKeys = {
  active: () => ["tasks", "timer", "active"] as const,
};
```

---

## Edge Cases

1. **Stale `startedAt` after server restart:** Timer keeps running in the DB. On next client load or API call, the server computes elapsed from the persisted `timer_started_at`. No time is lost.

2. **Two clients start timer simultaneously:** The server processes requests sequentially per-user (DB write lock on the task row). The second request either succeeds (if it's the same task) or auto-stops the first (if it's a different task). Both clients receive the WebSocket event and converge.

3. **Client offline, timer running:** Client continues ticking from the last known `startedAt`. When connectivity returns, the client calls stop which computes elapsed server-side from the DB's `timer_started_at`. The server's elapsed will match the client's since both use the same `startedAt` timestamp.

4. **Clock skew between client and server:** The `startedAt` timestamp comes from the server (`now()` in PostgreSQL). The client uses this server timestamp as the base for ticking. Minor clock differences (< 1s) are acceptable for a minutes-granularity timer.

5. **Timer running when task is deleted:** The `DELETE /tasks/:id` endpoint already cascades. No special handling needed — the timer state is deleted with the task.

6. **Manual `actualMins` edit while timer is running:** The `PATCH /tasks/:id` endpoint allows setting `actualMins` but does NOT touch `timer_started_at` or `timer_accumulated_seconds`. This means manual edits and the timer are independent. On stop, the timer's computed `actualMins` will **replace** whatever was set manually. This is intentional — if you start a timer, it owns `actualMins`.

7. **Reconnect after long disconnect:** On WebSocket `connected` event, re-fetch `GET /tasks/timer/active`. If the server says the timer is still running, update local state with the server's `startedAt`. The display will jump to the correct elapsed time.

8. **Rate limiting:** Timer start/stop are user-initiated and infrequent (seconds apart at minimum). No rate limiting needed beyond the existing API rate limits.

---

## Implementation Order

1. **Database migration** — Add `timer_started_at` and `timer_accumulated_seconds` columns to `tasks` table. Generate and run migration.

2. **API endpoints** — Implement `POST /tasks/:id/timer/start`, `POST /tasks/:id/timer/stop`, `GET /tasks/timer/active` in `apps/api/src/routes/tasks.ts`. Update `POST /tasks/:id/complete` to auto-stop timer.

3. **WebSocket events** — Add `timer:started` and `timer:stopped` to both server (`events.ts`) and client (`websocket/index.ts`) event type definitions.

4. **API client** — Add `timerStart`, `timerStop`, `timerActive` methods to `packages/api-client/src/tasks.ts`.

5. **Types** — Add `timerStartedAt` and `timerAccumulatedSeconds` to `Task` interface in `packages/types/src/task.ts`.

6. **`useTimer` refactor** — Rewrite to use server state as source of truth, with optimistic local updates and WebSocket sync.

7. **`useWebSocket` update** — Handle `timer:started` and `timer:stopped` events for cache invalidation.

8. **`useCompleteTask` cleanup** — Remove `stopAndClearTimer` call; server handles it.

---

## Files Changed

| File | Change |
|---|---|
| `packages/database/src/schema/tasks.ts` | Add `timerStartedAt`, `timerAccumulatedSeconds` columns + index |
| `packages/types/src/task.ts` | Add timer fields to `Task` interface |
| `apps/api/src/routes/tasks.ts` | Add 3 timer endpoints, update complete endpoint |
| `apps/api/src/lib/websocket/events.ts` | Add `timer:started`, `timer:stopped` types + payload interfaces |
| `packages/api-client/src/tasks.ts` | Add `timerStart`, `timerStop`, `timerActive` methods |
| `apps/web/src/lib/websocket/index.ts` | Add `timer:started`, `timer:stopped` event types |
| `apps/web/src/hooks/useTimer.ts` | Refactor to server-authoritative with WS sync |
| `apps/web/src/hooks/useWebSocket.ts` | Handle timer events for cache invalidation |
| `apps/web/src/hooks/useTasks.ts` | Remove `stopAndClearTimer` from `useCompleteTask` |
| `apps/web/src/components/focus/focus-timer.tsx` | No changes needed (hook interface unchanged) |
