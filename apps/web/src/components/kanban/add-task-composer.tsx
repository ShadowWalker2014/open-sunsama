import { usePriorityShortcut } from "@/hooks/useKeyboardShortcuts";
import * as React from "react";
import { format, isToday, isTomorrow, parse } from "date-fns";
import { ArrowDown, ArrowUp, Calendar, Clock, ListPlus } from "lucide-react";
import type { TaskPriority } from "@open-sunsama/types";
import { cn, formatDuration } from "@/lib/utils";
import { useCreateTask } from "@/hooks/useTasks";
import { useCreateSubtask } from "@/hooks/useSubtaskMutations";
import { useAddTaskPosition, usePlaceNewTask } from "@/hooks/useAddTaskPosition";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DurationPicker } from "@/components/ui/duration-picker";
import { WithShortcut } from "@/components/ui/with-shortcut";
import { PriorityIcon, PRIORITY_META } from "@/components/ui/priority-badge";
import { PriorityMenu } from "./priority-menu";
import { DatePickerPopover } from "./task-date-picker";
import { parseSubtaskTitles } from "./subtask-add-row";

interface DraftLine {
  id: number;
  title: string;
}

let nextLineId = 1;

const IS_MAC =
  typeof navigator !== "undefined" && navigator.platform.includes("Mac");
const MOD_KEY = IS_MAC ? "⌘" : "Ctrl";
const ALT_KEY = IS_MAC ? "Option" : "Alt";

export interface ComposerValues {
  title: string;
  subtasks: string[];
  estimatedMins: number | null;
  priority: TaskPriority;
}

interface AddTaskComposerProps {
  /** The day the task starts on; null adds it to the backlog. */
  scheduledDate: string | null;
  initialTitle?: string;
  /** Called after the task is added, or to dismiss. */
  onDone: () => void;
  /**
   * Saves something other than a task (an idea, say) from the same
   * composer. Without it the composer creates a task.
   */
  onSubmit?: (values: ComposerValues) => void;
  /** Hide the start-date and top/bottom chips when they don't apply. */
  showDate?: boolean;
  showPosition?: boolean;
  placeholder?: string;
  /** A quiet note on where it goes, e.g. "Adding to Ideas". */
  context?: string;
}

function dateLabel(date: string | null): string {
  if (!date) return "Backlog";
  const d = parse(date, "yyyy-MM-dd", new Date());
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "EEE, MMM d");
}

const chip =
  "flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring data-[state=open]:bg-accent data-[state=open]:text-foreground";

/**
 * Sunsama-style quick add: one line for the title and a row of quiet chips
 * for the start day, planned time, priority and whether it lands at the top
 * or bottom of the day. Enter adds the task and closes.
 */
export function AddTaskComposer({
  scheduledDate,
  initialTitle = "",
  onDone,
  onSubmit,
  showDate = true,
  showPosition = true,
  placeholder = "Task description…",
  context,
}: AddTaskComposerProps) {
  const [title, setTitle] = React.useState(initialTitle);
  const [date, setDate] = React.useState<string | null>(scheduledDate);
  const [planned, setPlanned] = React.useState<number | null>(null);
  const [priority, setPriority] = React.useState<TaskPriority>("P2");
  const [plannedOpen, setPlannedOpen] = React.useState(false);
  const [priorityOpen, setPriorityOpen] = React.useState(false);
  usePriorityShortcut(true, (value) => {
    setPriority(value);
    setPriorityOpen(false);
  });
  const [lines, setLines] = React.useState<DraftLine[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const lineRefs = React.useRef(new Map<number, HTMLInputElement>());
  // Focus moves right away when the field exists; a line that was just
  // added gets focus as soon as it renders, before the next key arrives.
  const pendingFocus = React.useRef<number | null | undefined>(undefined);
  const fieldFor = (id: number | null) =>
    id === null ? inputRef.current : lineRefs.current.get(id);
  const focusLine = (id: number | null) => {
    const el = fieldFor(id);
    if (el) el.focus();
    else pendingFocus.current = id;
  };
  React.useLayoutEffect(() => {
    if (pendingFocus.current === undefined) return;
    fieldFor(pendingFocus.current)?.focus();
    pendingFocus.current = undefined;
  });

  const { addPosition, setAddPosition } = useAddTaskPosition();
  const createTask = useCreateTask();
  const createSubtask = useCreateSubtask();
  const placeNewTask = usePlaceNewTask(date);

  const refocus = () => requestAnimationFrame(() => inputRef.current?.focus());

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onDone();
    const subtaskTitles = lines.map((l) => l.title.trim()).filter(Boolean);
    if (onSubmit) {
      onSubmit({ title: trimmed, subtasks: subtaskTitles, estimatedMins: planned, priority });
      return;
    }
    // The create is optimistic: the card shows at once, so nothing waits here.
    void createTask
      .mutateAsync({
        title: trimmed,
        scheduledDate: date ?? undefined,
        estimatedMins: planned ?? undefined,
        priority,
      })
      .then(async (task) => {
        // Explicit positions keep the typed order; the requests run in parallel.
        await Promise.all(
          subtaskTitles.map((title, position) =>
            createSubtask.mutateAsync({
              taskId: task.id,
              data: { title: title.slice(0, 500), position },
            })
          )
        );
        await placeNewTask(task.id, addPosition);
      })
      .catch(() => {
        // useCreateTask already shows the error and rolls back.
      });
  };

  const isTop = addPosition === "top";

  /** Inserts subtask lines after `afterId` (null = right under the title). */
  const insertLines = (afterId: number | null, titles: string[]) => {
    const fresh = titles.map((title) => ({ id: nextLineId++, title }));
    setLines((prev) => {
      const at = afterId === null ? 0 : prev.findIndex((l) => l.id === afterId) + 1;
      return [...prev.slice(0, at), ...fresh, ...prev.slice(at)];
    });
    focusLine(fresh[fresh.length - 1]!.id);
  };

  // A pasted list: the first line stays where it was pasted, the rest
  // become subtasks.
  const pasteLines = (
    e: React.ClipboardEvent<HTMLInputElement>,
    afterId: number | null,
    setFirst: (text: string) => void
  ) => {
    const text = e.clipboardData.getData("text");
    if (!/\r?\n/.test(text.trim())) return;
    e.preventDefault();
    const [first = "", ...rest] = parseSubtaskTitles(text);
    const el = e.currentTarget;
    const value =
      el.value.slice(0, el.selectionStart ?? el.value.length) +
      first +
      el.value.slice(el.selectionEnd ?? el.value.length);
    setFirst(value);
    if (rest.length) insertLines(afterId, rest);
  };

  const onLineKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    line: DraftLine,
    index: number
  ) => {
    // ⌥↑/⌥↓ choose top or bottom (handled by the wrapper).
    if (e.nativeEvent.isComposing || e.altKey) return;
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    } else if (e.key === "Enter") {
      e.preventDefault();
      // Enter on an empty line ends the list and adds the task.
      if (!line.title.trim()) {
        setLines((prev) => prev.filter((l) => l.id !== line.id));
        submit();
      } else {
        insertLines(line.id, [""]);
      }
    } else if (e.key === "Backspace" && !line.title) {
      e.preventDefault();
      setLines((prev) => prev.filter((l) => l.id !== line.id));
      focusLine(index > 0 ? lines[index - 1]!.id : null);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusLine(index > 0 ? lines[index - 1]!.id : null);
    } else if (e.key === "ArrowDown" && index < lines.length - 1) {
      e.preventDefault();
      focusLine(lines[index + 1]!.id);
    }
  };

  return (
    <div
      className="w-full"
      onKeyDown={(e) => {
        if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
          e.preventDefault();
          setAddPosition(e.key === "ArrowUp" ? "top" : "bottom");
        }
      }}
    >
      <input
        ref={inputRef}
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing || e.altKey) return;
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          } else if (
            (e.key === "Tab" && !e.shiftKey && title.trim()) ||
            (e.key === "Enter" && e.shiftKey)
          ) {
            // Tab or Shift+Enter starts a subtask right under the title.
            e.preventDefault();
            insertLines(null, [""]);
          } else if (e.key === "ArrowDown" && lines.length) {
            e.preventDefault();
            focusLine(lines[0]!.id);
          }
        }}
        onPaste={(e) => pasteLines(e, null, setTitle)}
        placeholder={placeholder}
        aria-label="Task title"
        maxLength={500}
        className="w-full bg-transparent px-4 pb-2 pt-3.5 text-[15px] outline-none placeholder:text-muted-foreground/60"
      />
      {lines.length > 0 && (
        <ul className="px-4 pb-1.5" aria-label="Subtasks">
          {lines.map((line, index) => (
            <li key={line.id} className="flex items-center gap-2.5 py-0.5">
              <span className="h-3.5 w-3.5 shrink-0 rounded-full border-[1.5px] border-muted-foreground/40" />
              <input
                ref={(el) => {
                  if (el) lineRefs.current.set(line.id, el);
                  else lineRefs.current.delete(line.id);
                }}
                value={line.title}
                onChange={(e) =>
                  setLines((prev) =>
                    prev.map((l) =>
                      l.id === line.id ? { ...l, title: e.target.value } : l
                    )
                  )
                }
                onKeyDown={(e) => onLineKeyDown(e, line, index)}
                onPaste={(e) =>
                  pasteLines(e, line.id, (value) =>
                    setLines((prev) =>
                      prev.map((l) => (l.id === line.id ? { ...l, title: value } : l))
                    )
                  )
                }
                placeholder="Subtask"
                aria-label={`Subtask ${index + 1}`}
                maxLength={500}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
              />
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-0.5 px-2 pb-2">
        <span className="hidden flex-1 items-center gap-1 pl-2 text-[11px] text-muted-foreground/80 sm:flex">
          {!title.trim() && !lines.length && context ? (
            context
          ) : lines.length ? (
            <>
              <Key>Enter</Key> next subtask · <Key>Enter</Key> twice or{" "}
              <Key>{MOD_KEY}</Key>
              <Key>Enter</Key> to add
            </>
          ) : title.trim() ? (
            <>
              <Key>Enter</Key> to add · <Key>Tab</Key> for subtasks
            </>
          ) : null}
        </span>
        <div className="ml-auto flex items-center gap-0.5">
          <WithShortcut label="Add subtasks" keys={["Tab"]} side="bottom">
            <button
              type="button"
              aria-label="Add subtasks"
              onClick={() => insertLines(lines.at(-1)?.id ?? null, [""])}
              className={chip}
            >
              <ListPlus className="h-3.5 w-3.5" />
              {lines.length > 0 && (
                <span className="tabular-nums text-foreground">{lines.length}</span>
              )}
            </button>
          </WithShortcut>
          {showDate && (
          <WithShortcut label="Start date" side="bottom">
            <span>
              <DatePickerPopover
                value={date}
                onChange={(d) => {
                  setDate(d);
                  refocus();
                }}
                className={cn(chip, "font-normal")}
              >
                <Calendar className="h-3.5 w-3.5" />
                {dateLabel(date)}
              </DatePickerPopover>
            </span>
          </WithShortcut>
          )}

          <Popover open={plannedOpen} onOpenChange={setPlannedOpen}>
            <PopoverTrigger asChild>
              <WithShortcut label="Planned time" side="bottom">
                <button type="button" className={cn(chip, planned && "text-foreground")}>
                  <Clock className="h-3.5 w-3.5" />
                  <span className="tabular-nums">
                    {planned ? formatDuration(planned) : "--:--"}
                  </span>
                </button>
              </WithShortcut>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0"
              align="end"
              onCloseAutoFocus={(e) => {
                e.preventDefault();
                refocus();
              }}
            >
              <DurationPicker
                value={planned}
                onChange={(mins) => {
                  setPlanned(mins);
                  setPlannedOpen(false);
                }}
                onClose={() => setPlannedOpen(false)}
              />
            </PopoverContent>
          </Popover>

          <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
            <PopoverTrigger asChild>
              <WithShortcut
                label={`${priority} · ${PRIORITY_META[priority].description}`}
                shortcut="editPriority"
                side="bottom"
              >
                <button
                  type="button"
                  aria-label={`Priority: ${priority} ${PRIORITY_META[priority].description}`}
                  className={chip}
                >
                  <PriorityIcon priority={priority} />
                  {priority !== "P2" && (
                    <span className="text-foreground">{priority}</span>
                  )}
                </button>
              </WithShortcut>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0"
              align="end"
              onCloseAutoFocus={(e) => {
                e.preventDefault();
                refocus();
              }}
            >
              <PriorityMenu
                value={priority}
                onChange={(p) => {
                  setPriority(p);
                  setPriorityOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>

          {showPosition && (
          <WithShortcut
            label={isTop ? "Adds to the top" : "Adds to the bottom"}
            keys={[ALT_KEY, isTop ? "↓" : "↑"]}
            side="bottom"
          >
            <button
              type="button"
              aria-label={isTop ? "Adding to top" : "Adding to bottom"}
              onClick={() => {
                setAddPosition(isTop ? "bottom" : "top");
                refocus();
              }}
              className={chip}
            >
              {isTop ? (
                <ArrowUp className="h-3.5 w-3.5" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5" />
              )}
            </button>
          </WithShortcut>
          )}
        </div>
      </div>
    </div>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border/70 bg-muted/40 px-1 font-sans text-[10px] font-medium leading-4 text-muted-foreground">
      {children}
    </kbd>
  );
}
