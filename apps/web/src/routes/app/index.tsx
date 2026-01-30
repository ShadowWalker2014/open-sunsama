import * as React from "react";
import { KanbanBoard, useKanbanNavigation } from "@/components/kanban";
import { KanbanCalendarPanel } from "@/components/kanban/kanban-calendar-panel";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileBacklogSheet } from "@/components/layout/mobile-backlog-sheet";
import { TasksDndProvider } from "@/lib/dnd/tasks-dnd-context";
import { TaskShortcutsHandler } from "@/components/task-shortcuts-handler";

/**
 * Main tasks/kanban view
 * Shows tasks organized by day in an infinite horizontal scrolling view
 * Right side shows a compact calendar for the active (leftmost) day
 */
export default function TasksPage() {
  const [activeDate, setActiveDate] = React.useState<Date | null>(null);

  return (
    <TasksDndProvider>
      <div className="flex h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-3.5rem)]">
        {/* Sidebar - Backlog (Desktop only) */}
        <Sidebar className="hidden lg:flex" />

        {/* Mobile Backlog Sheet - FAB trigger (Mobile only) */}
        <MobileBacklogSheet />

        {/* Main Content - Kanban Board */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            <KanbanBoard onFirstVisibleDateChange={setActiveDate}>
              {/* Keyboard shortcuts handler rendered inside KanbanBoard 
                  to access the navigation context */}
              <TasksKeyboardShortcuts />
            </KanbanBoard>
          </div>

          {/* Calendar Panel - Desktop only */}
          {activeDate && (
            <KanbanCalendarPanel
              date={activeDate}
              className="hidden xl:flex w-48 flex-shrink-0"
            />
          )}
        </div>
      </div>
    </TasksDndProvider>
  );
}

/**
 * Component that bridges the kanban navigation context to the keyboard shortcuts handler.
 * Must be rendered inside KanbanBoard to access the navigation context.
 */
function TasksKeyboardShortcuts() {
  const navigation = useKanbanNavigation();

  return (
    <TaskShortcutsHandler
      onNavigateToday={navigation.navigateToToday}
      onNavigateNext={navigation.navigateNext}
      onNavigatePrevious={navigation.navigatePrevious}
      onSelect={navigation.selectTask}
    />
  );
}
