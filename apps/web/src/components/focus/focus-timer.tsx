import * as React from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { useTimer, formatTime, formatMins } from "@/hooks/useTimer";

interface FocusTimerProps {
  taskId: string;
  plannedMins: number | null;
  actualMins: number | null;
  onActualMinsChange: (mins: number) => void;
}

/**
 * Timer component for focus mode with START/STOP controls
 * Shows ACTUAL vs PLANNED time comparison
 */
export function FocusTimer({
  taskId,
  plannedMins,
  actualMins,
  onActualMinsChange,
}: FocusTimerProps) {
  const initialSeconds = (actualMins ?? 0) * 60;

  const handleStop = React.useCallback(
    (totalSeconds: number) => {
      const totalMins = Math.floor(totalSeconds / 60);
      onActualMinsChange(totalMins);
    },
    [onActualMinsChange]
  );

  const { isRunning, totalSeconds, start, stop, reset } = useTimer({
    taskId,
    initialSeconds,
    onStop: handleStop,
  });

  const plannedSeconds = (plannedMins ?? 0) * 60;
  const isOverPlanned = totalSeconds > plannedSeconds && plannedSeconds > 0;
  const isSignificantlyOver = totalSeconds > plannedSeconds * 1.5 && plannedSeconds > 0;

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Time display */}
      <div className="flex items-baseline gap-8 text-center">
        {/* Actual time */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Actual
          </span>
          <span
            className={cn(
              "text-5xl font-mono font-semibold tabular-nums",
              isSignificantlyOver && "text-red-500",
              isOverPlanned && !isSignificantlyOver && "text-amber-500",
              isRunning && !isOverPlanned && "text-green-500"
            )}
          >
            {formatTime(totalSeconds)}
          </span>
        </div>

        {/* Separator */}
        <span className="text-2xl text-muted-foreground/50 font-light">/</span>

        {/* Planned time */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Planned
          </span>
          <span className="text-5xl font-mono font-semibold tabular-nums text-muted-foreground">
            {plannedMins ? formatTime(plannedSeconds) : "--:--"}
          </span>
        </div>
      </div>

      {/* Estimated time badge */}
      {plannedMins && (
        <p className="text-sm text-muted-foreground">
          Estimated: {formatMins(plannedMins)}
        </p>
      )}

      {/* Timer controls */}
      <div className="flex items-center gap-3">
        {isRunning ? (
          <Button
            size="lg"
            variant="destructive"
            onClick={stop}
            className="gap-2 px-8"
          >
            <Pause className="h-5 w-5" />
            Stop
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={start}
            className="gap-2 px-8"
          >
            <Play className="h-5 w-5" />
            Start
          </Button>
        )}

        {totalSeconds > 0 && !isRunning && (
          <Button
            size="lg"
            variant="outline"
            onClick={reset}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        )}
      </div>

      {/* Running indicator */}
      {isRunning && (
        <div className="flex items-center gap-2 text-sm text-green-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          Timer running
        </div>
      )}
    </div>
  );
}
