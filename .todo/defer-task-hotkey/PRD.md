# Defer Task to Tomorrow Keyboard Shortcut

## Problem

Users cannot quickly defer a task to the next day using a keyboard shortcut. Currently, moving tasks requires drag-and-drop or opening the task detail modal, which is slow for quick rescheduling workflows.

## Solution

Add a 'D' key shortcut that, when hovering over a task card, defers the task to tomorrow relative to its current scheduled date (or today if unscheduled).

## Technical Implementation

### Components

1. **Shortcut Definition** (`apps/web/src/hooks/useKeyboardShortcuts.tsx`)
   - Add `deferToTomorrow` shortcut definition to `SHORTCUTS` object
   - Key: `d` (no modifiers - simple 'd' key)
   - Category: `task`
   - Description: "Defer to tomorrow (while hovering)"

2. **Shortcut Handler** (`apps/web/src/components/task-shortcuts-handler.tsx`)
   - Add handler for `deferToTomorrow` shortcut
   - Calculate tomorrow based on task's `scheduledDate` or today if null
   - Use existing `useMoveTask` hook to update the task
   - Show toast confirmation with task title

### Flow

1. User hovers over task card (sets `hoveredTask` via `useHoveredTask`)
2. User presses 'D' key
3. `TaskShortcutsHandler` receives keydown event
4. Handler checks `shouldIgnoreShortcut()` (skip if in input/textarea)
5. Handler matches against `SHORTCUTS.deferToTomorrow`
6. Calculate target date:
   - If `hoveredTask.scheduledDate` exists: `addDays(parseISO(scheduledDate), 1)`
   - If null: `addDays(new Date(), 1)` (tomorrow from today)
7. Call `moveTask.mutate({ id, targetDate: format(nextDay, 'yyyy-MM-dd') })`
8. Show toast: "Deferred to tomorrow" with date

### Key Logic (date calculation)

```typescript
const currentDate = hoveredTask.scheduledDate
  ? parseISO(hoveredTask.scheduledDate)
  : startOfDay(new Date());
const tomorrow = addDays(currentDate, 1);
const targetDate = format(tomorrow, "yyyy-MM-dd");
```

### Existing Patterns to Follow

- `deferToNextWeek` shortcut (line 165-179 in task-shortcuts-handler.tsx)
- `moveToBacklog` shortcut (line 149-163 in task-shortcuts-handler.tsx)
- Both use `moveTask.mutate()` and show toast notifications

## Edge Cases

- **Task already in backlog**: Defer to tomorrow relative to today
- **User typing in input**: `shouldIgnoreShortcut()` already handles this
- **No hovered task**: Early return, shortcut does nothing
- **Task in focus mode**: TaskShortcutsHandler not rendered there; focus mode has own shortcuts
- **Conflict with Cmd+D (duplicate)**: No conflict - 'D' alone is defer, 'Cmd+D' is duplicate
