import * as React from "react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/toaster";

/**
 * Root route component
 * Provides the base layout for all pages
 */
function RootComponent() {
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
