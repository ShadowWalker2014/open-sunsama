# Context-Aware MCP Commands for Command Palette

## Problem

The current command palette shows ALL commands regardless of context, creating cognitive overload. Users must scan through navigation, theme, and action commands even when they have a task hovered and just want to complete it. Additionally, MCP setup (copying configs for Cursor/Claude) requires navigating to Settings > MCP tab—too many clicks for power users who want AI integration.

**Current issues:**
1. **No context awareness** - Commands don't adapt to hoveredTask, currentView, or selectedDate
2. **Command overload** - All 9 commands shown always, no prioritization
3. **MCP setup friction** - Copying config requires 3+ clicks to settings page
4. **No intelligent grouping** - Commands sorted by category, not relevance

## Solution

Transform the command palette into a context-aware interface that:
1. Shows **max 6 commands by default** based on current context
2. Surfaces **task actions** when a task is hovered
3. Adds **MCP quick actions** for AI setup (searchable via "mcp", "ai", "cursor")
4. Uses **progressive disclosure** - type to reveal more commands

## Technical Implementation

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│ CommandPalette                                                       │
│  ├─ CommandContext (extended)                                        │
│  │   ├─ hoveredTask: Task | null  ← from HoveredTaskContext         │
│  │   ├─ currentView: 'tasks' | 'calendar' | 'settings'              │
│  │   └─ selectedDate: string | null                                 │
│  │                                                                   │
│  ├─ getContextualCommands(context, query)                           │
│  │   ├─ If hoveredTask → Task actions first                         │
│  │   ├─ If query matches "mcp"/"ai" → MCP commands                  │
│  │   └─ Otherwise → View-specific + global commands                 │
│  │                                                                   │
│  └─ Commands Registry (extended)                                     │
│      ├─ TaskCommands (requires hoveredTask)                         │
│      ├─ MCPCommands (setup actions)                                 │
│      ├─ ViewCommands (per-view)                                     │
│      └─ GlobalCommands (always available)                           │
└─────────────────────────────────────────────────────────────────────┘
```

### Components

#### 1. Extended CommandContext (`apps/web/src/components/command-palette/commands.ts`)

```typescript
export interface CommandContext {
  // Existing
  navigate: NavigateFn;
  setThemeMode: (mode: ThemeMode) => void;
  currentThemeMode: ThemeMode;
  openAddTask: () => void;
  openShortcuts: () => void;
  closeSearch: () => void;
  
  // NEW: Context awareness
  hoveredTask: Task | null;
  currentView: 'tasks' | 'calendar' | 'settings';
  selectedDate: string | null;
  
  // NEW: Task actions
  completeTask: (id: string) => void;
  deleteTask: (id: string) => void;
  duplicateTask: (task: Task) => void;
  deferTask: (id: string, date: string | null) => void;
  scheduleTask: (id: string) => void;
  
  // NEW: MCP actions
  copyMcpConfig: (client: 'cursor' | 'claude' | 'vscode' | 'windsurf') => void;
  copyApiKey: () => void;
}
```

#### 2. Command Types (`apps/web/src/components/command-palette/commands.ts`)

```typescript
export interface Command {
  id: string;
  title: string;
  shortcut?: string;
  category: 'task' | 'mcp' | 'navigation' | 'actions' | 'settings';
  keywords: string[];
  icon: string;
  action: (ctx: CommandContext) => void;
  
  // NEW: Context requirements
  requiresHoveredTask?: boolean;      // Only show when task is hovered
  showInViews?: ('tasks' | 'calendar' | 'settings')[];  // View-specific
  priority?: number;                   // Lower = more prominent (0-100)
}
```

#### 3. Task Commands (NEW)

```typescript
// apps/web/src/components/command-palette/task-commands.ts

export const TASK_COMMANDS: Command[] = [
  {
    id: "complete-task",
    title: "Complete Task",
    shortcut: "C",
    category: "task",
    keywords: ["complete", "done", "finish", "check"],
    icon: "CheckCircle2",
    requiresHoveredTask: true,
    priority: 0,
    action: (ctx) => {
      if (ctx.hoveredTask) {
        ctx.completeTask(ctx.hoveredTask.id);
        ctx.closeSearch();
      }
    },
  },
  {
    id: "defer-task",
    title: "Defer to Next Week",
    shortcut: "⇧Z",
    category: "task",
    keywords: ["defer", "postpone", "next week", "later"],
    icon: "CalendarArrowDown",
    requiresHoveredTask: true,
    priority: 1,
    action: (ctx) => {
      if (ctx.hoveredTask) {
        const nextMonday = getNextMonday();
        ctx.deferTask(ctx.hoveredTask.id, nextMonday);
        ctx.closeSearch();
      }
    },
  },
  {
    id: "move-to-backlog",
    title: "Move to Backlog",
    shortcut: "Z",
    category: "task",
    keywords: ["backlog", "unschedule", "remove date"],
    icon: "Inbox",
    requiresHoveredTask: true,
    priority: 2,
    action: (ctx) => {
      if (ctx.hoveredTask) {
        ctx.deferTask(ctx.hoveredTask.id, null);
        ctx.closeSearch();
      }
    },
  },
  {
    id: "add-to-calendar",
    title: "Add to Calendar",
    shortcut: "X",
    category: "task",
    keywords: ["schedule", "calendar", "time block"],
    icon: "CalendarPlus",
    requiresHoveredTask: true,
    priority: 3,
    action: (ctx) => {
      if (ctx.hoveredTask) {
        ctx.scheduleTask(ctx.hoveredTask.id);
        ctx.closeSearch();
      }
    },
  },
  {
    id: "duplicate-task",
    title: "Duplicate Task",
    shortcut: "⌘D",
    category: "task",
    keywords: ["duplicate", "copy", "clone"],
    icon: "Copy",
    requiresHoveredTask: true,
    priority: 4,
    action: (ctx) => {
      if (ctx.hoveredTask) {
        ctx.duplicateTask(ctx.hoveredTask);
        ctx.closeSearch();
      }
    },
  },
  {
    id: "delete-task",
    title: "Delete Task",
    shortcut: "⌘⌫",
    category: "task",
    keywords: ["delete", "remove", "trash"],
    icon: "Trash2",
    requiresHoveredTask: true,
    priority: 5,
    action: (ctx) => {
      if (ctx.hoveredTask && confirm(`Delete "${ctx.hoveredTask.title}"?`)) {
        ctx.deleteTask(ctx.hoveredTask.id);
        ctx.closeSearch();
      }
    },
  },
];
```

#### 4. MCP Commands (NEW)

```typescript
// apps/web/src/components/command-palette/mcp-commands.ts

const MCP_KEY_STORAGE_KEY = "opensunsama_mcp_key";

export const MCP_COMMANDS: Command[] = [
  {
    id: "mcp-cursor",
    title: "Setup MCP for Cursor",
    category: "mcp",
    keywords: ["mcp", "cursor", "ai", "setup", "config", "agent"],
    icon: "Terminal",
    priority: 10,
    action: (ctx) => {
      ctx.copyMcpConfig("cursor");
      ctx.closeSearch();
    },
  },
  {
    id: "mcp-claude",
    title: "Setup MCP for Claude Desktop",
    category: "mcp",
    keywords: ["mcp", "claude", "ai", "setup", "config", "anthropic"],
    icon: "Bot",
    priority: 11,
    action: (ctx) => {
      ctx.copyMcpConfig("claude");
      ctx.closeSearch();
    },
  },
  {
    id: "mcp-vscode",
    title: "Setup MCP for VS Code",
    category: "mcp",
    keywords: ["mcp", "vscode", "ai", "setup", "config", "continue"],
    icon: "Code",
    priority: 12,
    action: (ctx) => {
      ctx.copyMcpConfig("vscode");
      ctx.closeSearch();
    },
  },
  {
    id: "mcp-windsurf",
    title: "Setup MCP for Windsurf",
    category: "mcp",
    keywords: ["mcp", "windsurf", "ai", "setup", "config", "codeium"],
    icon: "Waves",
    priority: 13,
    action: (ctx) => {
      ctx.copyMcpConfig("windsurf");
      ctx.closeSearch();
    },
  },
  {
    id: "copy-api-key",
    title: "Copy MCP API Key",
    category: "mcp",
    keywords: ["api", "key", "copy", "mcp", "token"],
    icon: "Key",
    priority: 14,
    action: (ctx) => {
      ctx.copyApiKey();
      ctx.closeSearch();
    },
  },
  {
    id: "mcp-settings",
    title: "View MCP Settings",
    category: "mcp",
    keywords: ["mcp", "settings", "api", "configure"],
    icon: "Settings",
    priority: 15,
    action: (ctx) => {
      ctx.navigate({ to: "/app/settings", search: { tab: "mcp" } });
      ctx.closeSearch();
    },
  },
];
```

#### 5. Context-Aware Command Filter (`apps/web/src/components/command-palette/get-contextual-commands.ts`)

```typescript
const MAX_DEFAULT_COMMANDS = 6;
const MCP_KEYWORDS = ["mcp", "ai", "cursor", "claude", "setup", "agent"];

export function getContextualCommands(
  allCommands: Command[],
  context: CommandContext,
  query: string
): Command[] {
  const lowerQuery = query.toLowerCase().trim();
  
  // Step 1: Filter by query (if present)
  let filtered = lowerQuery
    ? allCommands.filter(cmd => 
        cmd.title.toLowerCase().includes(lowerQuery) ||
        cmd.keywords.some(k => k.includes(lowerQuery))
      )
    : allCommands;
  
  // Step 2: Filter by context requirements
  filtered = filtered.filter(cmd => {
    // Check hoveredTask requirement
    if (cmd.requiresHoveredTask && !context.hoveredTask) return false;
    
    // Check view requirement
    if (cmd.showInViews && !cmd.showInViews.includes(context.currentView)) return false;
    
    return true;
  });
  
  // Step 3: Sort by priority and context relevance
  filtered.sort((a, b) => {
    // Task commands first when hovering
    if (context.hoveredTask) {
      if (a.category === 'task' && b.category !== 'task') return -1;
      if (b.category === 'task' && a.category !== 'task') return 1;
    }
    
    // MCP commands first when searching for MCP
    if (MCP_KEYWORDS.some(kw => lowerQuery.includes(kw))) {
      if (a.category === 'mcp' && b.category !== 'mcp') return -1;
      if (b.category === 'mcp' && a.category !== 'mcp') return 1;
    }
    
    // Then by priority
    return (a.priority ?? 50) - (b.priority ?? 50);
  });
  
  // Step 4: Limit default commands (unless searching)
  if (!lowerQuery) {
    return filtered.slice(0, MAX_DEFAULT_COMMANDS);
  }
  
  return filtered;
}
```

#### 6. MCP Config Generation (extract from `mcp-settings.tsx`)

```typescript
// apps/web/src/lib/mcp-config.ts

export function generateMcpConfig(
  client: 'cursor' | 'claude' | 'vscode' | 'windsurf',
  apiKey: string,
  apiUrl: string = 'https://api.opensunsama.com'
): string {
  const baseConfig = {
    command: "npx",
    args: ["-y", "@open-sunsama/mcp"],
    env: {
      OPENSUNSAMA_API_KEY: apiKey,
      ...(apiUrl !== "https://api.opensunsama.com" && { OPENSUNSAMA_API_URL: apiUrl }),
    },
  };

  if (client === "vscode") {
    return JSON.stringify({
      mcpServers: [{ name: "open-sunsama", ...baseConfig }],
    }, null, 2);
  }

  return JSON.stringify({
    mcpServers: { "open-sunsama": baseConfig },
  }, null, 2);
}

export function getMcpApiKey(): string | null {
  return localStorage.getItem("opensunsama_mcp_key");
}
```

#### 7. Updated CommandPalette Component

```typescript
// apps/web/src/components/command-palette/command-palette.tsx

export function CommandPalette({ ... }: CommandPaletteProps) {
  // ... existing state ...
  
  // NEW: Get context
  const { hoveredTask } = useHoveredTask();
  const location = useLocation();
  const currentView = getCurrentView(location.pathname);
  
  // NEW: Task mutations
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();
  const createTask = useCreateTask();
  const moveTask = useMoveTask();
  const quickSchedule = useQuickSchedule();
  
  // NEW: MCP config helpers
  const { toast } = useToast();
  const apiUrl = import.meta.env.VITE_API_URL || "https://api.opensunsama.com";
  
  // Extended command context
  const commandContext: CommandContext = React.useMemo(() => ({
    // ... existing context ...
    
    // NEW: Context awareness
    hoveredTask,
    currentView,
    selectedDate: null, // TODO: get from route params
    
    // NEW: Task actions
    completeTask: (id) => {
      completeTask.mutate({ id, completed: true });
      toast({ title: "Task completed" });
    },
    deleteTask: (id) => {
      deleteTask.mutate(id);
      toast({ title: "Task deleted" });
    },
    duplicateTask: (task) => {
      createTask.mutate({
        title: task.title,
        priority: task.priority,
        scheduledDate: task.scheduledDate ?? undefined,
        estimatedMins: task.estimatedMins ?? undefined,
      });
      toast({ title: "Task duplicated" });
    },
    deferTask: (id, date) => {
      moveTask.mutate({ id, targetDate: date });
      toast({ title: date ? "Task deferred" : "Moved to backlog" });
    },
    scheduleTask: (id) => {
      quickSchedule.mutate({ taskId: id, startTime: `${format(new Date(), 'yyyy-MM-dd')}T09:00:00` });
      toast({ title: "Added to calendar" });
    },
    
    // NEW: MCP actions
    copyMcpConfig: async (client) => {
      const apiKey = getMcpApiKey();
      if (!apiKey) {
        toast({ variant: "destructive", title: "No MCP API key", description: "Go to Settings > MCP to create one" });
        return;
      }
      const config = generateMcpConfig(client, apiKey, apiUrl);
      await navigator.clipboard.writeText(config);
      toast({ title: `${client} config copied`, description: "Paste into your config file" });
    },
    copyApiKey: async () => {
      const apiKey = getMcpApiKey();
      if (!apiKey) {
        toast({ variant: "destructive", title: "No MCP API key", description: "Go to Settings > MCP to create one" });
        return;
      }
      await navigator.clipboard.writeText(apiKey);
      toast({ title: "API key copied" });
    },
  }), [/* deps */]);
  
  // Combine all commands
  const allCommands = React.useMemo(() => [
    ...TASK_COMMANDS,
    ...MCP_COMMANDS,
    ...COMMANDS, // existing navigation/settings commands
  ], []);
  
  // Get contextual commands
  const filteredCommands = React.useMemo(
    () => getContextualCommands(allCommands, commandContext, query),
    [allCommands, commandContext, query]
  );
  
  // ... rest of component ...
}
```

### UI Updates

#### Suggested Section Header

When showing default commands (no query), display a "Suggested" header:

```tsx
{!query.trim() && commandItems.length > 0 && (
  <div className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
    <Sparkles className="h-3 w-3" />
    Suggested
  </div>
)}
```

#### Task Context Indicator

When hovering a task, show which task commands will affect:

```tsx
{context.hoveredTask && (
  <div className="px-3 py-1.5 text-[11px] text-muted-foreground border-b bg-muted/30 flex items-center gap-1.5">
    <span className="text-foreground/80 truncate max-w-[200px]">
      "{context.hoveredTask.title}"
    </span>
  </div>
)}
```

#### MCP Section with Icon

When MCP commands are shown (via search), group them visually:

```tsx
{mcpCommandsVisible && (
  <div className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
    <Bot className="h-3 w-3" />
    AI Setup
  </div>
)}
```

### File Changes

#### New Files

| File | Purpose |
|------|---------|
| `apps/web/src/components/command-palette/task-commands.ts` | Task-specific commands (complete, defer, etc.) |
| `apps/web/src/components/command-palette/mcp-commands.ts` | MCP setup commands |
| `apps/web/src/components/command-palette/get-contextual-commands.ts` | Context-aware filtering logic |
| `apps/web/src/lib/mcp-config.ts` | MCP config generation utilities |

#### Modified Files

| File | Changes |
|------|---------|
| `apps/web/src/components/command-palette/commands.ts` | Extend `Command` interface with `requiresHoveredTask`, `showInViews`, `priority` |
| `apps/web/src/components/command-palette/command-palette.tsx` | Add context awareness, task mutations, MCP actions |
| `apps/web/src/components/settings/mcp-settings.tsx` | Extract config generation to shared utility |

### Flow

#### 1. User Opens Command Palette (No Task Hovered)

```
┌─────────────────────────────────────────────────┐
│ 🔍 Type a command or search...                   │
├─────────────────────────────────────────────────┤
│ ✨ SUGGESTED                                     │
│   ➕ Add New Task                           A    │
│   📋 Go to Tasks Board                           │
│   📅 Go to Calendar                              │
│   ⚙️  Go to Settings                             │
│   🌙 Switch to Dark Mode                         │
│   ⌨️  Show Keyboard Shortcuts               ?    │
├─────────────────────────────────────────────────┤
│ ↑↓ navigate  ↵ select  esc close                │
└─────────────────────────────────────────────────┘
```

#### 2. User Opens Command Palette (Task Hovered)

```
┌─────────────────────────────────────────────────┐
│ 🔍 Type a command or search...                   │
├─────────────────────────────────────────────────┤
│ "Review PRD document" selected                   │
├─────────────────────────────────────────────────┤
│ ✨ SUGGESTED                                     │
│   ✓ Complete Task                           C    │ ← Priority 0
│   ↘ Defer to Next Week                     ⇧Z    │ ← Priority 1
│   📥 Move to Backlog                        Z    │ ← Priority 2
│   📅 Add to Calendar                        X    │ ← Priority 3
│   📋 Duplicate Task                        ⌘D    │ ← Priority 4
│   🗑 Delete Task                           ⌘⌫    │ ← Priority 5
├─────────────────────────────────────────────────┤
│ ↑↓ navigate  ↵ select  esc close                │
└─────────────────────────────────────────────────┘
```

#### 3. User Types "mcp" or "cursor"

```
┌─────────────────────────────────────────────────┐
│ 🔍 mcp                                           │
├─────────────────────────────────────────────────┤
│ 🤖 AI SETUP                                      │
│ ▸ 💻 Setup MCP for Cursor                        │ ← highlighted
│   🤖 Setup MCP for Claude Desktop                │
│   📝 Setup MCP for VS Code                       │
│   🌊 Setup MCP for Windsurf                      │
│   🔑 Copy MCP API Key                            │
│   ⚙️  View MCP Settings                          │
├─────────────────────────────────────────────────┤
│ ↑↓ navigate  ↵ select  esc close                │
└─────────────────────────────────────────────────┘
```

#### 4. User Types "cal" (Mixed Results)

```
┌─────────────────────────────────────────────────┐
│ 🔍 cal                                           │
├─────────────────────────────────────────────────┤
│ COMMANDS                                         │
│ ▸ 📅 Go to Calendar                              │
│   📅 Add to Calendar                        X    │ ← if task hovered
├─────────────────────────────────────────────────┤
│ TASKS (2 results)                                │
│   ☐ Calendar integration meeting (P1)            │
│   ☐ Review calendar API endpoints                │
├─────────────────────────────────────────────────┤
│ ↑↓ navigate  ↵ select  esc close                │
└─────────────────────────────────────────────────┘
```

### View-Specific Defaults

| View | Default Commands (when no query, no hovered task) |
|------|--------------------------------------------------|
| Tasks (`/app`) | Add Task, Go to Calendar, Toggle Theme, Show Shortcuts |
| Calendar (`/app/calendar`) | Add Task, Go to Tasks, Today, Toggle Theme |
| Settings (`/app/settings`) | Go to Tasks, Go to Calendar, Toggle Theme |

### Utility Functions

```typescript
// apps/web/src/lib/route-utils.ts

export function getCurrentView(pathname: string): 'tasks' | 'calendar' | 'settings' {
  if (pathname.includes('/calendar')) return 'calendar';
  if (pathname.includes('/settings')) return 'settings';
  return 'tasks';
}
```

## Edge Cases

- **No MCP API key**: When copying config/key, show toast with link to create one in settings
- **Task hovered but command palette already open**: Should still show task commands (check hoveredTask on each render)
- **Hovered task gets deleted**: Filter should remove task commands automatically (hoveredTask becomes null)
- **Multiple MCP keys**: Use the key stored in localStorage (`opensunsama_mcp_key`) which is the dedicated MCP key
- **User types while task hovered**: Task commands should still appear if they match the query
- **Empty query after typing**: Reset to context-aware defaults (max 6)
- **Calendar view with date selected**: Include date in "Add Task" and "Add Time Block" defaults
- **Mobile/touch**: Task hover doesn't apply; show navigation/global commands only

## Testing Checklist

1. [ ] Open palette with no context → shows 6 default commands
2. [ ] Hover task, open palette → shows 6 task commands
3. [ ] Type "mcp" → shows MCP commands first
4. [ ] Type "cursor" → shows "Setup MCP for Cursor" first
5. [ ] Execute "Copy MCP API Key" → copies key, shows toast
6. [ ] Execute "Setup MCP for Cursor" → copies config JSON, shows toast
7. [ ] Execute "Complete Task" with hovered task → completes task
8. [ ] Open on calendar view → shows calendar-specific commands
9. [ ] Open on settings view → shows settings-specific commands
10. [ ] Type query that matches task + command → shows commands first, then tasks
