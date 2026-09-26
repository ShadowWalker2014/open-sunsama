import * as React from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubtaskAddRowProps {
  /** Called with one or more trimmed, non-empty titles. */
  onAdd: (titles: string[]) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

// Strips list markers so a pasted checklist ("- [ ] Buy milk", "1. Call") keeps just the text.
const LIST_MARKER = /^\s*(?:[-*•]\s+)?(?:\[[ xX]?\]\s+)?(?:\d+[.)]\s+)?/;

export function parseSubtaskTitles(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(LIST_MARKER, "").trim())
    .filter(Boolean);
}

/**
 * Always-visible "Add a subtask…" row. Enter adds and keeps focus so you can
 * type a whole checklist in one go; pasting several lines adds one subtask
 * per line; Escape clears the draft, then leaves the field.
 */
export const SubtaskAddRow = React.forwardRef<
  HTMLInputElement,
  SubtaskAddRowProps
>(function SubtaskAddRow(
  { onAdd, placeholder = "Add a subtask…", autoFocus, className },
  ref
) {
  const [draft, setDraft] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useImperativeHandle(ref, () => inputRef.current!, []);

  const add = (titles: string[]) => {
    setDraft("");
    if (!titles.length) return;
    onAdd(titles);
    // New rows push this field down; keep it in view inside scrolling panels.
    requestAnimationFrame(() =>
      inputRef.current?.scrollIntoView({ block: "nearest" })
    );
  };

  const commit = () => {
    const title = draft.trim();
    if (title) add([title]);
  };

  return (
    <div
      className={cn(
        "group/add -mx-2 flex min-h-8 items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors",
        "hover:bg-muted/40 focus-within:bg-muted/40",
        className
      )}
    >
      <div
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px] border-dashed transition-colors",
          "border-muted-foreground/30 text-muted-foreground/50",
          "group-focus-within/add:border-primary/60 group-focus-within/add:text-primary"
        )}
      >
        <Plus className="h-2.5 w-2.5" strokeWidth={2.5} />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={draft}
        autoFocus={autoFocus}
        aria-label="Add a subtask"
        placeholder={placeholder}
        // Lets the task modal keep Escape for clearing the draft instead of closing.
        data-escape-local={draft ? "true" : undefined}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            if (draft) {
              setDraft("");
            } else {
              e.currentTarget.blur();
            }
          }
        }}
        onPaste={(e) => {
          const text = e.clipboardData.getData("text");
          if (!/\r?\n/.test(text.trim())) return;
          e.preventDefault();
          add(parseSubtaskTitles(draft + text));
        }}
        onBlur={commit}
        className="min-w-0 flex-1 border-none bg-transparent p-0 text-sm leading-5 outline-none placeholder:text-muted-foreground/50 focus:ring-0"
      />
      {draft.trim() && (
        <kbd className="hidden shrink-0 rounded border border-border/60 px-1 font-sans text-[10px] leading-4 text-muted-foreground/70 sm:inline">
          ↵
        </kbd>
      )}
    </div>
  );
});
