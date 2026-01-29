// @ts-nocheck - Route typing handled by TanStack Router
import { createFileRoute } from "@tanstack/react-router";
import { KanbanBoard } from "@/components/kanban";
import { Sidebar } from "@/components/layout/sidebar";

/**
 * Main tasks/kanban view
 * Shows tasks organized by day in an infinite horizontal scrolling view
 */
function TasksPage() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar - Backlog */}
      <Sidebar className="hidden lg:flex" />

      {/* Main Content - Kanban Board */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <KanbanBoard />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/app/")({
  component: TasksPage,
});
