import * as React from "react";
import { Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TimeDropdown,
  type TimeDropdownRef,
} from "@/components/ui/time-dropdown";
import { useTimer, formatTime } from "@/hooks/useTimer";

interface FocusTimerProps {
  taskId: string;
  plannedMins: number | null;
  actualMins: number | null;
  onActualMinsChange: (mins: number | null) => void;
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
 * Timer component for focus mode - Linear-style clean design
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
      onActualMinsChange(totalMins > 0 ? totalMins : null);
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

  // Display seconds: use timer's accumulated time, fall back to server value
  const displaySeconds =
    totalSeconds > 0 ? totalSeconds : (actualMins ?? 0) * 60;
  const displayMins = Math.floor(displaySeconds / 60);

  const isOverPlanned = displaySeconds > plannedSeconds && plannedSeconds > 0;
  const isSignificantlyOver =
    displaySeconds > plannedSeconds * 1.5 && plannedSeconds > 0;

  // Handle clearing actual time
  const handleActualTimeChange = React.useCallback(
    (mins: number | null) => {
      onActualMinsChange(mins);
      if (mins === null) {
        reset(); // Clear timer state when clearing actual time
      }
    },
    [onActualMinsChange, reset]
  );

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Timer display - compact */}
      <div className="flex items-baseline gap-1">
        {/* Running indicator */}
        {isRunning && (
          <span className="relative flex h-2 w-2 mr-2 self-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
        )}

        {/* Actual time */}
        {isRunning ? (
          <span
            className={cn(
              "text-5xl font-light font-mono tabular-nums tracking-tight",
              isSignificantlyOver && "text-red-400",
              isOverPlanned && !isSignificantlyOver && "text-amber-400",
              !isOverPlanned && "text-foreground"
            )}
          >
            {formatTime(totalSeconds)}
          </span>
        ) : (
          <TimeDropdown
            ref={actualTimeRef}
            value={displayMins > 0 ? displayMins : null}
            onChange={handleActualTimeChange}
            placeholder="0:00"
            dropdownHeader="Set actual time"
            shortcutHint="E"
            showClear={displayMins > 0}
            clearText="Clear"
            size="lg"
            className={cn(
              "text-5xl font-light",
              isSignificantlyOver && "text-red-400",
              isOverPlanned && !isSignificantlyOver && "text-amber-400"
            )}
          />
        )}

        {/* Separator and planned time - inline */}
        <span className="text-2xl font-light text-muted-foreground/30 mx-1">
          /
        </span>
        <TimeDropdown
          ref={plannedTimeRef}
          value={plannedMins}
          onChange={onPlannedMinsChange ?? (() => {})}
          placeholder="--:--"
          dropdownHeader="Set planned time"
          shortcutHint="W"
          showClear={!!plannedMins}
          clearText="Clear"
          size="md"
          disabled={!onPlannedMinsChange}
          className="text-2xl font-light text-muted-foreground/40"
        />
      </div>

      {/* Start/Stop button */}
      <button
        onClick={isRunning ? stop : start}
        className={cn(
          "flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all",
          isRunning
            ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        {isRunning ? (
          <>
            <Square className="h-3.5 w-3.5 fill-current" />
            Stop
          </>
        ) : (
          <>
            <Play className="h-3.5 w-3.5 fill-current" />
            Start Focus
          </>
        )}
      </button>
    </div>
  );
}
