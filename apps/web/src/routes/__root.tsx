import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/toaster";
import { useWebSocket } from "@/hooks/useWebSocket";

/**
 * Root route component
 * Provides the base layout for all pages
 */
function RootComponent() {
  // Initialize WebSocket connection for realtime updates
  useWebSocket();

  return (
    <>
      <Outlet />
      <Toaster />
    </>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
