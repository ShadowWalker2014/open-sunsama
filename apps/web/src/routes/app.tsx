import * as React from "react";
import { Outlet, useNavigate } from "@tanstack/react-router";
import type { Task } from "@open-sunsama/types";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Skeleton } from "@/components/ui";
import {
  HoveredTaskProvider,
  ShortcutsProvider,
  useShortcutsModal,
} from "@/hooks/useKeyboardShortcuts";
import { SearchProvider, useSearch } from "@/hooks/useSearch";
import { ShortcutsModal } from "@/components/ui/shortcuts-modal";
import { TaskSearchModal } from "@/components/search/task-search-modal";
import { TaskModal } from "@/components/kanban/task-modal";

/**
 * Main app layout - requires authentication
 */
export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      void navigate({ to: "/login" });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
          <div className="flex h-14 w-full items-center px-4 sm:px-6">
            <Skeleton className="h-8 w-32" />
            <div className="flex-1" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
        <main className="flex-1">
          <div className="container py-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <HoveredTaskProvider>
      <ShortcutsProvider>
        <SearchProvider>
          <AppLayoutInner />
        </SearchProvider>
      </ShortcutsProvider>
    </HoveredTaskProvider>
  );
}

/**
 * Inner component that can use the shortcuts hooks
 */
function AppLayoutInner() {
  const { showShortcutsModal, setShowShortcutsModal } = useShortcutsModal();
  const { isSearchOpen, closeSearch } = useSearch();
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);

  return (
    <>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 pb-16 lg:pb-0">
          <Outlet />
        </main>
        {/* Mobile bottom navigation - hidden on lg screens */}
        <MobileBottomNav />
      </div>

      {/* Shortcuts Modal */}
      <ShortcutsModal
        open={showShortcutsModal}
        onOpenChange={setShowShortcutsModal}
      />

      {/* Search Modal */}
      <TaskSearchModal
        open={isSearchOpen}
        onOpenChange={(open) => {
          if (!open) closeSearch();
        }}
        onSelectTask={(task) => {
          closeSearch();
          setSelectedTask(task);
        }}
      />

      {/* Task Modal for viewing selected task from search */}
      <TaskModal
        task={selectedTask}
        open={selectedTask !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null);
        }}
      />
    </>
  );
}

// Component exported as default above
