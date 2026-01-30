# Mobile Web Responsive Redesign

## Problem

The current web app has significant mobile UX issues:

1. **Kanban Board** - Uses horizontal scroll with snap, which is awkward on mobile. Should be a vertical scrollable task list like Sunsama mobile.
2. **Settings Page** - Completely broken on mobile due to fixed 192px sidebar that doesn't collapse.
3. **Calendar Panel** - Hidden on mobile (`xl:flex`) with no alternative way to access it.
4. **Bottom Navigation** - Has 4 tabs (Board, Tasks, Calendar, Settings) but should have 3 tabs (Tasks, Calendar, More) matching Sunsama pattern.
5. **Task Cards** - Not optimized for mobile touch interactions; metadata not visible enough.
6. **No "More" Menu** - Missing the grouped settings/rituals menu that Sunsama mobile provides.

## Solution

Implement a complete mobile-first redesign for screens below `lg:` breakpoint (1024px), matching Sunsama's mobile app UX patterns.

## Technical Implementation

### 1. Mobile Task List View (`apps/web/src/components/mobile/task-list-view.tsx`)

**Replaces horizontal kanban on mobile with vertical scrollable task list.**

```tsx
interface MobileTaskListViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onTaskClick: (task: Task) => void;
}
```

**Layout:**
- Sticky header with date ("Friday January 30") and total time badge ("10:35")
- Date navigation (swipe or tap arrows)
- Vertical scrollable list of task cards
- Blue FAB button (bottom-right) for adding tasks
- Bottom padding for navigation bar

**Header design:**
```
┌──────────────────────────────────────────────┐
│  Friday January 30                    10:35  │
│  ◀  Today  ▶                                 │
└──────────────────────────────────────────────┘
```

**Key functions:**
- `useMobileTaskList()` - Hook for fetching tasks for selected date
- Date swipe gesture support via touch events
- Pull-to-refresh pattern

---

### 2. Mobile Task Card (`apps/web/src/components/mobile/mobile-task-card.tsx`)

**Touch-optimized task card for mobile list view.**

```tsx
interface MobileTaskCardProps {
  task: Task;
  subtasks?: Subtask[];
  onToggleComplete: () => void;
  onClick: () => void;
}
```

**Layout:**
```
┌──────────────────────────────────────────────┐
│  ○  Task title that can wrap to            0:30 │
│     multiple lines                              │
│     ─────────────────────────────────────────   │
│     2 subtasks • Jan 30 • #work                 │
└──────────────────────────────────────────────┘
```

**Design:**
- Large circular checkbox (20px) on left
- Task title (multi-line allowed, max 3 lines)
- Metadata row: subtask count, date info, channel/tag
- Time estimate badge on right (e.g., "0:30", "1:00")
- Touch target minimum 48px height
- Swipe actions: left to complete, right to reschedule

---

### 3. Mobile Calendar View (`apps/web/src/components/mobile/mobile-calendar-view.tsx`)

**Full-width single day timeline view.**

```tsx
interface MobileCalendarViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onBlockClick: (block: TimeBlock) => void;
  onTimeSlotClick: (start: Date, end: Date) => void;
}
```

**Layout:**
```
┌──────────────────────────────────────────────┐
│  ☰  Friday, January 30                       │
└──────────────────────────────────────────────┘
│ 06:00                                        │
│ ───────────────────────────────────────────  │
│ 07:00                                        │
│ ┌────────────────────────────────────────┐   │
│ │ Morning routine            7:00-8:00   │   │
│ └────────────────────────────────────────┘   │
│ 08:00                                        │
│ ─────────────────────────────────────────────│  ← Current time indicator (red)
│ 09:00                                        │
└──────────────────────────────────────────────┘
```

**Features:**
- Hamburger menu opens side drawer with unscheduled tasks
- Full-width timeline (00:00 to 24:00)
- Current time indicator (red horizontal line)
- Time blocks rendered inline
- Tap empty slot to create time block
- Auto-scroll to current time on load

---

### 4. Mobile More Menu (`apps/web/src/components/mobile/mobile-more-menu.tsx`)

**Grouped settings list matching Sunsama mobile.**

```tsx
interface MobileMoreMenuProps {
  onNavigate: (path: string) => void;
}
```

**Sections:**
```
RITUALS
├── Daily planning (icon: Sunrise)
├── Daily highlights (icon: Star)
└── Daily shutdown (icon: Moon)

SETTINGS
├── Profile (icon: User)
├── Appearance (icon: Palette)
├── Notifications (icon: Bell)
└── Task Settings (icon: ListTodo)

ADVANCED
├── API Keys (icon: Key)
└── MCP Configuration (icon: Terminal)

OTHER
├── Keyboard shortcuts (icon: Command)
└── Log out (icon: LogOut)
```

**Design:**
- Clean grouped list with section headers
- Each item has icon + label
- Chevron indicator for navigation items
- Toggle switches for boolean settings
- Full-width touch targets

---

### 5. Mobile Bottom Navigation (`apps/web/src/components/layout/mobile-bottom-nav.tsx`)

**Update existing bottom nav to 3 tabs.**

**Current → New:**
```
[Board] [Tasks] [Calendar] [Settings]
           ↓
[Tasks] [Calendar] [More]
```

**Design:**
- 3 tabs with icons
- Active tab has pill-shaped background (like iOS tab bar)
- Fixed at bottom with safe area padding
- Touch targets: 64px width, 56px height minimum

```tsx
const navItems = [
  { href: "/app", icon: ListTodo, label: "Tasks" },
  { href: "/app/calendar", icon: Calendar, label: "Calendar" },
  { href: "/app/more", icon: MoreHorizontal, label: "More" },
];
```

---

### 6. Mobile Settings Page (`apps/web/src/routes/app/settings.tsx`)

**Fix broken mobile layout.**

**Changes:**
- Remove fixed 192px sidebar on mobile
- Use full-width tabs or accordion pattern
- Sheet-based navigation for sections

**Mobile Layout:**
```
┌──────────────────────────────────────────────┐
│  ← Settings                                  │
└──────────────────────────────────────────────┘
│  Profile                                   > │
│  ─────────────────────────────────────────── │
│  Security                                  > │
│  ─────────────────────────────────────────── │
│  Appearance                                > │
│  ─────────────────────────────────────────── │
│  Tasks                                     > │
│  ─────────────────────────────────────────── │
│  Notifications                             > │
│  ─────────────────────────────────────────── │
│  API Keys                                  > │
│  ─────────────────────────────────────────── │
│  MCP                                       > │
└──────────────────────────────────────────────┘
```

When tapped, each section opens as a sheet from the right.

---

### 7. Mobile FAB Button (`apps/web/src/components/mobile/mobile-fab.tsx`)

**Floating action button for quick task creation.**

```tsx
interface MobileFabProps {
  onClick: () => void;
}
```

**Design:**
- Blue circular button (56px diameter)
- Plus icon (24px)
- Position: bottom-right, 16px margin
- Above bottom navigation (with safe area)
- Shadow and press state
- Matches Sunsama's blue FAB

---

### 8. Routing Updates (`apps/web/src/routes/`)

**Add new route for More menu:**

```
apps/web/src/routes/app/more.tsx  (NEW)
```

**Update index.tsx:**
- Conditionally render `MobileTaskListView` or `KanbanBoard` based on viewport
- Use `useMediaQuery` hook or CSS-only approach

---

### 9. New Hook: `useIsMobile` (`apps/web/src/hooks/useIsMobile.ts`)

**Responsive breakpoint detection hook.**

```tsx
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mq.matches);
    
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  
  return isMobile;
}
```

---

## File Changes Summary

### New Files
| Path | Purpose |
|------|---------|
| `apps/web/src/components/mobile/task-list-view.tsx` | Mobile task list replacing kanban |
| `apps/web/src/components/mobile/mobile-task-card.tsx` | Touch-optimized task card |
| `apps/web/src/components/mobile/mobile-calendar-view.tsx` | Full-width calendar timeline |
| `apps/web/src/components/mobile/mobile-more-menu.tsx` | Grouped settings menu |
| `apps/web/src/components/mobile/mobile-fab.tsx` | Floating action button |
| `apps/web/src/components/mobile/index.ts` | Mobile component exports |
| `apps/web/src/routes/app/more.tsx` | More menu route |
| `apps/web/src/hooks/useIsMobile.ts` | Mobile breakpoint hook |

### Modified Files
| Path | Changes |
|------|---------|
| `apps/web/src/components/layout/mobile-bottom-nav.tsx` | Update to 3 tabs with pill style |
| `apps/web/src/routes/app/index.tsx` | Conditional mobile/desktop view |
| `apps/web/src/routes/app/calendar.tsx` | Add mobile calendar view |
| `apps/web/src/routes/app/settings.tsx` | Fix mobile layout, add sheet navigation |
| `apps/web/src/components/layout/header.tsx` | Hide on mobile (use bottom nav) |
| `apps/web/src/routes/app.tsx` | Adjust layout for mobile |

---

## Implementation Flow

1. **Create mobile components** → Task list, calendar, more menu, FAB
2. **Update bottom nav** → 3 tabs with new design
3. **Add useIsMobile hook** → Breakpoint detection
4. **Modify routes** → Conditional rendering
5. **Fix settings page** → Sheet-based navigation on mobile
6. **Update header** → Hide on mobile
7. **Test all breakpoints** → Ensure smooth transitions at 1024px

---

## Edge Cases

- **Orientation changes** - Handle landscape mode gracefully
- **Safe areas** - iOS notch and home indicator
- **Touch gestures** - Swipe to complete, pull to refresh
- **Offline state** - Show cached data with sync indicator
- **Deep links** - Maintain URL state on mobile views
- **Keyboard** - Auto-dismiss on scroll, show when editing
- **Drag and drop** - Use long-press to initiate on mobile

---

## Design Tokens

```css
/* Mobile-specific spacing */
--mobile-header-height: 56px;
--mobile-bottom-nav-height: 56px;
--mobile-safe-area-bottom: env(safe-area-inset-bottom, 0px);
--mobile-fab-size: 56px;
--mobile-fab-margin: 16px;

/* Touch targets */
--touch-target-min: 44px;
--touch-target-comfortable: 48px;

/* Task card */
--task-card-min-height: 64px;
--task-card-checkbox-size: 20px;
--task-card-padding: 12px 16px;
```
