// @ts-nocheck
import { KanbanBoard } from "@/components/kanban";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileBacklogSheet } from "@/components/layout/mobile-backlog-sheet";

/**
 * Main tasks/kanban view
 * Shows tasks organized by day in an infinite horizontal scrolling view
 */
export default function TasksPage() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-3.5rem)]">
      {/* Sidebar - Backlog (Desktop only) */}
      <Sidebar className="hidden lg:flex" />

      {/* Mobile Backlog Sheet - FAB trigger (Mobile only) */}
      <MobileBacklogSheet />

      {/* Main Content - Kanban Board */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <KanbanBoard />
      </div>
    </div>
  );
}
