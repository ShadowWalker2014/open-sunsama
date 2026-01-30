# Web App Bug Fixes & UI Improvements

## Problem

The Open Sunsama web app has three categories of issues:

1. **Tasks not loading silently** - When API calls fail, users see an empty state with no error message because error states are ignored
2. **Backlog drag-drop broken** - Tasks can be dragged FROM the backlog but cannot be dropped INTO the backlog to unschedule them
3. **UI design gaps** - Current design lacks Sunsama-style polish: no scheduled time display, missing project tags, basic day column headers

## Solution

Fix bugs by adding proper error handling and `useDroppable` to the sidebar, then enhance UI components to match Sunsama's dark theme design patterns.

## Technical Implementation

### 1. Tasks Not Loading - Error State Handling

#### 1.1 Tasks List Page (`apps/web/src/routes/app/tasks.tsx`)

**Current code (line 44):**
```typescript
const { data: tasks = [], isLoading } = useSearchTasks({...});
```

**Fix:**
- Destructure `isError, error` from the hook
- Add error UI between loading and empty states

```typescript
const { data: tasks = [], isLoading, isError, error } = useSearchTasks({...});

// In JSX (after isLoading check, before empty state):
{isError && (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <AlertCircle className="h-8 w-8 text-destructive/70 mb-3" />
    <p className="text-sm font-medium text-destructive">Failed to load tasks</p>
    <p className="text-xs text-muted-foreground mt-1">
      {error instanceof Error ? error.message : "Please try again"}
    </p>
    <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
      Retry
    </Button>
  </div>
)}
```

#### 1.2 Day Column (`apps/web/src/components/kanban/day-column.tsx`)

**Current code (line 42):**
```typescript
const { data: tasks, isLoading } = useTasks({ scheduledDate: dateString });
```

**Fix:**
```typescript
const { data: tasks, isLoading, isError } = useTasks({ scheduledDate: dateString });

// In JSX (inside the loading condition area):
{isError && (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <p className="text-xs text-destructive">Failed to load</p>
  </div>
)}
```

#### 1.3 Global Error Handler (Optional Enhancement) (`apps/web/src/main.tsx`)

Add `onError` callback to QueryClient for centralized toast notifications:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ...existing options
    },
  },
});

// Add global error handler after queryClient creation:
queryClient.getQueryCache().config.onError = (error) => {
  console.error("Query error:", error);
  // Optionally show toast for all query errors
};
```

---

### 2. Backlog Drag-Drop - Enable Drop Target

#### 2.1 Add `useDroppable` to Sidebar (`apps/web/src/components/layout/sidebar.tsx`)

**Current state:** Has `SortableContext` for reordering within backlog, but no `useDroppable` for receiving drops from other columns.

**Add imports:**
```typescript
import { useDroppable } from "@dnd-kit/core";
```

**Add hook in Sidebar component (after `useTasks` call, around line 36):**
```typescript
const { setNodeRef: setDroppableRef, isOver } = useDroppable({
  id: "backlog",
  data: {
    type: "column",
    date: null, // null = unscheduled/backlog
  },
});
```

**Merge refs in the aside element (line 87):**
```typescript
<aside
  ref={setDroppableRef}
  className={cn(
    "flex h-full w-72 flex-col border-r border-border/40 bg-background/50 transition-all duration-300 ease-in-out",
    isOver && "bg-primary/5", // Visual feedback when dragging over
    className
  )}
>
```

#### 2.2 Update `findTargetColumnDate` (`apps/web/src/lib/dnd/tasks-dnd-context.tsx`)

**Current code (lines 69-82):**
```typescript
const findTargetColumnDate = React.useCallback(
  (overId: string | number | undefined): string | null => {
    if (!overId) return null;
    const overIdStr = String(overId);

    // Check if it's a column ID (day-YYYY-MM-DD)
    if (overIdStr.startsWith("day-")) {
      return overIdStr.replace("day-", "");
    }

    // Otherwise it's a task ID - return null (handled by sortable context)
    return null;
  },
  []
);
```

**Fix - Add backlog recognition:**
```typescript
const findTargetColumnDate = React.useCallback(
  (overId: string | number | undefined): string | null | "backlog" => {
    if (!overId) return null;
    const overIdStr = String(overId);

    // Check if it's the backlog
    if (overIdStr === "backlog") {
      return "backlog";
    }

    // Check if it's a column ID (day-YYYY-MM-DD)
    if (overIdStr.startsWith("day-")) {
      return overIdStr.replace("day-", "");
    }

    // Otherwise it's a task ID - return null (handled by sortable context)
    return null;
  },
  []
);
```

#### 2.3 Update `handleDragEnd` (`apps/web/src/lib/dnd/tasks-dnd-context.tsx`)

**Current code (lines 134-145):**
```typescript
if (targetDate) {
  // Moving to a different column/date
  if (task.scheduledDate !== targetDate) {
    moveTask.mutate({
      id: taskId,
      targetDate,
    });
  }
  return;
}
```

**Fix - Handle backlog drops (unschedule task):**
```typescript
if (targetDate) {
  // Handle backlog - unschedule the task
  if (targetDate === "backlog") {
    if (task.scheduledDate !== null) {
      moveTask.mutate({
        id: taskId,
        targetDate: null, // null = unscheduled
      });
    }
    return;
  }

  // Moving to a different column/date
  if (task.scheduledDate !== targetDate) {
    moveTask.mutate({
      id: taskId,
      targetDate,
    });
  }
  return;
}
```

---

### 3. UI Design Updates - Sunsama-Style Polish

Reference image shows:
- Very dark background (#0f0f10)
- Subtle gray borders
- Task cards with: scheduled time, title, duration badge, project tag (#AI Software style)
- Day columns with: large day name, date below, green progress bar for today
- Left sidebar with navigation sections

#### 3.1 Color Variable Tweaks (`apps/web/src/index.css`)

**Update dark theme (lines 29-49):**
```css
.dark {
  --background: 0 0% 6%;           /* #0f0f0f - very dark */
  --foreground: 0 0% 95%;          /* off-white text */
  --card: 0 0% 8%;                 /* slightly lighter for cards */
  --card-foreground: 0 0% 95%;
  --popover: 0 0% 10%;
  --popover-foreground: 0 0% 95%;
  --primary: 142 71% 45%;          /* green for progress/primary actions */
  --primary-foreground: 0 0% 100%;
  --secondary: 0 0% 12%;
  --secondary-foreground: 0 0% 95%;
  --muted: 0 0% 15%;
  --muted-foreground: 0 0% 55%;
  --accent: 0 0% 15%;
  --accent-foreground: 0 0% 95%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 95%;
  --border: 0 0% 18%;              /* subtle borders */
  --input: 0 0% 15%;
  --ring: 142 71% 45%;
}
```

#### 3.2 Task Card Enhancements (`apps/web/src/components/kanban/task-card-content.tsx`)

The component already supports `scheduledTime`, `tag`, and `tagColor` props but these aren't being passed. The display is already implemented.

**Update task-card.tsx to pass project/tag data when available:**
```typescript
// In SortableTaskCard and TaskCard components:
<TaskCardContent
  task={task}
  // ...existing props
  scheduledTime={task.scheduledStartTime} // If this field exists
  tag={task.project}                       // If project field exists
  tagColor={task.projectColor}             // If color field exists
/>
```

Note: This requires backend support for project/tag fields on tasks. If not available, this enhancement is deferred.

#### 3.3 Day Column Header Improvements (`apps/web/src/components/kanban/day-column.tsx`)

Already has Sunsama-style header with large day name and date below (lines 151-175). Progress bar for today is implemented.

**Minor polish:**
- Reduce opacity on past days (already done with `pastDay && "opacity-60"`)
- Add total time display (already implemented with `formatDuration`)

**Optional enhancement - add task count badge:**
```typescript
// In header section, after getDayLabel():
<div className="flex items-center gap-2">
  <span className={cn("text-base font-semibold", today ? "text-primary" : "text-foreground")}>
    {getDayLabel()}
  </span>
  {totalTasks > 0 && (
    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
      {totalTasks}
    </span>
  )}
</div>
```

#### 3.4 Sidebar Navigation Redesign (`apps/web/src/components/layout/sidebar.tsx`)

Current sidebar is just "Backlog" section. Sunsama has full navigation:
- Home, Today, Focus
- Daily Rituals section
- Weekly Rituals section  
- Backlog
- Folders

**This is a larger enhancement.** For now, focus on:
1. Adding visual drop feedback (covered in 2.1)
2. Keeping backlog functional

Full navigation redesign should be a separate PRD.

---

## Files to Modify

| File | Changes |
|------|---------|
| `apps/web/src/routes/app/tasks.tsx` | Add error state handling |
| `apps/web/src/components/kanban/day-column.tsx` | Add error state handling |
| `apps/web/src/main.tsx` | Optional: Add global error callback |
| `apps/web/src/components/layout/sidebar.tsx` | Add `useDroppable` for backlog |
| `apps/web/src/lib/dnd/tasks-dnd-context.tsx` | Handle backlog in drag-end |
| `apps/web/src/index.css` | Update dark theme colors |

---

## Implementation Order

1. **Bug fixes first** (highest impact):
   - Error handling in `tasks.tsx`
   - Error handling in `day-column.tsx`
   - Backlog droppable in `sidebar.tsx`
   - Backlog handling in `tasks-dnd-context.tsx`

2. **UI polish** (after bugs are fixed):
   - Color variable updates in `index.css`
   - Optional: task count badges in day columns

---

## Edge Cases

- **Empty backlog drop** - When backlog is empty and collapsed, drops should still work (need to ensure collapsed state also has droppable)
- **Error retry** - Refetch function must be destructured and passed to retry button
- **Task already in backlog** - Dropping a backlog task into backlog should be a no-op (check `task.scheduledDate !== null` before calling mutate)
- **Optimistic updates** - Error handling shouldn't break existing optimistic update patterns in `useReorderTasks`
- **Color contrast** - New dark theme colors must maintain sufficient contrast ratios (WCAG AA)

---

## Testing Checklist

- [ ] Tasks page shows error state when API fails
- [ ] Day columns show error state when API fails
- [ ] Retry button refetches data successfully
- [ ] Can drag task from day column to backlog (task becomes unscheduled)
- [ ] Can drag task from backlog to day column (task becomes scheduled)
- [ ] Backlog shows visual feedback (bg change) when dragging over
- [ ] Collapsed backlog still accepts drops
- [ ] Dark theme has correct darker background
- [ ] All text remains readable with new colors
