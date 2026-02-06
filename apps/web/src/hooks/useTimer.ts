import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  wsClient,
  type TimerStartedEvent,
  type TimerStoppedEvent,
} from "@/lib/websocket";
import { taskKeys } from "@/hooks/useTasks";

interface TimerState {
  isRunning: boolean;
  startedAt: number | null; // timestamp (ms)
  accumulatedSeconds: number;
}

interface UseTimerOptions {
  taskId: string;
  initialSeconds?: number; // from (actualMins ?? 0) * 60
}

interface UseTimerReturn {
  isRunning: boolean;
  elapsedSeconds: number;
  totalSeconds: number;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

/**
 * Query key factory for timer queries
 */
export const timerKeys = {
  active: () => ["tasks", "timer", "active"] as const,
};

const STORAGE_KEY_PREFIX = "focus-timer-";

function getStorageKey(taskId: string): string {
  return `${STORAGE_KEY_PREFIX}${taskId}`;
}

function loadTimerState(taskId: string): TimerState | null {
  try {
    const stored = localStorage.getItem(getStorageKey(taskId));
    if (stored) {
      return JSON.parse(stored) as TimerState;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

function saveTimerState(taskId: string, state: TimerState): void {
  try {
    localStorage.setItem(getStorageKey(taskId), JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

function clearTimerState(taskId: string): void {
  try {
    localStorage.removeItem(getStorageKey(taskId));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Server-authoritative focus timer hook with WebSocket sync.
 *
 * Server is source of truth for timer state. Client provides optimistic updates
 * for instant UI response. WebSocket events keep multiple clients in sync.
 *
 * When not running: displays `initialSeconds` (from task's actualMins).
 * When running: displays accumulated + elapsed (client-side tick from server's startedAt).
 */
export function useTimer({
  taskId,
  initialSeconds = 0,
}: UseTimerOptions): UseTimerReturn {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  // Local timer state — optimistic, reconciled with server
  const [state, setState] = React.useState<TimerState>(() => {
    // Try localStorage as initial hydration (offline fallback)
    const stored = loadTimerState(taskId);
    if (stored) return stored;
    return {
      isRunning: false,
      startedAt: null,
      accumulatedSeconds: 0,
    };
  });

  const [currentElapsed, setCurrentElapsed] = React.useState(0);
  const stateRef = React.useRef(state);
  stateRef.current = state;

  // Track if we've hydrated from server to avoid overwriting with stale localStorage
  const hydratedRef = React.useRef(false);

  // Fetch active timer from server on mount
  const { data: activeTimerTask } = useQuery({
    queryKey: timerKeys.active(),
    queryFn: async () => {
      const api = getApi();
      return await api.tasks.timerActive();
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  // Hydrate state from server response (server wins over localStorage)
  React.useEffect(() => {
    if (activeTimerTask === undefined) return; // Still loading

    if (
      activeTimerTask &&
      activeTimerTask.id === taskId &&
      activeTimerTask.timerStartedAt
    ) {
      // Server says this task has an active timer
      const serverStartedAt = new Date(
        activeTimerTask.timerStartedAt
      ).getTime();
      setState({
        isRunning: true,
        startedAt: serverStartedAt,
        accumulatedSeconds: activeTimerTask.timerAccumulatedSeconds,
      });
      hydratedRef.current = true;
    } else if (!hydratedRef.current && stateRef.current.isRunning) {
      // Server says no active timer for this task, but local state thinks it's running.
      // Reconcile: server wins (timer was stopped from another client or crashed).
      setState((prev) => ({
        ...prev,
        isRunning: false,
        startedAt: null,
      }));
      hydratedRef.current = true;
    } else {
      hydratedRef.current = true;
    }
  }, [activeTimerTask, taskId]);

  // Subscribe to WebSocket timer events for cross-client sync
  React.useEffect(() => {
    const unsubscribe = wsClient.subscribe((event) => {
      if (event.type === "timer:started") {
        const payload = event.payload as TimerStartedEvent;
        if (payload.taskId === taskId) {
          // This task's timer was started (possibly from another client)
          setState({
            isRunning: true,
            startedAt: new Date(payload.startedAt).getTime(),
            accumulatedSeconds: payload.accumulatedSeconds,
          });
        } else if (stateRef.current.isRunning) {
          // A different task's timer started — this one was auto-stopped by the server
          setState({
            isRunning: false,
            startedAt: null,
            accumulatedSeconds: 0,
          });
        }
      } else if (event.type === "timer:stopped") {
        const payload = event.payload as TimerStoppedEvent;
        if (payload.taskId === taskId) {
          // This task's timer was stopped (possibly from another client)
          setState({
            isRunning: false,
            startedAt: null,
            accumulatedSeconds: 0,
          });
          // Invalidate task detail to refresh actualMins in the UI
          queryClient.invalidateQueries({
            queryKey: taskKeys.detail(taskId),
          });
        }
      }
    });
    return unsubscribe;
  }, [taskId, queryClient]);

  // Calculate elapsed seconds since timer started
  const calculateElapsed = React.useCallback(() => {
    if (state.isRunning && state.startedAt) {
      return Math.floor((Date.now() - state.startedAt) / 1000);
    }
    return 0;
  }, [state.isRunning, state.startedAt]);

  // Update elapsed time every second when running
  React.useEffect(() => {
    if (!state.isRunning) {
      setCurrentElapsed(0);
      return;
    }
    setCurrentElapsed(calculateElapsed());
    const interval = setInterval(() => {
      setCurrentElapsed(calculateElapsed());
    }, 1000);
    return () => clearInterval(interval);
  }, [state.isRunning, calculateElapsed]);

  // Persist state to localStorage (offline fallback)
  React.useEffect(() => {
    saveTimerState(taskId, state);
  }, [taskId, state]);

  // Start timer — optimistic + server API call
  const start = React.useCallback(() => {
    // Optimistic update (instant UI response)
    const optimisticStartedAt = Date.now();
    setState((prev) => ({
      ...prev,
      isRunning: true,
      startedAt: optimisticStartedAt,
      accumulatedSeconds: initialSeconds, // Continue from existing actualMins
    }));

    // Fire API call in background
    const api = getApi();
    api.tasks
      .timerStart(taskId)
      .then((result) => {
        // Reconcile with server's authoritative timestamp
        if (result.task.timerStartedAt) {
          setState((prev) => ({
            ...prev,
            startedAt: new Date(result.task.timerStartedAt!).getTime(),
            accumulatedSeconds: result.task.timerAccumulatedSeconds,
          }));
        }
        // Invalidate queries so other views update
        queryClient.invalidateQueries({ queryKey: timerKeys.active() });
        if (result.stoppedTask) {
          queryClient.invalidateQueries({
            queryKey: taskKeys.detail(result.stoppedTask.id),
          });
          queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
        }
      })
      .catch(() => {
        // Rollback on failure
        setState((prev) => ({
          ...prev,
          isRunning: false,
          startedAt: null,
        }));
      });
  }, [taskId, initialSeconds, queryClient]);

  // Stop timer — optimistic + server API call
  const stop = React.useCallback(() => {
    // Optimistic update (instant UI response)
    setState({
      isRunning: false,
      startedAt: null,
      accumulatedSeconds: 0,
    });
    setCurrentElapsed(0);

    // Fire API call in background — server computes and saves actualMins
    const api = getApi();
    api.tasks
      .timerStop(taskId)
      .then(() => {
        // Invalidate queries so actualMins refreshes everywhere
        queryClient.invalidateQueries({ queryKey: timerKeys.active() });
        queryClient.invalidateQueries({
          queryKey: taskKeys.detail(taskId),
        });
        queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      })
      .catch(() => {
        // On failure, refetch to reconcile
        queryClient.invalidateQueries({ queryKey: timerKeys.active() });
      });
  }, [taskId, queryClient]);

  // Reset timer state (for manual clear)
  const reset = React.useCallback(() => {
    setState({
      isRunning: false,
      startedAt: null,
      accumulatedSeconds: 0,
    });
    setCurrentElapsed(0);
    clearTimerState(taskId);
  }, [taskId]);

  // Total seconds:
  // - When running: accumulated + current elapsed (real-time tick)
  // - When not running: use initialSeconds (from task's actualMins) as the display value
  const totalSeconds = state.isRunning
    ? state.accumulatedSeconds + currentElapsed
    : initialSeconds;

  return {
    isRunning: state.isRunning,
    elapsedSeconds: currentElapsed,
    totalSeconds,
    start,
    stop,
    reset,
  };
}

/**
 * Format seconds into HH:MM:SS or MM:SS string
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format minutes into readable time string
 */
export function formatMins(mins: number | null): string {
  if (mins === null || mins === 0) return "No estimate";
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
}
