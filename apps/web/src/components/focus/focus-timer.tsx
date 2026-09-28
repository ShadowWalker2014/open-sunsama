import { TIME_EDIT_KEYS } from "@/hooks/useKeyboardShortcuts";
import * as React from "react";
import { Pause, Play } from "lucide-react";
import type { Task } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import {
  TimeDropdown,
  type TimeDropdownRef,
} from "@/components/ui/time-dropdown";
import { WithShortcut } from "@/components/ui/with-shortcut";
import { useTaskTimerDisplay } from "@/components/kanban/task-time-badge";
import {
  formatClock,
  isSingleClick,
  useTaskTimerToggle,
} from "@/hooks/useTaskTimerToggle";

interface FocusTimerProps {
  task: Task;
  onActualMinsChange: (mins: number | null) => void;
  onPlannedMinsChange: (mins: number | null) => void;
  /** Ref to expose timer controls (toggle function) */
  timerRef?: React.RefObject<FocusTimerRef | null>;
}

export interface FocusTimerRef {
  toggle: () => void;
  isRunning: boolean;
  openActualTimeDropdown: () => void;
  openPlannedTimeDropdown: () => void;
}

const label =
  "text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70";
const value = "font-sans text-[28px] font-normal leading-9 tabular-nums tracking-normal";

/**
 * Focus mode's timer, laid out like Sunsama's: Actual and Planned side by
 * side with a Start / Stop button. It reads and writes the same task data
 * as the board and the task modal, so all three always agree.
 */
export function FocusTimer({
  task,
  onActualMinsChange,
  onPlannedMinsChange,
  timerRef,
}: FocusTimerProps) {
  const { isTimerRunning, liveSeconds } = useTaskTimerDisplay(task);
  const toggleTimer = useTaskTimerToggle();
  const actualTimeRef = React.useRef<TimeDropdownRef>(null);
  const plannedTimeRef = React.useRef<TimeDropdownRef>(null);

  const toggle = React.useCallback(
    () => void toggleTimer(task.id),
    [toggleTimer, task.id]
  );

  React.useImperativeHandle(
    timerRef,
    () => ({
      toggle,
      isRunning: isTimerRunning,
      openActualTimeDropdown: () => actualTimeRef.current?.open(),
      openPlannedTimeDropdown: () => plannedTimeRef.current?.open(),
    }),
    [toggle, isTimerRunning]
  );

  const planned = (task.estimatedMins ?? 0) * 60;
  const over = isTimerRunning && planned > 0 && liveSeconds > planned;

  return (
    <div className="flex shrink-0 items-end gap-5">
      {isTimerRunning ? (
        <div className="flex flex-col items-center gap-1">
          <span className={label}>Actual</span>
          <span
            className={cn(value, over ? "text-amber-500" : "text-emerald-500")}
            aria-live="off"
          >
            {formatClock(liveSeconds)}
          </span>
        </div>
      ) : (
        <TimeDropdown
          ref={actualTimeRef}
          value={task.actualMins ?? null}
          onChange={onActualMinsChange}
          label="Actual"
          dropdownHeader="Actual"
          shortcutHint={TIME_EDIT_KEYS.actual.toUpperCase()}
          placeholder="0:00"
          className={cn(value, !task.actualMins && "text-muted-foreground/60")}
        />
      )}
      <TimeDropdown
        ref={plannedTimeRef}
        value={task.estimatedMins ?? null}
        onChange={onPlannedMinsChange}
        label="Planned"
        dropdownHeader="Planned"
        shortcutHint={TIME_EDIT_KEYS.planned.toUpperCase()}
        placeholder="--:--"
        className={cn(value, "text-muted-foreground")}
      />
      <WithShortcut
        label={isTimerRunning ? "Stop timer" : "Start timer"}
        keys={["Space"]}
      >
        <button
          type="button"
          onClick={(e) => isSingleClick(e) && toggle()}
          aria-label={isTimerRunning ? "Stop timer" : "Start timer"}
          className={cn(
            "mb-0.5 flex h-10 items-center gap-2 rounded-md border px-4 text-xs font-semibold uppercase tracking-wider transition-colors",
            isTimerRunning
              ? "border-emerald-500 text-emerald-500 hover:bg-emerald-500/10"
              : "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600"
          )}
        >
          {isTimerRunning ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isTimerRunning ? "Stop" : "Start"}
        </button>
      </WithShortcut>
    </div>
  );
}
