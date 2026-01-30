/**
 * Task-specific commands for the command palette
 * These are shown when a task is hovered
 */
import type { Command } from "./commands";

export const TASK_COMMANDS: Command[] = [
  {
    id: "complete-task",
    title: "Complete Task",
    shortcut: "C",
    category: "actions",
    keywords: ["complete", "done", "finish", "check", "mark"],
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
    id: "defer-next-week",
    title: "Defer to Next Week",
    shortcut: "⇧Z",
    category: "actions",
    keywords: ["defer", "postpone", "next week", "later", "delay"],
    icon: "CalendarClock",
    requiresHoveredTask: true,
    priority: 1,
    action: (ctx) => {
      if (ctx.hoveredTask) {
        // Calculate next Monday
        const today = new Date();
        const dayOfWeek = today.getDay();
        const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + daysUntilMonday);
        const dateStr = nextMonday.toISOString().split("T")[0]!;
        ctx.deferTask(ctx.hoveredTask.id, dateStr);
        ctx.closeSearch();
      }
    },
  },
  {
    id: "move-to-backlog",
    title: "Move to Backlog",
    shortcut: "Z",
    category: "actions",
    keywords: ["backlog", "unschedule", "remove date", "inbox"],
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
    category: "actions",
    keywords: ["schedule", "calendar", "time block", "plan"],
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
    category: "actions",
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
    id: "delete-task-cmd",
    title: "Delete Task",
    shortcut: "⌘⌫",
    category: "actions",
    keywords: ["delete", "remove", "trash", "discard"],
    icon: "Trash2",
    requiresHoveredTask: true,
    priority: 5,
    action: (ctx) => {
      if (ctx.hoveredTask) {
        ctx.deleteTask(ctx.hoveredTask.id);
        ctx.closeSearch();
      }
    },
  },
];
