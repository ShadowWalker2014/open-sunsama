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
      // Always save the actual time, even if 0 minutes (keeps seconds in localStorage)
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
      {/* Timer display - same size for actual and planned */}
      <div className="flex items-baseline gap-2">
        {/* Running indicator */}
        {isRunning && (
          <span className="relative flex h-2.5 w-2.5 mr-1 self-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
        )}

        {/* Actual time - always show, same size as planned */}
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
          <span
            className={cn(
              "text-5xl font-light font-mono tabular-nums tracking-tight cursor-pointer hover:text-foreground transition-colors",
              displaySeconds > 0
                ? "text-foreground"
                : "text-muted-foreground/50"
            )}
            onClick={() => actualTimeRef.current?.open()}
          >
            {formatTime(displaySeconds)}
          </span>
        )}

        {/* Hidden dropdown for actual time editing */}
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
          className="hidden"
        />

        {/* Separator */}
        <span className="text-5xl font-light text-muted-foreground/30">/</span>

        {/* Planned time - same size as actual */}
        <span
          className={cn(
            "text-5xl font-light font-mono tabular-nums tracking-tight cursor-pointer hover:text-muted-foreground/60 transition-colors",
            plannedMins
              ? "text-muted-foreground/40"
              : "text-muted-foreground/30"
          )}
          onClick={() => plannedTimeRef.current?.open()}
        >
          {plannedMins ? formatTime(plannedMins * 60) : "0:00"}
        </span>

        {/* Hidden dropdown for planned time editing */}
        <TimeDropdown
          ref={plannedTimeRef}
          value={plannedMins}
          onChange={onPlannedMinsChange ?? (() => {})}
          placeholder="0:00"
          dropdownHeader="Set planned time"
          shortcutHint="W"
          showClear={!!plannedMins}
          clearText="Clear"
          size="lg"
          disabled={!onPlannedMinsChange}
          className="hidden"
        />
      </div>

      {/* Start/Stop button */}
      <button
        onClick={isRunning ? stop : start}
        className={cn(
          "flex items-center justify-center gap-1.5 px-5 py-2 rounded-md text-sm font-medium transition-all",
          isRunning
            ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
            : "bg-[#22c55e] text-white hover:bg-[#16a34a]"
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
            START
          </>
        )}
      </button>
    </div>
  );
}
