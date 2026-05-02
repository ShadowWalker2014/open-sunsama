import * as React from "react";
import { Outlet, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
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
import { useWebSocket } from "@/hooks/useWebSocket";
import {
  ShortcutsModal,
  prefetchShortcutsModal,
} from "@/components/ui/shortcuts-modal.lazy";
import { GlobalShortcutsHandler } from "@/components/global-shortcuts-handler";
import {
  CommandPalette,
  prefetchCommandPalette,
} from "@/components/command-palette/command-palette.lazy";
import {
  AddTaskModal,
  prefetchAddTaskModal,
} from "@/components/kanban/add-task-modal.lazy";
import {
  TaskModal,
  prefetchTaskModal,
} from "@/components/kanban/task-modal.lazy";
import { AppUpdateBanner } from "@/components/app-update-banner.lazy";
import { prefetchRichTextEditor } from "@/components/ui/rich-text-editor.lazy";

/**
 * Main app layout - requires authentication
 *
 * The presence of a token (set in beforeLoad on the route) is the gate to
 * rendering the shell; the /auth/me request happens in the background and
 * does not block first paint. If the token turns out to be invalid, useAuth
 * clears it and the redirect effect below kicks in.
 */
export default function AppLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      void navigate({ to: "/login" });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Only show the skeleton on a true cold start: token present, no cached
  // user, no in-flight result yet. With localStorage seeding this is rare
  // and brief.
  if (isLoading && !user) {
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
  // Initialize WebSocket for realtime updates
  useWebSocket();

  const { showShortcutsModal, setShowShortcutsModal } = useShortcutsModal();
  const { isSearchOpen, closeSearch } = useSearch();
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = React.useState(false);

  // Warm the Tiptap chunk during browser idle time. The first time the user
  // hits Cmd+K → Add Task, or opens a task modal, the editor module is
  // already on disk and mounts without network roundtrip.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    let cancelled = false;
    const warmAll = () => {
      if (cancelled) return;
      void prefetchRichTextEditor();
      void prefetchTaskModal();
      void prefetchAddTaskModal();
      void prefetchCommandPalette();
      void prefetchShortcutsModal();
    };
    if (typeof win.requestIdleCallback === "function") {
      const id = win.requestIdleCallback(warmAll, { timeout: 4000 });
      return () => {
        cancelled = true;
        win.cancelIdleCallback?.(id);
      };
    }
    const id = window.setTimeout(warmAll, 1500);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, []);

  const handleAddTask = React.useCallback(() => {
    // Trigger the prefetches synchronously — by the time the modal opens
    // and Suspense suspends, the chunks are already in flight.
    void prefetchAddTaskModal();
    void prefetchRichTextEditor();
    setIsAddTaskModalOpen(true);
  }, []);

  return (
    <>
      <div className="flex min-h-screen flex-col">
        <AppUpdateBanner />
        <Header />
        <main className="flex-1 pb-16 lg:pb-0">
          <Outlet />
        </main>
        {/* Mobile bottom navigation - hidden on lg screens */}
        <MobileBottomNav />
      </div>

      {/* Global Shortcuts Handler */}
      <GlobalShortcutsHandler onAddTask={handleAddTask} />

      {/* Shortcuts Modal */}
      <ShortcutsModal
        open={showShortcutsModal}
        onOpenChange={setShowShortcutsModal}
      />

      {/* Command Palette */}
      <CommandPalette
        open={isSearchOpen}
        onOpenChange={(open) => {
          if (!open) closeSearch();
        }}
        onSelectTask={(task) => {
          closeSearch();
          setSelectedTask(task);
        }}
        onAddTask={handleAddTask}
      />

      {/* Add Task Modal triggered by global shortcut */}
      <AddTaskModal
        open={isAddTaskModalOpen}
        onOpenChange={setIsAddTaskModalOpen}
        scheduledDate={format(new Date(), "yyyy-MM-dd")}
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
