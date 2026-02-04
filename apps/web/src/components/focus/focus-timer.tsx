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
 * Clean, minimal design with large timer display
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

  const { isRunning, totalSeconds, start, stop } = useTimer({
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
  const actualMinsFromTimer = Math.floor(totalSeconds / 60);

  // Use timer's accumulated time if it exists, otherwise fall back to prop
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
    <div className="flex flex-col items-center gap-8">
      {/* Main timer display */}
      <div className="flex items-center gap-4">
        {/* Running indicator */}
        {isRunning && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
        )}

        {/* Timer value */}
        {isRunning ? (
          <span
            className={cn(
              "text-6xl font-light font-mono tabular-nums tracking-tight",
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
            value={displayActualMins > 0 ? displayActualMins : null}
            onChange={handleActualTimeChange}
            placeholder="0:00"
            dropdownHeader="Set actual time"
            shortcutHint="E"
            size="lg"
            className={cn(
              "text-6xl font-light",
              isSignificantlyOver && "text-red-400",
              isOverPlanned && !isSignificantlyOver && "text-amber-400"
            )}
          />
        )}

        {/* Planned time (smaller, secondary) - always render for keyboard shortcut */}
        <div className="flex items-center gap-2 text-muted-foreground/40">
          {plannedMins && <span className="text-2xl font-light">/</span>}
          <TimeDropdown
            ref={plannedTimeRef}
            value={plannedMins}
            onChange={onPlannedMinsChange ?? (() => {})}
            dropdownHeader="Set planned time"
            shortcutHint="W"
            showClear
            clearText="Clear planned"
            size="md"
            disabled={!onPlannedMinsChange}
            className={cn(
              "text-2xl font-light",
              plannedMins
                ? "text-muted-foreground/40"
                : "text-muted-foreground/20"
            )}
            placeholder={plannedMins ? undefined : "Set plan"}
          />
        </div>
      </div>

      {/* Start/Stop button - large and prominent */}
      <button
        onClick={isRunning ? stop : start}
        className={cn(
          "flex items-center justify-center gap-2 px-8 py-3 rounded-full text-sm font-medium transition-all",
          isRunning
            ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
            : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105"
        )}
      >
        {isRunning ? (
          <>
            <Square className="h-4 w-4 fill-current" />
            Stop
          </>
        ) : (
          <>
            <Play className="h-4 w-4 fill-current" />
            Start Focus
          </>
        )}
      </button>
    </div>
  );
}
