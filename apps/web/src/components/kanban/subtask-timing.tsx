import * as React from "react";
import { Pause, Play } from "lucide-react";
import type { Subtask } from "@open-sunsama/types";
import { cn, formatDuration } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DurationPicker } from "@/components/ui/duration-picker";
import { useUpdateSubtask } from "@/hooks/useSubtasks";
import {
  formatClock,
  isSingleClick,
  loggedSeconds,
  useSubtaskTimerToggle,
} from "@/hooks/useTaskTimerToggle";

/** Seconds logged, ticking once a second while the timer runs. */
function useLiveSeconds(subtask: Subtask) {
  const running = !!subtask.timerStartedAt;
  const [, tick] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [running]);
  return { running, seconds: loggedSeconds(subtask) };
}

function TimeField({
  value,
  label,
  onChange,
}: {
  value: number | null;
  label: string;
  onChange: (mins: number | null) => void;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${label} time: ${value ? formatDuration(value) : "none"}`}
          className={cn(
            "w-14 rounded px-1 text-right text-sm tabular-nums transition-colors hover:bg-accent hover:text-foreground",
            value ? "text-muted-foreground" : "text-muted-foreground/40"
          )}
        >
          {value ? formatDuration(value) : "--:--"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <DurationPicker
          value={value}
          label={label}
          onChange={(mins) => {
            onChange(mins);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}

/**
 * A subtask's Actual and Planned times and its Start / Stop button, as in
 * Sunsama's task view. Starting a subtask times its task too.
 */
export function SubtaskTiming({ subtask }: { subtask: Subtask }) {
  const toggle = useSubtaskTimerToggle();
  const update = useUpdateSubtask();
  const { running, seconds } = useLiveSeconds(subtask);
  const save = (data: { actualMins?: number | null; estimatedMins?: number | null }) =>
    update.mutate({ taskId: subtask.taskId, subtaskId: subtask.id, data });

  return (
    <div className="ml-auto flex shrink-0 items-center gap-2 pl-3 max-sm:justify-start max-sm:pl-0 max-sm:pb-1">
      {running ? (
        <span className="w-14 text-right text-sm tabular-nums text-emerald-500">
          {formatClock(seconds)}
        </span>
      ) : (
        <TimeField
          value={subtask.actualMins}
          label="Actual"
          onChange={(mins) => save({ actualMins: mins })}
        />
      )}
      <TimeField
        value={subtask.estimatedMins}
        label="Planned"
        onChange={(mins) => save({ estimatedMins: mins })}
      />
      <button
        type="button"
        onClick={(e) => isSingleClick(e) && void toggle(subtask.taskId, subtask.id)}
        // Done subtasks keep the column for alignment but can't be started.
        disabled={subtask.completed && !running}
        aria-label={running ? "Stop subtask timer" : "Start subtask timer"}
        className={cn(
          "flex h-7 w-[4.5rem] items-center justify-center gap-1.5 rounded-md border text-[11px] font-semibold uppercase tracking-wider transition-[opacity,colors]",
          running
            ? "border-emerald-500 text-emerald-500 hover:bg-emerald-500/10"
            : subtask.completed
              ? "invisible"
              : "border-emerald-500 bg-emerald-500 text-white opacity-0 hover:bg-emerald-600 focus-visible:opacity-100 group-hover:opacity-100 max-sm:opacity-100 [@media(hover:none)]:opacity-100"
        )}
      >
        {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        {running ? "Stop" : "Start"}
      </button>
    </div>
  );
}
