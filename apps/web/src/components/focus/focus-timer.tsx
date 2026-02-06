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

  // Server handles saving actualMins on stop — no onStop callback needed
  const { isRunning, totalSeconds, start, stop, reset } = useTimer({
    taskId,
    initialSeconds,
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

  // totalSeconds already handles the display:
  // - When running: accumulated + elapsed (real-time tick)
  // - When not running: initialSeconds (from actualMins)
  const displaySeconds = totalSeconds;
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

  // Compact mode: inline header with actual / planned time
  if (compact) {
    return (
      <div className="flex items-center gap-3 shrink-0">
        {/* Running indicator */}
        {isRunning && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
        )}

        {/* Time display: actual / planned */}
        <div className="flex items-center gap-1">
          {/* Actual time */}
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
              placeholder="0:00"
              dropdownHeader="Actual time"
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

          {/* Planned time — always visible */}
          <span className="text-muted-foreground/30 text-xs">/</span>
          <TimeDropdown
            ref={plannedTimeRef}
            value={plannedMins}
            onChange={onPlannedMinsChange ?? (() => {})}
            placeholder="0:00"
            dropdownHeader="Planned time"
            shortcutHint="W"
            showClear={!!plannedMins}
            clearText="Clear"
            size="sm"
            className="font-mono text-sm text-muted-foreground/60"
          />
        </div>

        {/* Start/stop button */}
        <button
          onClick={isRunning ? stop : start}
          className={cn(
            "flex items-center justify-center gap-1.5 h-8 px-3 rounded-md border text-sm font-medium transition-all cursor-pointer",
            isRunning
              ? "border-red-500/30 text-red-500 hover:bg-red-500/10"
              : "border-[#22c55e]/30 text-[#22c55e] hover:bg-[#22c55e]/10"
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
              Start
            </>
          )}
        </button>
      </div>
    );
  }

  // Full mode: centered clean timer display
  return (
    <div className="flex flex-col items-center gap-8">
      {/* Timer display - smaller and cleaner */}
      <div className="flex items-center gap-4">
        {/* Running indicator */}
        {isRunning && (
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
        )}

        {/* Actual/Edit time */}
        {isRunning ? (
          <span
            className={cn(
              "text-4xl font-mono tabular-nums tracking-tight",
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
            dropdownHeader="Set time"
            shortcutHint="E"
            showClear={displayMins > 0}
            clearText="Clear"
            size="lg"
            className={cn(
              "text-4xl font-medium",
              displaySeconds > 0
                ? "text-foreground"
                : "text-muted-foreground/50"
            )}
          />
        )}
      </div>

      {/* Start/Stop button - bordered, centered */}
      <button
        onClick={isRunning ? stop : start}
        className={cn(
          "flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border text-sm font-medium transition-all w-32 cursor-pointer",
          isRunning
            ? "border-red-500/30 text-red-500 hover:bg-red-500/10"
            : "border-[#22c55e]/30 text-[#22c55e] hover:bg-[#22c55e]/10"
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
            Start
          </>
        )}
      </button>
    </div>
  );
}
