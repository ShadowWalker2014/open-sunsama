import * as React from "react";
import { Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TimeDropdown,
  type TimeDropdownRef,
} from "@/components/ui/time-dropdown";
import { useTimer } from "@/hooks/useTimer";

/**
 * Format seconds into M:SS format (consistent with task modal time display)
 * Always shows minutes:seconds, never hours
 */
function formatTimerDisplay(seconds: number): string {
  const totalMins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${totalMins}:${secs.toString().padStart(2, "0")}`;
}

interface FocusTimerProps {
  taskId: string;
  plannedMins: number | null;
  actualMins: number | null;
  onActualMinsChange: (mins: number | null) => void;
  onPlannedMinsChange?: (mins: number | null) => void;
  /** Ref to expose timer controls (toggle function) */
  timerRef?: React.RefObject<FocusTimerRef | null>;
  /** Compact mode for inline header display */
  compact?: boolean;
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
  compact = false,
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

  // Compact mode: inline header with ACTUAL/PLANNED labels and START button
  if (compact) {
    return (
      <div className="flex items-center gap-4 shrink-0">
        {/* Running indicator */}
        {isRunning && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
        )}

        {/* Time displays with labels */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
              Actual
            </span>
            {isRunning ? (
              <span
                className={cn(
                  "text-base font-mono tabular-nums",
                  isSignificantlyOver && "text-red-400",
                  isOverPlanned && !isSignificantlyOver && "text-amber-400",
                  !isOverPlanned && "text-foreground"
                )}
              >
                {formatTimerDisplay(totalSeconds)}
              </span>
            ) : (
              <TimeDropdown
                ref={actualTimeRef}
                value={displayMins > 0 ? displayMins : null}
                onChange={handleActualTimeChange}
                placeholder="--:--"
                dropdownHeader="Set actual time"
                shortcutHint="E"
                showClear={displayMins > 0}
                clearText="Clear"
                size="sm"
                className={cn(
                  "font-mono",
                  displaySeconds > 0
                    ? "text-foreground"
                    : "text-muted-foreground/50"
                )}
              />
            )}
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
              Planned
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
              size="sm"
              disabled={!onPlannedMinsChange}
              className="font-mono text-foreground"
            />
          </div>
        </div>

        {/* Start/Stop button */}
        <button
          onClick={isRunning ? stop : start}
          className={cn(
            "flex items-center justify-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium transition-all",
            isRunning
              ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
              : "bg-[#22c55e] text-white hover:bg-[#16a34a]"
          )}
        >
          {isRunning ? (
            <>
              <Square className="h-3 w-3 fill-current" />
              Stop
            </>
          ) : (
            <>
              <Play className="h-3 w-3 fill-current" />
              START
            </>
          )}
        </button>
      </div>
    );
  }

  // Full mode: centered large timer display
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Timer display - same size for actual and planned */}
      <div className="flex items-baseline gap-3">
        {/* Running indicator */}
        {isRunning && (
          <span className="relative flex h-2.5 w-2.5 mr-1 self-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
        )}

        {/* Actual time - use TimeDropdown with transparent trigger */}
        {isRunning ? (
          <span
            className={cn(
              "text-5xl font-light font-mono tabular-nums tracking-tight",
              isSignificantlyOver && "text-red-400",
              isOverPlanned && !isSignificantlyOver && "text-amber-400",
              !isOverPlanned && "text-foreground"
            )}
          >
            {formatTimerDisplay(totalSeconds)}
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
              displaySeconds > 0
                ? "text-foreground"
                : "text-muted-foreground/50"
            )}
          />
        )}

        {/* Separator */}
        <span className="text-5xl font-light text-muted-foreground/30">/</span>

        {/* Planned time - use TimeDropdown with transparent trigger */}
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
          className={cn(
            "text-5xl font-light",
            plannedMins
              ? "text-muted-foreground/40"
              : "text-muted-foreground/30"
          )}
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
