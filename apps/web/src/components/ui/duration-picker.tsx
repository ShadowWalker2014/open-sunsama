import * as React from "react";
import { Check } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import {
  describeDuration,
  isZeroDuration,
  parseDuration,
} from "@/lib/parse-duration";

const PRESETS = [5, 10, 15, 20, 25, 30, 45, 60, 90, 120, 180, 240];

function presetLabel(mins: number): string {
  return mins < 60 ? `${mins} min` : `${mins / 60} hr`;
}

interface DurationPickerProps {
  value: number | null | undefined;
  onChange: (mins: number | null) => void;
  /** Header text, e.g. "Planned" or "Actual". */
  label?: string;
  /** Key that opens this picker, shown beside the label. */
  shortcut?: string;
  /** Enter on an unchanged value: nothing to save, just close. */
  onClose?: () => void;
}

/**
 * The one time picker, Sunsama-style: the current value sits in an editable
 * field (type "45", "1:15" or "1.5h", Enter saves), common lengths below
 * with the current one checked, and Clear. Used for planned and actual
 * time on cards, in the task modal and in focus mode.
 */
export function DurationPicker({
  value,
  onChange,
  label = "Planned",
  shortcut,
  onClose,
}: DurationPickerProps) {
  const initial = value ? formatDuration(value) : "";
  const [draft, setDraft] = React.useState(initial);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const id = React.useId();

  // Select the value so typing replaces it, like Sunsama.
  React.useEffect(() => {
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const edited = draft.trim() !== initial;
  const parsed = parseDuration(draft);
  const clears = isZeroDuration(draft);
  const invalid = edited && draft.trim() !== "" && parsed === null && !clears;

  const save = () => {
    if (!edited) return onClose?.();
    if (clears || draft.trim() === "") onChange(null);
    else if (parsed !== null) onChange(parsed);
  };

  return (
    <div className="w-48" onClick={(e) => e.stopPropagation()}>
      <div className="px-3 pb-2 pt-2.5">
        <div className="flex items-center justify-between">
          <label
            className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
            htmlFor={id}
          >
            {label}
          </label>
          {shortcut && (
            <kbd className="rounded border border-border/60 px-1 font-sans text-[10px] leading-4 text-muted-foreground">
              {shortcut}
            </kbd>
          )}
        </div>
        <input
          ref={inputRef}
          id={id}
          value={draft}
          inputMode="text"
          autoComplete="off"
          placeholder="0:00"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              save();
            }
          }}
          aria-invalid={invalid}
          className={cn(
            "mt-1 w-full border-b-2 bg-transparent pb-0.5 text-lg font-semibold tabular-nums outline-none transition-colors placeholder:text-muted-foreground/40",
            invalid
              ? "border-destructive text-destructive"
              : "border-border/60 focus:border-primary"
          )}
        />
        <p
          className={cn(
            "mt-1.5 h-4 text-[11px] leading-4",
            invalid ? "text-destructive" : "text-muted-foreground"
          )}
          aria-live="polite"
        >
          {invalid
            ? "Try 45, 1:30 or 1.5h"
            : edited
              ? `${clears || !draft.trim() ? "Clear" : describeDuration(parsed!)} · ↵ to save`
              : "Type 45, 1:30 or 1.5h"}
        </p>
      </div>
      <div className="max-h-56 overflow-y-auto overscroll-contain border-t border-border/60 py-1">
        {PRESETS.map((mins) => (
          <button
            key={mins}
            type="button"
            onClick={() => onChange(mins)}
            className={cn(
              "flex w-full items-center justify-between px-3 py-1.5 text-[13px] transition-colors hover:bg-accent",
              value === mins && "font-medium text-foreground"
            )}
          >
            {presetLabel(mins)}
            {value === mins && <Check className="h-3.5 w-3.5 text-primary" />}
          </button>
        ))}
      </div>
      {value ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="w-full border-t border-border/60 px-3 py-2 text-left text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          Clear {label.toLowerCase()}
        </button>
      ) : null}
    </div>
  );
}
