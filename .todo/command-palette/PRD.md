# Command Palette Enhancement

## Problem
The current keyboard shortcuts and search functionality have two significant limitations:

1. **Keyboard shortcuts only work on the tasks page** - The `KeyboardShortcutsHandler` component is rendered inside `TasksPage` (`apps/web/src/routes/app/index.tsx`), so shortcuts like `Cmd+K`, `?`, `A` (add task) don't work on `/app/calendar`, `/app/settings`, or any other routes.

2. **Cmd+K is just task search, not a command palette** - Modern productivity apps (VS Code, Linear, Raycast) have command palettes that let users navigate anywhere, execute actions, and search content—all from one interface. The current implementation only searches tasks.

## Solution
Transform the search modal into a full command palette with two-tier architecture:

1. **Global shortcuts handler** - Move non-task-specific shortcuts to `app.tsx` layout so they work everywhere
2. **Command palette** - Enhance `TaskSearchModal` to show navigations, actions, and task search in one unified interface

## Technical Implementation

### Architecture Overview

```
Current:
┌─────────────────────────────────────────┐
│ AppLayout (app.tsx)                     │
│  └─ TaskSearchModal (only searches)     │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │ TasksPage (routes/app/index.tsx) │   │
│  │  └─ KeyboardShortcutsHandler     │   │  ← Shortcuts only work here
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘

After:
┌─────────────────────────────────────────┐
│ AppLayout (app.tsx)                     │
│  ├─ GlobalShortcutsHandler              │  ← Works everywhere
│  └─ CommandPalette (full features)      │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │ TasksPage (routes/app/index.tsx) │   │
│  │  └─ TaskShortcutsHandler         │   │  ← Task-specific only
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Components

1. **GlobalShortcutsHandler** (`apps/web/src/components/global-shortcuts-handler.tsx`)
   - Handles shortcuts that work everywhere: `Cmd+K`, `?`, `A` (add task), etc.
   - Renders nothing (event listener only)
   - Uses `useLocation()` to conditionally enable/disable certain shortcuts

2. **TaskShortcutsHandler** (`apps/web/src/components/task-shortcuts-handler.tsx`)
   - Handles task-specific shortcuts: `C` (complete), `Cmd+Delete`, `E` (estimate), `Z` (backlog), move up/down
   - Only active when `hoveredTask` is set (requires being on tasks page)
   - Extracted from current `KeyboardShortcutsHandler`

3. **CommandPalette** (`apps/web/src/components/command-palette/command-palette.tsx`)
   - Replaces `TaskSearchModal`
   - Shows command groups when input is empty
   - Filters commands + searches tasks when user types
   - Keyboard navigable with visual feedback

4. **Command Registry** (`apps/web/src/components/command-palette/commands.ts`)
   - Centralized definition of all commands
   - Each command has: `id`, `label`, `keywords`, `icon`, `action`, `shortcut` (optional)
   - Groups: Navigation, Actions, Theme

### Command Palette Structure

```typescript
// apps/web/src/components/command-palette/commands.ts

interface Command {
  id: string;
  label: string;
  keywords: string[];  // For fuzzy search
  icon: LucideIcon;
  group: 'navigation' | 'actions' | 'theme';
  shortcut?: string;   // Display only
  action: () => void;  // Execute on select
}

const COMMANDS: Command[] = [
  // Navigation
  { id: 'go-tasks', label: 'Go to Tasks Board', keywords: ['tasks', 'kanban', 'board', 'home'], icon: LayoutList, group: 'navigation', action: () => navigate('/app') },
  { id: 'go-calendar', label: 'Go to Calendar', keywords: ['calendar', 'schedule', 'timeline', 'time'], icon: Calendar, group: 'navigation', action: () => navigate('/app/calendar') },
  { id: 'go-settings', label: 'Go to Settings', keywords: ['settings', 'preferences', 'config'], icon: Settings, group: 'navigation', action: () => navigate('/app/settings') },
  { id: 'go-api-keys', label: 'Go to API Keys', keywords: ['api', 'keys', 'tokens', 'developer'], icon: Key, group: 'navigation', action: () => navigate('/app/settings?tab=api') },
  
  // Actions
  { id: 'add-task', label: 'Add New Task', keywords: ['create', 'new', 'task', 'add'], icon: Plus, group: 'actions', shortcut: 'A', action: openAddTaskModal },
  { id: 'show-shortcuts', label: 'Show Keyboard Shortcuts', keywords: ['shortcuts', 'keys', 'hotkeys', 'help'], icon: Keyboard, group: 'actions', shortcut: '?', action: openShortcutsModal },
  
  // Theme
  { id: 'toggle-theme', label: 'Toggle Dark/Light Mode', keywords: ['theme', 'dark', 'light', 'mode', 'appearance'], icon: Moon, group: 'theme', action: toggleTheme },
];
```

### UI Design

**Empty State (no query)**:
```
┌─────────────────────────────────────────────┐
│ 🔍 Type a command or search tasks...        │
├─────────────────────────────────────────────┤
│ NAVIGATION                                  │
│   📋 Go to Tasks Board                      │
│   📅 Go to Calendar                         │
│   ⚙️ Go to Settings                          │
│   🔑 Go to API Keys                         │
├─────────────────────────────────────────────┤
│ ACTIONS                                     │
│   ➕ Add New Task                      A    │
│   ⌨️ Show Keyboard Shortcuts           ?    │
├─────────────────────────────────────────────┤
│ THEME                                       │
│   🌙 Toggle Dark/Light Mode                 │
├─────────────────────────────────────────────┤
│ ↑↓ navigate  ↵ select  esc close            │
└─────────────────────────────────────────────┘
```

**With Query "cal"**:
```
┌─────────────────────────────────────────────┐
│ 🔍 cal                                      │
├─────────────────────────────────────────────┤
│ COMMANDS                                    │
│ ▶ 📅 Go to Calendar                         │  ← highlighted
├─────────────────────────────────────────────┤
│ TASKS                                       │
│   ☐ Calendar integration meeting (P1)       │
│   ☐ Review calendar API endpoints           │
├─────────────────────────────────────────────┤
│ ↑↓ navigate  ↵ select  esc close            │
└─────────────────────────────────────────────┘
```

### File Changes

#### 1. New Files

| File | Purpose |
|------|---------|
| `apps/web/src/components/command-palette/command-palette.tsx` | Main command palette component |
| `apps/web/src/components/command-palette/commands.ts` | Command definitions and registry |
| `apps/web/src/components/command-palette/command-item.tsx` | Individual command row component |
| `apps/web/src/components/command-palette/index.ts` | Barrel export |
| `apps/web/src/components/global-shortcuts-handler.tsx` | Global keyboard shortcuts |
| `apps/web/src/components/task-shortcuts-handler.tsx` | Task-specific shortcuts |

#### 2. Modified Files

| File | Changes |
|------|---------|
| `apps/web/src/routes/app.tsx` | Add `GlobalShortcutsHandler`, replace `TaskSearchModal` with `CommandPalette` |
| `apps/web/src/routes/app/index.tsx` | Replace `KeyboardShortcutsHandler` with `TaskShortcutsHandler` |
| `apps/web/src/hooks/useKeyboardShortcuts.tsx` | Split shortcuts into global vs task categories |
| `apps/web/src/hooks/useSearch.tsx` | Rename to `useCommandPalette.tsx` or extend with command state |

#### 3. Deleted Files

| File | Reason |
|------|--------|
| `apps/web/src/components/keyboard-shortcuts-handler.tsx` | Split into two separate handlers |
| `apps/web/src/components/search/task-search-modal.tsx` | Replaced by command palette |

### Flow

1. **User presses Cmd+K** (anywhere in app)
   → `GlobalShortcutsHandler` catches event
   → Calls `openCommandPalette()` from context
   → `CommandPalette` modal opens with default commands shown

2. **User types "cal"**
   → Fuzzy filter commands by label + keywords
   → Debounced task search API call
   → Render matching commands first, then tasks

3. **User navigates with ↑/↓**
   → Update `selectedIndex` state
   → Scroll active item into view
   → Visual highlight on selected item

4. **User presses Enter**
   → If command selected: execute `action()`, close palette
   → If task selected: open `TaskModal` with that task

5. **User on tasks page hovers a task, presses C**
   → `TaskShortcutsHandler` catches event (has hoveredTask)
   → Toggles task completion

### Implementation Details

#### Fuzzy Search for Commands

```typescript
// Simple fuzzy match - command matches if all query chars appear in order
function fuzzyMatch(query: string, text: string): boolean {
  const lowerQuery = query.toLowerCase();
  const lowerText = text.toLowerCase();
  
  let queryIndex = 0;
  for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIndex]) {
      queryIndex++;
    }
  }
  return queryIndex === lowerQuery.length;
}

// Match against label and keywords
function commandMatches(command: Command, query: string): boolean {
  if (fuzzyMatch(query, command.label)) return true;
  return command.keywords.some(kw => fuzzyMatch(query, kw));
}
```

#### Shortcut Categories

```typescript
// apps/web/src/hooks/useKeyboardShortcuts.tsx

// Global shortcuts - work everywhere
export const GLOBAL_SHORTCUTS = {
  search: { key: 'k', modifiers: { cmd: true }, description: 'Open command palette' },
  showShortcuts: { key: '?', modifiers: { shift: true }, description: 'Show keyboard shortcuts' },
  addTask: { key: 'a', description: 'Add new task' },
};

// Task shortcuts - require hoveredTask
export const TASK_SHORTCUTS = {
  completeTask: { key: 'c', description: 'Complete task' },
  deleteTask: { key: 'Backspace', modifiers: { cmd: true }, description: 'Delete task' },
  editEstimate: { key: 'e', description: 'Edit time estimate' },
  moveToBacklog: { key: 'z', description: 'Move to backlog' },
  moveToTop: { key: 'ArrowUp', modifiers: { cmd: true, shift: true }, description: 'Move to top' },
  moveToBottom: { key: 'ArrowDown', modifiers: { cmd: true, shift: true }, description: 'Move to bottom' },
};

// Navigation shortcuts - only on tasks page
export const NAVIGATION_SHORTCUTS = {
  focusToday: { key: ' ', modifiers: { shift: true }, description: 'Focus on Today' },
  nextDay: { key: 'ArrowRight', modifiers: { shift: true }, description: 'Go to next day' },
  previousDay: { key: 'ArrowLeft', modifiers: { shift: true }, description: 'Go to previous day' },
};
```

#### Command Palette Context

```typescript
// apps/web/src/hooks/useCommandPalette.tsx

interface CommandPaletteContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  
  // For actions triggered from commands
  addTaskModalOpen: boolean;
  setAddTaskModalOpen: (open: boolean) => void;
}
```

#### Settings Tab Deep Link

For "Go to API Keys" command to open settings with API tab active:

```typescript
// Option 1: URL param
navigate('/app/settings?tab=api');

// In SettingsPage, read from URL:
const [searchParams] = useSearchParams();
const initialTab = searchParams.get('tab') as SettingsTab ?? 'profile';
const [activeTab, setActiveTab] = React.useState<SettingsTab>(initialTab);
```

### Keyboard Shortcuts Update

Update the shortcuts modal to reflect the new organization:

```typescript
const categoryLabels = {
  global: "Global",       // Work everywhere
  navigation: "Navigation", // Tasks page day navigation
  task: "Task Actions",   // Require hovered task
};
```

## Edge Cases

- **Modal already open**: If Cmd+K pressed while command palette is open, close it (toggle behavior)
- **Input focus**: When palette opens, always focus input; Escape closes even from input
- **No results**: Show "No commands or tasks found" with option to create task
- **Long task titles**: Truncate with ellipsis, show full on hover
- **Rapid typing**: Debounce task search (150ms) but filter commands instantly (client-side)
- **Theme toggle**: Should work even on settings page (use `useTheme()` hook)
- **Navigation while loading**: Don't wait for task search to complete; navigate immediately
- **Keyboard navigation wrapping**: Arrow down on last item goes to first, and vice versa

## Migration Steps

1. **Create command palette components**
   - Build `CommandPalette`, `commands.ts`, `command-item.tsx`
   - Test in isolation before integrating

2. **Split keyboard shortcuts**
   - Create `GlobalShortcutsHandler` with global shortcuts only
   - Create `TaskShortcutsHandler` with task shortcuts only
   - Keep existing `KeyboardShortcutsHandler` working during transition

3. **Update app layout**
   - Add `GlobalShortcutsHandler` to `app.tsx`
   - Replace `TaskSearchModal` with `CommandPalette`
   - Update `SearchProvider` to `CommandPaletteProvider`

4. **Update tasks page**
   - Replace `KeyboardShortcutsHandler` with `TaskShortcutsHandler`
   - Keep navigation shortcuts in `TaskShortcutsHandler` (they need kanban context)

5. **Update shortcuts modal**
   - Update category labels
   - Ensure all shortcuts are documented correctly

6. **Delete old files**
   - Remove `keyboard-shortcuts-handler.tsx`
   - Remove `task-search-modal.tsx`
   - Update any imports

7. **Test all pages**
   - Verify Cmd+K works on `/app`, `/app/calendar`, `/app/settings`
   - Verify task shortcuts only work when hovering on tasks page
   - Verify navigation commands work from all pages
