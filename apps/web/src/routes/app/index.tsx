import { KanbanBoard, useKanbanNavigation } from "@/components/kanban";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileBacklogSheet } from "@/components/layout/mobile-backlog-sheet";
import { TasksDndProvider } from "@/lib/dnd/tasks-dnd-context";
import { TaskShortcutsHandler } from "@/components/task-shortcuts-handler";

/**
 * Main tasks/kanban view
 * Shows tasks organized by day in an infinite horizontal scrolling view
 */
export default function TasksPage() {
  return (
    <TasksDndProvider>
      <div className="flex h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-3.5rem)]">
        {/* Sidebar - Backlog (Desktop only) */}
        <Sidebar className="hidden lg:flex" />

        {/* Mobile Backlog Sheet - FAB trigger (Mobile only) */}
        <MobileBacklogSheet />

        {/* Main Content - Kanban Board */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <KanbanBoard>
            {/* Keyboard shortcuts handler rendered inside KanbanBoard 
                to access the navigation context */}
            <TasksKeyboardShortcuts />
          </KanbanBoard>
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
    />
  );
}
