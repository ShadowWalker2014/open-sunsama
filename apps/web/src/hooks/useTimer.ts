import * as React from "react";

interface TimerState {
  isRunning: boolean;
  startedAt: number | null; // timestamp
  accumulatedSeconds: number;
}

interface UseTimerOptions {
  taskId: string;
  initialSeconds?: number;
  onStop?: (totalSeconds: number) => void;
}

interface UseTimerReturn {
  isRunning: boolean;
  elapsedSeconds: number;
  totalSeconds: number;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

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
 * Check if a timer is running for a task and return total seconds if so
 * Used to stop timer when task is completed from outside the focus view
 */
export function getRunningTimerSeconds(taskId: string): number | null {
  const state = loadTimerState(taskId);
  if (!state || !state.isRunning) {
    return null;
  }
  
  const elapsed = state.startedAt
    ? Math.floor((Date.now() - state.startedAt) / 1000)
    : 0;
  return state.accumulatedSeconds + elapsed;
}

/**
 * Stop and clear a running timer for a task
 * Returns total seconds if timer was running, null otherwise
 */
export function stopAndClearTimer(taskId: string): number | null {
  const totalSeconds = getRunningTimerSeconds(taskId);
  if (totalSeconds !== null) {
    clearTimerState(taskId);
  }
  return totalSeconds;
}

/**
 * Custom hook for managing a focus timer with localStorage persistence
 */
export function useTimer({
  taskId,
  initialSeconds = 0,
  onStop,
}: UseTimerOptions): UseTimerReturn {
  const [state, setState] = React.useState<TimerState>(() => {
    // Try to restore from localStorage
    const stored = loadTimerState(taskId);
    if (stored) {
      return stored;
    }
    return {
      isRunning: false,
      startedAt: null,
      accumulatedSeconds: initialSeconds,
    };
  });

  const [currentElapsed, setCurrentElapsed] = React.useState(0);

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

    // Calculate initial elapsed immediately
    setCurrentElapsed(calculateElapsed());

    const interval = setInterval(() => {
      setCurrentElapsed(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isRunning, calculateElapsed]);

  // Persist state to localStorage when it changes
  React.useEffect(() => {
    saveTimerState(taskId, state);
  }, [taskId, state]);

  // Sync with initialSeconds when it changes (e.g., from server)
  React.useEffect(() => {
    if (!state.isRunning && initialSeconds > 0 && state.accumulatedSeconds === 0) {
      setState((prev) => ({
        ...prev,
        accumulatedSeconds: initialSeconds,
      }));
    }
  }, [initialSeconds, state.isRunning, state.accumulatedSeconds]);

  const start = React.useCallback(() => {
    setState((prev) => ({
      ...prev,
      isRunning: true,
      startedAt: Date.now(),
    }));
  }, []);

  const stop = React.useCallback(() => {
    setState((prev) => {
      const elapsed = prev.startedAt
        ? Math.floor((Date.now() - prev.startedAt) / 1000)
        : 0;
      const newAccumulated = prev.accumulatedSeconds + elapsed;

      // Call onStop callback with total seconds
      if (onStop) {
        onStop(newAccumulated);
      }

      return {
        isRunning: false,
        startedAt: null,
        accumulatedSeconds: newAccumulated,
      };
    });
    setCurrentElapsed(0);
  }, [onStop]);

  const reset = React.useCallback(() => {
    setState({
      isRunning: false,
      startedAt: null,
      accumulatedSeconds: 0,
    });
    setCurrentElapsed(0);
    clearTimerState(taskId);
  }, [taskId]);

  const totalSeconds = state.accumulatedSeconds + currentElapsed;

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
