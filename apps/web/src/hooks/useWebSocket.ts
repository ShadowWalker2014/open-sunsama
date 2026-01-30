import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { wsClient, type WebSocketEvent } from "@/lib/websocket";
import { useAuth } from "@/hooks/useAuth";
import { taskKeys } from "@/hooks/useTasks";
import { timeBlockKeys } from "@/hooks/useTimeBlocks";

/**
 * Hook that manages WebSocket connection and query invalidation
 *
 * Automatically connects when authenticated and disconnects on logout.
 * Listens for realtime events and invalidates relevant TanStack Query caches.
 */
export function useWebSocket(): void {
  const { token, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const connectedRef = useRef(false);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    // Disconnect if not authenticated
    if (!isAuthenticated || !token) {
      if (connectedRef.current) {
        wsClient.disconnect();
        connectedRef.current = false;
        tokenRef.current = null;
      }
      return;
    }

    // Don't reconnect if we're already connected with the same token
    if (connectedRef.current && tokenRef.current === token) {
      return;
    }

    // Connect WebSocket
    wsClient.connect(token);
    connectedRef.current = true;
    tokenRef.current = token;

    // Subscribe to events and invalidate queries
    const unsubscribe = wsClient.subscribe((event: WebSocketEvent) => {
      handleWebSocketEvent(event, queryClient);
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, token, queryClient]);
}

/**
 * Handle incoming WebSocket events by invalidating relevant query caches
 */
function handleWebSocketEvent(
  event: WebSocketEvent,
  queryClient: ReturnType<typeof useQueryClient>
): void {
  console.log("[WS] Event received:", event.type, event.payload);

  switch (event.type) {
    // Task events
    case "task:created":
    case "task:updated":
    case "task:deleted":
    case "task:completed":
    case "task:reordered":
      // Invalidate all task lists to refetch
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      
      // Also invalidate infinite search queries (used by "All Tasks" page)
      queryClient.invalidateQueries({ queryKey: ["tasks", "search", "infinite"] });

      // For individual task changes, also invalidate the specific task
      if (event.payload && typeof event.payload === "object" && "taskId" in event.payload) {
        const { taskId } = event.payload as { taskId: string };
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      }
      break;

    // Time block events
    case "timeblock:created":
    case "timeblock:updated":
    case "timeblock:deleted":
      // Invalidate all time block lists
      queryClient.invalidateQueries({ queryKey: timeBlockKeys.lists() });

      if (event.payload && typeof event.payload === "object" && "timeBlockId" in event.payload) {
        const { timeBlockId } = event.payload as { timeBlockId: string };
        queryClient.invalidateQueries({
          queryKey: timeBlockKeys.detail(timeBlockId),
        });
      }
      break;

    // User events
    case "user:updated":
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      break;

    case "connected":
      console.log("[WS] Connection confirmed");
      break;
  }
}
