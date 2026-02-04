import * as React from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import {
  TimeDropdown,
  type TimeDropdownRef,
} from "@/components/ui/time-dropdown";
import { useTimer, formatTime, formatMins } from "@/hooks/useTimer";

interface FocusTimerProps {
  taskId: string;
  plannedMins: number | null;
  actualMins: number | null;
  onActualMinsChange: (mins: number) => void;
  onPlannedMinsChange?: (mins: number | null) => void;
  /** Ref to expose timer controls (toggle function) */
  timerRef?: React.RefObject<FocusTimerRef | null>;
}

export interface FocusTimerRef {
  toggle: () => void;
  isRunning: boolean;
  openActualTimeDropdown: () => void;
  openPlannedTimeDropdown: () => void;
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
  onPlannedMinsChange,
  timerRef,
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

  // Refs for time dropdowns
  const actualTimeRef = React.useRef<TimeDropdownRef>(null);
  const plannedTimeRef = React.useRef<TimeDropdownRef>(null);

  // Toggle function for keyboard shortcut
  const toggle = React.useCallback(() => {
    if (isRunning) {
      stop();
    } else {
      start();
    }
  }, [isRunning, start, stop]);

  // Expose controls via ref
  React.useImperativeHandle(
    timerRef,
    () => ({
      toggle,
      isRunning,
      openActualTimeDropdown: () => actualTimeRef.current?.open(),
      openPlannedTimeDropdown: () => plannedTimeRef.current?.open(),
    }),
    [toggle, isRunning]
  );

  const plannedSeconds = (plannedMins ?? 0) * 60;
  const isOverPlanned = totalSeconds > plannedSeconds && plannedSeconds > 0;
  const isSignificantlyOver =
    totalSeconds > plannedSeconds * 1.5 && plannedSeconds > 0;

  // Calculate actual minutes from timer's total seconds
  // This includes both accumulated time and any current elapsed time
  const actualMinsFromTimer = Math.floor(totalSeconds / 60);

  // Use timer's accumulated time if it exists, otherwise fall back to prop
  // This ensures we show the correct time even if the server hasn't updated yet
  const displayActualMins =
    totalSeconds > 0 ? actualMinsFromTimer : (actualMins ?? 0);

  // Handle manual actual time change from dropdown
  const handleActualTimeChange = React.useCallback(
    (mins: number | null) => {
      if (mins !== null) {
        onActualMinsChange(mins);
      }
    },
    [onActualMinsChange]
  );

  return (
    <div className="flex flex-col items-center gap-5 py-6">
      {/* Time display */}
      <div className="flex items-center gap-6 text-center">
        {/* Actual time - editable via dropdown, shows running time */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-medium text-muted-foreground/70 tracking-wide uppercase">
            ACTUAL
          </span>
          {isRunning ? (
            // Show live timer when running
            <span
              className={cn(
                "text-3xl font-mono font-normal tabular-nums tracking-tight",
                isSignificantlyOver && "text-red-400",
                isOverPlanned && !isSignificantlyOver && "text-amber-400",
                !isOverPlanned && "text-foreground"
              )}
            >
              {formatTime(totalSeconds)}
            </span>
          ) : (
            // Show editable dropdown when stopped
            <TimeDropdown
              ref={actualTimeRef}
              value={displayActualMins > 0 ? displayActualMins : null}
              onChange={handleActualTimeChange}
              placeholder="--:--"
              dropdownHeader="Set actual time"
              shortcutHint="E"
              size="lg"
              className={cn(
                isSignificantlyOver && "text-red-400",
                isOverPlanned && !isSignificantlyOver && "text-amber-400"
              )}
            />
          )}
        </div>

        {/* Separator */}
        <span className="text-xl text-muted-foreground/30 font-light">/</span>

        {/* Planned time - editable via dropdown */}
        <TimeDropdown
          ref={plannedTimeRef}
          value={plannedMins}
          onChange={onPlannedMinsChange ?? (() => {})}
          label="PLANNED"
          placeholder="--:--"
          dropdownHeader="Set planned time"
          shortcutHint="W"
          showClear
          clearText="Clear planned"
          size="lg"
          disabled={!onPlannedMinsChange}
          className="text-muted-foreground/60"
        />
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
            className="gap-1.5 px-4 h-8 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
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
