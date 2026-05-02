import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  wsClient,
  emitPreferencesUpdate,
  type WebSocketEvent,
  type UserEvent,
} from "@/lib/websocket";
import { useAuth } from "@/hooks/useAuth";
import { taskKeys } from "@/hooks/useTasks";
import { timerKeys } from "@/hooks/useTimer";
import { timeBlockKeys } from "@/hooks/useTimeBlocks";
import { subtaskKeys } from "@/hooks/useSubtasks";
import { calendarKeys } from "@/hooks/useCalendars";

/**
 * Debounced invalidation queue.
 *
 * The server fans out a websocket event to every connected client of the
 * authenticated user — including the originating client whose mutation just
 * fired. Without coalescing, a fast typist editing a task title would trigger
 * one refetch per keystroke. We collect invalidations during a short window
 * and flush them together, so the user sees the effect of their optimistic
 * update without a flicker on every echo.
 */
class InvalidationBatcher {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private keys = new Map<string, readonly unknown[]>();
  private taskDetails = new Set<string>();
  private subtaskTasks = new Set<string>();
  private timeBlockDetails = new Set<string>();

  constructor(
    private getQueryClient: () => ReturnType<typeof useQueryClient>,
    private delayMs = 150
  ) {}

  schedule(key: readonly unknown[]) {
    this.keys.set(JSON.stringify(key), key);
    this.arm();
  }

  scheduleTaskDetail(taskId: string) {
    this.taskDetails.add(taskId);
    this.arm();
  }

  scheduleSubtasksFor(taskId: string) {
    this.subtaskTasks.add(taskId);
    this.arm();
  }

  scheduleTimeBlockDetail(timeBlockId: string) {
    this.timeBlockDetails.add(timeBlockId);
    this.arm();
  }

  private arm() {
    if (this.timer) return;
    this.timer = setTimeout(() => this.flush(), this.delayMs);
  }

  private flush() {
    this.timer = null;
    const qc = this.getQueryClient();
    for (const key of this.keys.values()) {
      qc.invalidateQueries({ queryKey: key });
    }
    this.keys.clear();
    for (const taskId of this.taskDetails) {
      qc.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    }
    this.taskDetails.clear();
    for (const taskId of this.subtaskTasks) {
      qc.invalidateQueries({ queryKey: subtaskKeys.list(taskId) });
    }
    this.subtaskTasks.clear();
    for (const id of this.timeBlockDetails) {
      qc.invalidateQueries({ queryKey: timeBlockKeys.detail(id) });
    }
    this.timeBlockDetails.clear();
  }
}

/**
 * Hook that manages WebSocket connection and query invalidation.
 *
 * Automatically connects when authenticated and disconnects on logout.
 * Listens for realtime events and invalidates relevant TanStack Query caches,
 * coalescing rapid bursts of events (e.g. echoes of local mutations) to
 * minimise refetch traffic.
 */
export function useWebSocket(): void {
  const { token, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const connectedRef = useRef(false);
  const tokenRef = useRef<string | null>(null);
  const batcherRef = useRef<InvalidationBatcher | null>(null);

  if (!batcherRef.current) {
    batcherRef.current = new InvalidationBatcher(() => queryClient);
  }

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (connectedRef.current) {
        wsClient.disconnect();
        connectedRef.current = false;
        tokenRef.current = null;
      }
      return;
    }

    if (!connectedRef.current || tokenRef.current !== token) {
      wsClient.connect(token);
      connectedRef.current = true;
      tokenRef.current = token;
    }

    const batcher = batcherRef.current!;

    const unsubscribe = wsClient.subscribe((event: WebSocketEvent) => {
      handleWebSocketEvent(event, queryClient, batcher);
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, token, queryClient]);
}

function handleWebSocketEvent(
  event: WebSocketEvent,
  queryClient: ReturnType<typeof useQueryClient>,
  batcher: InvalidationBatcher
): void {
  switch (event.type) {
    case "task:created":
    case "task:updated":
    case "task:deleted":
    case "task:completed":
    case "task:reordered":
      batcher.schedule(taskKeys.lists());
      batcher.schedule(["tasks", "search", "infinite"]);

      if (event.payload && typeof event.payload === "object" && "taskId" in event.payload) {
        const { taskId } = event.payload as { taskId: string };
        batcher.scheduleTaskDetail(taskId);
        batcher.scheduleSubtasksFor(taskId);
      }

      if (
        event.type === "task:deleted" ||
        event.type === "task:updated" ||
        event.type === "task:completed"
      ) {
        batcher.schedule(timeBlockKeys.lists());
      }
      break;

    case "timeblock:created":
    case "timeblock:updated":
    case "timeblock:deleted":
      batcher.schedule(timeBlockKeys.lists());
      if (
        event.payload &&
        typeof event.payload === "object" &&
        "timeBlockId" in event.payload
      ) {
        const { timeBlockId } = event.payload as { timeBlockId: string };
        batcher.scheduleTimeBlockDetail(timeBlockId);
      }
      break;

    case "user:updated": {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      const userPayload = event.payload as UserEvent;
      if (userPayload.preferences) {
        emitPreferencesUpdate(userPayload.preferences);
      }
      break;
    }

    case "timer:started":
    case "timer:stopped":
      // Timer events are user-perceptible state changes; invalidate
      // immediately so focus mode stays in sync without delay.
      queryClient.invalidateQueries({ queryKey: timerKeys.active() });
      if (event.payload && typeof event.payload === "object" && "taskId" in event.payload) {
        const { taskId } = event.payload as { taskId: string };
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      }
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      break;

    case "connected":
      queryClient.invalidateQueries({ queryKey: timerKeys.active() });
      break;

    case "calendar:synced":
    case "calendar:account-disconnected":
    case "calendar:updated":
      queryClient.refetchQueries({ queryKey: calendarKeys.accounts() });
      queryClient.refetchQueries({ queryKey: calendarKeys.calendars() });
      queryClient.refetchQueries({ queryKey: calendarKeys.all });
      break;
  }
}
