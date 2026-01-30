# Focus Mode

## Problem

Users need a distraction-free environment to concentrate on a single task. The current task modal is useful for editing, but doesn't provide an immersive focus experience with time tracking, timer controls, and a clear visual indication of progress against planned time.

## Solution

Create a full-screen Focus mode view that displays a single task with:
- Large, prominent task title (editable)
- Timer with START/STOP controls
- ACTUAL vs PLANNED time comparison
- Inline subtask management
- Rich text notes editing
- Hoverable calendar sidebar showing today's schedule
- Keyboard shortcut (Esc) to dismiss

## Technical Implementation

### 1. Database Changes

#### Add `actualMins` to Tasks Table
**File:** `packages/database/src/schema/tasks.ts`

```typescript
// Add to tasks table definition
actualMins: integer('actual_mins').default(0),
```

**Migration:** Add column `actual_mins INTEGER DEFAULT 0` to tasks table.

**Update Types:** `packages/types/src/task.ts`
```typescript
// Add to Task interface
actualMins: number | null;

// Add to UpdateTaskInput interface
actualMins?: number | null;
```

---

### 2. New Route

#### Focus Route Configuration
**File:** `apps/web/src/routeTree.gen.tsx`

```typescript
// Import the new focus page
import FocusPage from "./routes/app/focus";

// Add focus route with taskId param
const appFocusRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/focus/$taskId",
  component: FocusPage,
});

// Add to appRoute.addChildren([...])
appRoute.addChildren([
  appIndexRoute,
  appCalendarRoute,
  appSettingsRoute,
  appTasksListRoute,
  appFocusRoute, // New
]),
```

---

### 3. Focus Page Component

**File:** `apps/web/src/routes/app/focus.tsx`

#### Component Structure
```
FocusPage
├── FocusHeader (task title, priority, close button)
├── FocusTimer (timer display, START/STOP, ACTUAL vs PLANNED)
├── FocusContent
│   ├── SubtaskList (checkable, inline editing)
│   └── NotesEditor (Tiptap rich text)
└── CalendarSidebar (hover-triggered, right edge)
```

#### Key Features
- **Full-screen layout:** `fixed inset-0 z-50 bg-background`
- **Centered content:** Max-width container with generous padding
- **Large title:** Editable h1-style input, auto-save on blur
- **Esc key handler:** Global keyboard listener to navigate back

#### Data Flow
1. Extract `taskId` from route params using `useParams()`
2. Fetch task data using `useTask(taskId)` hook
3. Fetch subtasks using `useSubtasks(taskId)` hook
4. Fetch time blocks using `useTimeBlocks({ taskId })` for planned time

---

### 4. Focus Timer Component

**File:** `apps/web/src/components/focus/focus-timer.tsx`

#### Timer State Management
```typescript
interface FocusTimerState {
  isRunning: boolean;
  startedAt: Date | null;
  elapsedSeconds: number;
  accumulatedSeconds: number; // Previously accumulated time
}
```

#### Key Functions
- `useTimer(taskId)` - Custom hook for timer logic
- Persist timer state to localStorage keyed by taskId
- Update `actualMins` on task when timer stops
- Use `setInterval` for live countdown (1-second tick)

#### Display Format
```
ACTUAL: 0:05:23    PLANNED: 0:30
   [START]  /  [STOP]
```

#### Timer Controls
- **START:** Begin timing, set `isRunning: true`, record `startedAt`
- **STOP:** Pause timing, accumulate elapsed, update task `actualMins`
- **Visual indicator:** Pulsing dot when running

#### Pomodoro Option (Future Enhancement)
- Toggle in header for Pomodoro mode
- 25-minute intervals with break reminders
- Configurable intervals in settings

---

### 5. Calendar Sidebar

**File:** `apps/web/src/components/focus/calendar-sidebar.tsx`

#### Hover Trigger Zone
- Invisible trigger area on right edge: `fixed right-0 top-0 bottom-0 w-8`
- On hover, slide in sidebar from right
- Sidebar width: `w-80` (320px)
- Semi-transparent backdrop on rest of screen

#### Sidebar Content
- Today's date header
- Mini timeline view (reuse existing `Timeline` component simplified)
- List of time blocks for today
- Current time indicator

#### Animation
- Use CSS transitions or Framer Motion
- Slide in from right: `transform: translateX(100%) → translateX(0)`
- Duration: 200ms ease-out

---

### 6. Subtasks in Focus View

**File:** `apps/web/src/components/focus/focus-subtasks.tsx`

#### Features
- Reuse existing `SortableSubtaskItem` component
- Drag-and-drop reordering (existing DnD-kit setup)
- Inline add subtask with Enter key
- Check/uncheck with immediate update
- Delete with confirmation

---

### 7. Notes Editor in Focus View

**File:** `apps/web/src/components/focus/focus-notes.tsx`

#### Features
- Reuse existing `RichTextEditor` component
- Larger editing area for focus mode
- Auto-save on blur with debounce
- Support file attachments (existing functionality)

---

### 8. Update Task Context Menu

**File:** `apps/web/src/components/kanban/task-context-menu.tsx`

#### Change Focus Action
```typescript
// Replace handleFocus with navigation
import { useNavigate } from "@tanstack/react-router";

const navigate = useNavigate();

const handleFocus = () => {
  navigate({ to: "/app/focus/$taskId", params: { taskId: task.id } });
};
```

---

### 9. Keyboard Shortcuts

**File:** `apps/web/src/hooks/useKeyboardShortcuts.tsx`

#### Add Focus Mode Shortcut
```typescript
// Add to SHORTCUTS
enterFocus: {
  key: "Enter",
  description: "Enter focus mode (while hovering)",
  category: "task",
},
```

**File:** `apps/web/src/routes/app/focus.tsx`

#### Esc Key Handler
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      navigate({ to: "/app" });
    }
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [navigate]);
```

---

### 10. WebSocket Integration

**File:** `apps/web/src/hooks/useWebSocket.ts`

#### Existing Functionality
The current WebSocket setup already handles:
- `task:updated` → invalidates task queries
- `timeblock:updated` → invalidates time block queries

No additional WebSocket events needed. Timer state is local; `actualMins` updates go through standard task mutation which triggers WebSocket events.

---

### 11. API Updates

**File:** `apps/api/src/routes/tasks.ts`

#### Ensure actualMins in Updates
The existing `PATCH /tasks/:id` endpoint should already support updating `actualMins` once the database column and types are added.

**Validation:** `apps/api/src/validation/tasks.ts`
```typescript
// Add to updateTaskSchema
actualMins: z.number().int().nonnegative().optional(),
```

---

## File Structure Summary

### New Files
```
apps/web/src/
├── routes/app/focus.tsx                    # Focus mode page
├── components/focus/
│   ├── focus-timer.tsx                     # Timer component
│   ├── focus-header.tsx                    # Title, priority, close
│   ├── focus-subtasks.tsx                  # Subtask list wrapper
│   ├── focus-notes.tsx                     # Notes editor wrapper
│   ├── calendar-sidebar.tsx                # Hover calendar sidebar
│   └── index.ts                            # Barrel export
├── hooks/
│   └── useTimer.ts                         # Timer state management hook
```

### Modified Files
```
packages/database/src/schema/tasks.ts       # Add actualMins column
packages/types/src/task.ts                  # Add actualMins to types
apps/api/src/validation/tasks.ts            # Add actualMins validation
apps/web/src/routeTree.gen.tsx              # Add focus route
apps/web/src/components/kanban/
│   └── task-context-menu.tsx               # Update Focus action
apps/web/src/hooks/useKeyboardShortcuts.tsx # Add enterFocus shortcut
```

---

## Component Props & Interfaces

### FocusPage Props
```typescript
// No props - uses route params
// Extracted from: useParams({ from: "/app/focus/$taskId" })
```

### FocusTimer Props
```typescript
interface FocusTimerProps {
  taskId: string;
  plannedMins: number | null;
  actualMins: number | null;
  onActualMinsChange: (mins: number) => void;
}
```

### CalendarSidebar Props
```typescript
interface CalendarSidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}
```

### useTimer Hook
```typescript
interface UseTimerOptions {
  taskId: string;
  initialSeconds?: number;
  onStop?: (totalSeconds: number) => void;
}

interface UseTimerReturn {
  isRunning: boolean;
  elapsedSeconds: number;
  totalSeconds: number; // accumulated + elapsed
  start: () => void;
  stop: () => void;
  reset: () => void;
}
```

---

## UI/UX Details

### Focus View Layout
```
┌─────────────────────────────────────────────────────────────┐
│  [←]  Focus Mode                                    [×]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│           ┌─────────────────────────────────────┐           │
│           │                                     │           │
│           │        Complete project docs        │  ← Title  │
│           │                                     │           │
│           ├─────────────────────────────────────┤           │
│           │                                     │           │
│           │     ACTUAL: 0:05:23   PLANNED: 0:30│           │
│           │                                     │           │
│           │           [ START ]                 │  ← Timer  │
│           │                                     │           │
│           ├─────────────────────────────────────┤           │
│           │  Subtasks                           │           │
│           │  ☐ Write introduction               │           │
│           │  ☐ Add code examples                │           │
│           │  ☑ Review formatting                │           │
│           │  + Add subtask                      │           │
│           ├─────────────────────────────────────┤           │
│           │  Notes                              │           │
│           │  ┌─────────────────────────────┐    │           │
│           │  │ Rich text editor content... │    │           │
│           │  └─────────────────────────────┘    │           │
│           └─────────────────────────────────────┘           │
│                                                        [▌]  │  ← Hover zone
└─────────────────────────────────────────────────────────────┘
```

### Calendar Sidebar (on hover)
```
                                            ┌───────────────┐
                                            │ Today, Jan 30 │
                                            ├───────────────┤
                                            │  9:00 ──────  │
                                            │  10:00 ▓▓▓▓▓  │ ← Current task
                                            │  11:00 ──────  │
                                            │  12:00 ░░░░░  │ ← Other block
                                            │  1:00 ──────  │
                                            └───────────────┘
```

### Timer States
- **Idle:** Gray text, "START" button primary
- **Running:** Green pulsing indicator, "STOP" button destructive
- **Paused:** Yellow indicator, shows accumulated time, "START" resumes

### Color Theme
- Background: `bg-background` (respects light/dark mode)
- Timer running: `text-green-500` with pulse animation
- Over planned time: `text-amber-500` warning
- Significantly over: `text-red-500` alert

---

## Edge Cases

1. **Task not found:** Show error state with link back to kanban
2. **No planned time:** Display "No estimate" instead of 0:00
3. **Timer already running on another device:** WebSocket sync could conflict - use localStorage as source of truth, let user resolve
4. **Browser tab closed while timer running:** Persist `startedAt` to localStorage, calculate elapsed on return
5. **Task completed during focus:** Show completion state, offer to uncomplete or return
6. **Offline mode:** Timer continues locally, sync actualMins when online
7. **Very long sessions:** Format hours correctly (e.g., "2:15:30" not "135:30")
8. **Navigate away without stopping timer:** Prompt user or auto-pause

---

## Testing Considerations

1. **Timer accuracy:** Ensure elapsed time matches wall clock
2. **localStorage persistence:** Verify state survives page refresh
3. **Esc key handling:** Works from all focus states
4. **Subtask operations:** CRUD operations work correctly
5. **Notes auto-save:** Changes persist on blur
6. **Calendar sidebar:** Smooth hover animation
7. **Responsive behavior:** Graceful degradation on mobile (sidebar as drawer)
8. **WebSocket updates:** Real-time sync when task updated elsewhere

---

## Implementation Order

1. Database migration + types for `actualMins`
2. API validation update
3. `useTimer` hook with localStorage persistence
4. `FocusTimer` component
5. `FocusPage` component with basic layout
6. Integrate subtasks (reuse existing components)
7. Integrate notes editor (reuse existing components)
8. `CalendarSidebar` component
9. Route configuration
10. Update `TaskContextMenu` Focus action
11. Add keyboard shortcuts
12. Polish animations and transitions
