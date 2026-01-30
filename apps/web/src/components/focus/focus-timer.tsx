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
    <div className="flex flex-col items-center gap-5 py-6">
      {/* Time display */}
      <div className="flex items-baseline gap-6 text-center">
        {/* Actual time */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[11px] font-medium text-muted-foreground/70">
            Actual
          </span>
          <span
            className={cn(
              "text-3xl font-mono font-normal tabular-nums tracking-tight",
              isSignificantlyOver && "text-red-400",
              isOverPlanned && !isSignificantlyOver && "text-amber-400",
              isRunning && !isOverPlanned && "text-foreground"
            )}
          >
            {formatTime(totalSeconds)}
          </span>
        </div>

        {/* Separator */}
        <span className="text-xl text-muted-foreground/30 font-light">/</span>

        {/* Planned time */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[11px] font-medium text-muted-foreground/70">
            Planned
          </span>
          <span className="text-3xl font-mono font-normal tabular-nums tracking-tight text-muted-foreground/60">
            {plannedMins ? formatTime(plannedSeconds) : "--:--"}
          </span>
        </div>
      </div>

      {/* Estimated time badge */}
      {plannedMins && (
        <p className="text-xs text-muted-foreground/60">
          Estimated: {formatMins(plannedMins)}
        </p>
      )}

      {/* Timer controls */}
      <div className="flex items-center gap-3 mt-1">
        {isRunning ? (
          <Button
            size="sm"
            variant="outline"
            onClick={stop}
            className="gap-1.5 px-4 h-8 border-red-500/50 text-red-500 hover:bg-red-500/10 hover:border-red-500"
          >
            <Pause className="h-3.5 w-3.5" />
            Stop
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={start}
            className="gap-1.5 px-4 h-8"
          >
            <Play className="h-3.5 w-3.5" />
            Start
          </Button>
        )}

        {totalSeconds > 0 && !isRunning && (
          <Button
            size="sm"
            variant="ghost"
            onClick={reset}
            className="gap-1.5 h-8 text-muted-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        )}
      </div>

      {/* Running indicator - subtle dot only */}
      {isRunning && (
        <div className="flex items-center justify-center">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
          </span>
        </div>
      )}
    </div>
  );
}
