import * as React from "react";
import type { Task } from "@open-sunsama/types";
import { cn, formatDuration } from "@/lib/utils";

/**
 * Lightweight hook that ticks every second when a task has an active timer.
 * Uses only the task data (timerStartedAt, timerAccumulatedSeconds) — no API calls.
 */
function useLiveTimer(task: Task): {
  isTimerRunning: boolean;
  liveSeconds: number;
} {
  const isTimerRunning = task.timerStartedAt !== null;
  const startedAtMs = isTimerRunning
    ? new Date(task.timerStartedAt as unknown as string).getTime()
    : 0;

  const [elapsed, setElapsed] = React.useState(() =>
    isTimerRunning ? Math.floor((Date.now() - startedAtMs) / 1000) : 0
  );

  React.useEffect(() => {
    if (!isTimerRunning) {
      setElapsed(0);
      return;
    }
    // Immediately calculate current elapsed
    setElapsed(Math.floor((Date.now() - startedAtMs) / 1000));

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtMs) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, startedAtMs]);

  const liveSeconds = isTimerRunning
    ? task.timerAccumulatedSeconds + elapsed
    : 0;

  return { isTimerRunning, liveSeconds };
}

/**
 * Format seconds as M:SS (matching formatDuration style)
 */
function formatLiveTime(seconds: number): string {
  const totalMins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${totalMins}:${secs.toString().padStart(2, "0")}`;
}

interface TaskTimeBadgeProps {
  task: Task;
  isCompleted?: boolean;
  className?: string;
}

/**
 * Shows task time — live ticking when timer is active, static actualMins otherwise.
 * Displays a green pulsing dot when the timer is running.
 */
export function TaskTimeBadge({
  task,
  isCompleted = false,
  className,
}: TaskTimeBadgeProps) {
  const { isTimerRunning, liveSeconds } = useLiveTimer(task);

  // When timer is running: show live time with pulsing indicator
  if (isTimerRunning) {
    const isOverEstimate =
      task.estimatedMins && liveSeconds > task.estimatedMins * 60;
    const isSignificantlyOver =
      task.estimatedMins && liveSeconds > task.estimatedMins * 60 * 1.5;

    return (
      <div
        className={cn(
          "shrink-0 flex items-center gap-1 rounded px-1.5 py-0.5",
          "bg-emerald-500/10",
          "transition-all duration-150",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pulsing green dot */}
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
        </span>

        {/* Live ticking time */}
        <span
          className={cn(
            "text-[11px] tabular-nums font-medium",
            isSignificantlyOver
              ? "text-red-500"
              : isOverEstimate
                ? "text-amber-500"
                : "text-emerald-600 dark:text-emerald-400"
          )}
        >
          {formatLiveTime(liveSeconds)}
        </span>

        {/* Separator and estimated */}
        {task.estimatedMins && (
          <>
            <span className="text-muted-foreground/50 text-[11px]">/</span>
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {formatDuration(task.estimatedMins)}
            </span>
          </>
        )}
      </div>
    );
  }

  // When timer is NOT running: show static actualMins
  const hasActualTime =
    task.actualMins !== null &&
    task.actualMins !== undefined &&
    task.actualMins > 0;

  if (!hasActualTime && !task.estimatedMins) return null;

  // Has actual time — show actual / estimated
  if (hasActualTime) {
    return (
      <div
        className={cn(
          "shrink-0 flex items-center gap-0.5 rounded px-1.5 py-0.5",
          "bg-muted/50",
          "transition-all duration-150",
          isCompleted && "opacity-50",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className={cn(
            "text-[11px] tabular-nums",
            task.actualMins &&
              task.estimatedMins &&
              task.actualMins > task.estimatedMins
              ? "text-amber-500"
              : "text-foreground"
          )}
        >
          {formatDuration(task.actualMins!)}
        </span>

        {task.estimatedMins && (
          <>
            <span className="text-muted-foreground/50 text-[11px]">/</span>
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {formatDuration(task.estimatedMins)}
            </span>
          </>
        )}
      </div>
    );
  }

  // No actual time, but has estimate — return null (handled by parent with Popover)
  return null;
}

/**
 * Hook version for use in mobile cards or custom layouts.
 * Returns display text and timer state for flexible rendering.
 */
export function useTaskTimerDisplay(task: Task): {
  isTimerRunning: boolean;
  displayText: string | null;
  liveSeconds: number;
} {
  const { isTimerRunning, liveSeconds } = useLiveTimer(task);

  if (isTimerRunning) {
    const liveText = formatLiveTime(liveSeconds);
    const displayText = task.estimatedMins
      ? `${liveText} / ${formatDuration(task.estimatedMins)}`
      : liveText;
    return { isTimerRunning, displayText, liveSeconds };
  }

  const hasActualTime = task.actualMins != null && task.actualMins > 0;
  const hasEstimate = task.estimatedMins != null && task.estimatedMins > 0;

  let displayText: string | null = null;
  if (hasActualTime && hasEstimate) {
    displayText = `${formatDuration(task.actualMins!)} / ${formatDuration(task.estimatedMins!)}`;
  } else if (hasEstimate) {
    displayText = formatDuration(task.estimatedMins!);
  } else if (hasActualTime) {
    displayText = formatDuration(task.actualMins!);
  }

  return { isTimerRunning, displayText, liveSeconds };
}
