# Focus Timer Shortcuts & Inline Time Editing

## Problem

Users working in focus mode need a faster way to control the timer without reaching for the mouse. Currently, starting/stopping the timer requires clicking buttons. Additionally, there's no way to manually edit actual or estimated time inline on tasks - users can only set estimated time via preset buttons, and actual time is only tracked via the focus mode timer.

## Solution

1. **Spacebar shortcut** in focus mode to toggle timer (start/pause)
2. **Register shortcut** in the keyboard shortcuts modal under "Focus Mode" category
3. **Inline time editing** for both actual and estimated time on task cards and subtasks with format like "0:15", "1:05"

## Technical Implementation

### 1. Spacebar Timer Toggle

**File:** `apps/web/src/routes/app/focus.$taskId.tsx`

Add spacebar handler to the existing keydown listener:

```typescript
// Modify existing keydown handler (line ~69-77)
React.useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ignore if typing in input/textarea/contenteditable
    if (shouldIgnoreShortcut(e)) return;

    if (e.key === "Escape") {
      navigate({ to: "/app" });
      return;
    }

    // Spacebar toggles timer
    if (e.key === " " || e.code === "Space") {
      e.preventDefault();
      toggleTimer();
    }
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [navigate, toggleTimer]);
```

**File:** `apps/web/src/components/focus/focus-timer.tsx`

Expose timer toggle function and pass to parent:

```typescript
interface FocusTimerProps {
  taskId: string;
  plannedMins: number | null;
  actualMins: number | null;
  onActualMinsChange: (mins: number) => void;
  onTimerToggle?: (isRunning: boolean) => void; // New prop
}

// Add toggle function
const toggle = React.useCallback(() => {
  if (isRunning) {
    stop();
  } else {
    start();
  }
}, [isRunning, start, stop]);

// Return toggle via ref or callback
React.useImperativeHandle(ref, () => ({ toggle }));
// OR use effect to sync
React.useEffect(() => {
  onTimerToggle?.(isRunning);
}, [isRunning, onTimerToggle]);
```

Alternatively, lift timer state up to FocusPage and pass down controls.

---

### 2. Keyboard Shortcuts Registry Update

**File:** `apps/web/src/hooks/useKeyboardShortcuts.tsx`

Add new shortcut definition and category:

```typescript
export const SHORTCUTS: Record<string, ShortcutDefinition> = {
  // ... existing shortcuts ...

  // Focus Mode shortcuts (new category)
  toggleFocusTimer: {
    key: " ",
    description: "Start/pause timer",
    category: "focus",
  },
};

// Update category labels
```

**File:** `apps/web/src/components/ui/shortcuts-modal.tsx`

Add "Focus Mode" category:

```typescript
const categoryLabels: Record<string, string> = {
  general: "General",
  navigation: "Navigation",
  task: "Task Actions",
  focus: "Focus Mode", // New
};

const categoryOrder = ["general", "navigation", "task", "focus"];
```

---

### 3. Inline Time Editing Component

**File:** `apps/web/src/components/ui/inline-time-input.tsx` (new)

Create reusable component for editing time in "H:MM" or "M:SS" format:

```typescript
interface InlineTimeInputProps {
  value: number | null; // minutes
  onChange: (mins: number | null) => void;
  placeholder?: string;
  showClear?: boolean;
  className?: string;
  label?: string; // "Actual" or "Est"
}

export function InlineTimeInput({
  value,
  onChange,
  placeholder = "—",
  showClear = true,
  className,
  label,
}: InlineTimeInputProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Format minutes to display string (e.g., 65 -> "1:05", 15 -> "0:15")
  const formatDisplay = (mins: number | null): string => {
    if (mins === null || mins === 0) return placeholder;
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  };

  // Parse input string to minutes (e.g., "1:05" -> 65, "15" -> 15, "1.5" -> 90)
  const parseInput = (input: string): number | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Handle H:MM format
    if (trimmed.includes(":")) {
      const [hours, mins] = trimmed.split(":").map(Number);
      if (!isNaN(hours) && !isNaN(mins)) {
        return hours * 60 + mins;
      }
    }

    // Handle decimal hours (e.g., "1.5" = 90 mins)
    if (trimmed.includes(".")) {
      const hours = parseFloat(trimmed);
      if (!isNaN(hours)) {
        return Math.round(hours * 60);
      }
    }

    // Handle plain minutes
    const mins = parseInt(trimmed, 10);
    return isNaN(mins) ? null : mins;
  };

  const handleClick = () => {
    setIsEditing(true);
    setInputValue(value ? formatDisplay(value) : "");
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
    const parsed = parseInput(inputValue);
    onChange(parsed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      setIsEditing(false);
      setInputValue("");
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-12 text-center text-xs tabular-nums bg-transparent",
          "border-b border-primary focus:outline-none",
          className
        )}
        autoFocus
        placeholder="0:00"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "text-xs tabular-nums hover:underline cursor-text",
        value ? "text-foreground" : "text-muted-foreground",
        className
      )}
    >
      {label && <span className="text-muted-foreground mr-1">{label}</span>}
      {formatDisplay(value)}
    </button>
  );
}
```

---

### 4. Update Task Card Time Display

**File:** `apps/web/src/components/kanban/task-card-content.tsx`

Replace duration badge with inline editable times:

```typescript
// Current duration badge (lines 212-274) becomes editable
<div className="flex items-center gap-1 text-[11px] tabular-nums">
  {/* Actual time - editable */}
  <InlineTimeInput
    value={task.actualMins}
    onChange={(mins) => onUpdateTask?.({ actualMins: mins ?? 0 })}
    placeholder="0:00"
    className="text-muted-foreground"
  />

  {/* Separator */}
  <span className="text-muted-foreground/50">/</span>

  {/* Estimated time - editable */}
  <InlineTimeInput
    value={task.estimatedMins}
    onChange={(mins) => onUpdateTask?.({ estimatedMins: mins })}
    placeholder="—"
    className={cn(
      task.actualMins && task.estimatedMins && task.actualMins > task.estimatedMins
        ? "text-amber-500"
        : "text-muted-foreground"
    )}
  />
</div>
```

Keep existing duration preset popover as secondary option (click "+" or use keyboard shortcut "E").

---

### 5. Update Focus Timer Display

**File:** `apps/web/src/components/focus/focus-timer.tsx`

Add inline editing for planned time in focus view:

```typescript
{/* Planned time - now editable */}
<div className="flex flex-col items-center gap-1">
  <span className="text-[11px] font-medium text-muted-foreground/70">
    Planned
  </span>
  <InlineTimeInput
    value={plannedMins}
    onChange={(mins) => onPlannedMinsChange?.(mins)}
    placeholder="--:--"
    className="text-3xl font-mono font-normal tabular-nums tracking-tight text-muted-foreground/60"
  />
</div>
```

Add prop to FocusTimer:

```typescript
interface FocusTimerProps {
  // ... existing props
  onPlannedMinsChange?: (mins: number | null) => void; // New
}
```

Update FocusPage to handle planned mins change:

```typescript
const handlePlannedMinsChange = React.useCallback(
  (mins: number | null) => {
    if (task) {
      updateTask.mutate({ id: task.id, data: { estimatedMins: mins } });
    }
  },
  [task, updateTask]
);
```

---

### 6. Subtask Time Support (Optional Enhancement)

**Database change needed:** Add `estimatedMins` and `actualMins` to subtasks table.

**File:** `packages/database/src/schema/subtasks.ts`

```typescript
export const subtasks = pgTable("subtasks", {
  // ... existing fields
  estimatedMins: integer("estimated_mins"),
  actualMins: integer("actual_mins").default(0),
});
```

**File:** `packages/types/src/subtask.ts`

```typescript
export interface Subtask {
  // ... existing fields
  estimatedMins: number | null;
  actualMins: number | null;
}
```

This enables time tracking at subtask level, similar to Linear's sub-issues.

---

## File Changes Summary

### New Files

| File                                               | Purpose                                |
| -------------------------------------------------- | -------------------------------------- |
| `apps/web/src/components/ui/inline-time-input.tsx` | Reusable inline time editing component |

### Modified Files

| File                                                   | Changes                                           |
| ------------------------------------------------------ | ------------------------------------------------- |
| `apps/web/src/routes/app/focus.$taskId.tsx`            | Add spacebar handler, timer toggle callback       |
| `apps/web/src/components/focus/focus-timer.tsx`        | Expose toggle, add planned time editing           |
| `apps/web/src/hooks/useKeyboardShortcuts.tsx`          | Add `toggleFocusTimer` shortcut, `focus` category |
| `apps/web/src/components/ui/shortcuts-modal.tsx`       | Add "Focus Mode" category to display              |
| `apps/web/src/components/kanban/task-card-content.tsx` | Replace duration badge with inline editing        |
| `packages/database/src/schema/subtasks.ts`             | (Optional) Add time fields                        |
| `packages/types/src/subtask.ts`                        | (Optional) Add time types                         |

---

## Flow

1. **User enters focus mode** (`/app/focus/$taskId`)
   - Timer loads with existing `actualMins` from task
   - Spacebar listener registers

2. **User presses Spacebar**
   - `shouldIgnoreShortcut()` checks not in input
   - Timer toggles (start if stopped, stop if running)
   - Visual feedback: button state changes, pulsing indicator

3. **User views shortcuts modal** (Shift + ?)
   - "Focus Mode" category shows spacebar shortcut
   - Clear indication it only works in focus view

4. **User clicks time on task card**
   - Inline input activates
   - User types "1:30" or "90" or "1.5"
   - On blur/enter, value parsed and saved
   - API mutation updates task

---

## Edge Cases

- **Spacebar in input field**: `shouldIgnoreShortcut()` returns true for inputs, textareas, contenteditable - shortcut ignored
- **Invalid time format**: `parseInput()` returns null, clearing the value; show toast warning
- **Very large values**: Cap at reasonable max (e.g., 999 minutes = 16.5 hours)
- **Negative values**: Treat as invalid, return null
- **Timer already running on page load**: Resume from localStorage state, spacebar still works
- **Focus mode unmount with timer running**: Timer persists in localStorage, actual mins saved
- **Rapid spacebar presses**: Debounce toggle (200ms) to prevent double-toggle
- **Editing while timer running**: Actual time input should be disabled or show current running time
