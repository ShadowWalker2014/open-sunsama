// Manual route tree for TanStack Router
// @ts-nocheck

import {
  createRootRoute,
  createRoute,
  redirect,
  Outlet,
  lazyRouteComponent,
} from "@tanstack/react-router";
import { Toaster } from "./components/ui/toaster";

// Auth pages — these are the entry points for unauthenticated users, so we
// keep them eager. Everything else (marketing, docs, blog, comparison pages,
// in-app sub-pages) is split into its own chunk via lazyRouteComponent so the
// /app boot bundle stays small.
import LoginPage from "./routes/login";
import RegisterPage from "./routes/register";
import AppLayout from "./routes/app";

// Create root route
const rootRoute = createRootRoute({
  component: () => {
    return (
      <>
        <Outlet />
        <Toaster />
      </>
    );
  },
});

// Create routes with proper parent relationships
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: lazyRouteComponent(() => import("./routes/landing")),
  beforeLoad: () => {
    const token = localStorage.getItem("open_sunsama_token");

    // On desktop/mobile app (Tauri), skip landing page entirely
    // Both desktop and mobile Tauri apps have __TAURI_INTERNALS__
    const isTauriApp =
      typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
    if (isTauriApp) {
      throw redirect({ to: token ? "/app" : "/login" });
    }

    // On web browser, redirect authenticated users to app
    if (token) {
      throw redirect({ to: "/app" });
    }
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/forgot-password",
  component: lazyRouteComponent(() => import("./routes/forgot-password")),
});

const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reset-password",
  component: lazyRouteComponent(() => import("./routes/reset-password")),
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: typeof search.token === "string" ? search.token : "",
    };
  },
});

const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/privacy",
  component: lazyRouteComponent(() => import("./routes/privacy")),
});

const termsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/terms",
  component: lazyRouteComponent(() => import("./routes/terms")),
});

const downloadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/download",
  component: lazyRouteComponent(() => import("./routes/download")),
});

const kanbanFeatureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/features/kanban",
  component: lazyRouteComponent(() => import("./routes/features/kanban")),
});

const timeBlockingFeatureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/features/time-blocking",
  component: lazyRouteComponent(
    () => import("./routes/features/time-blocking")
  ),
});

const focusModeFeatureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/features/focus-mode",
  component: lazyRouteComponent(() => import("./routes/features/focus-mode")),
});

const aiIntegrationFeatureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/features/ai-integration",
  component: lazyRouteComponent(
    () => import("./routes/features/ai-integration")
  ),
});

const commandPaletteFeatureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/features/command-palette",
  component: lazyRouteComponent(
    () => import("./routes/features/command-palette")
  ),
});

const calendarSyncFeatureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/features/calendar-sync",
  component: lazyRouteComponent(
    () => import("./routes/features/calendar-sync")
  ),
});

const blogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/blog",
  component: lazyRouteComponent(() => import("./routes/blog")),
  validateSearch: (
    search: Record<string, unknown>
  ): { tag?: string; page?: number; q?: string } => {
    return {
      tag: typeof search.tag === "string" ? search.tag : undefined,
      page:
        typeof search.page === "string"
          ? parseInt(search.page, 10)
          : typeof search.page === "number"
            ? search.page
            : undefined,
      q: typeof search.q === "string" ? search.q : undefined,
    };
  },
});

const blogPostRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/blog/$slug",
  component: lazyRouteComponent(() => import("./routes/blog.$slug")),
});

const motionAlternativeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/alternative/motion",
  component: lazyRouteComponent(() => import("./routes/alternative.motion")),
});

// Docs parent route - just renders Outlet for children
const docsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/docs",
  component: () => <Outlet />,
});

// Index route for /docs - shows landing page
const docsIndexRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/",
  component: lazyRouteComponent(() => import("./routes/docs")),
});

// Splat route for nested doc paths like /docs/getting-started or /docs/api/authentication
const docsSplatRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "$",
  component: lazyRouteComponent(() => import("./routes/docs.$")),
});

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/app",
  component: AppLayout,
  beforeLoad: () => {
    const token = localStorage.getItem("open_sunsama_token");
    if (!token) {
      throw redirect({ to: "/login" });
    }
  },
});

const appIndexRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/",
  component: lazyRouteComponent(() => import("./routes/app/index")),
});

const appCalendarRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/calendar",
  component: lazyRouteComponent(() => import("./routes/app/calendar")),
});

const appBoardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/board",
  component: lazyRouteComponent(() => import("./routes/app/board")),
});

const appSettingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/settings",
  component: lazyRouteComponent(() => import("./routes/app/settings")),
  validateSearch: (
    search: Record<string, unknown>
  ): { tab?: string; calendar?: string; provider?: string } => {
    return {
      tab: typeof search.tab === "string" ? search.tab : undefined,
      calendar:
        typeof search.calendar === "string" ? search.calendar : undefined,
      provider:
        typeof search.provider === "string" ? search.provider : undefined,
    };
  },
});

const appTasksListRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/tasks",
  component: lazyRouteComponent(() => import("./routes/app/tasks")),
});

const appFocusRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/focus/$taskId",
  component: lazyRouteComponent(() => import("./routes/app/focus.$taskId")),
});

const appFocusCompleteRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/focus/complete",
  component: lazyRouteComponent(() => import("./routes/app/focus.complete")),
});

const appMoreRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/more",
  component: lazyRouteComponent(() => import("./routes/app/more")),
});

const appRoutinesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/routines",
  component: lazyRouteComponent(() => import("./routes/app/routines")),
});

// Build the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  privacyRoute,
  termsRoute,
  downloadRoute,
  blogRoute,
  blogPostRoute,
  docsRoute.addChildren([docsIndexRoute, docsSplatRoute]),
  motionAlternativeRoute,
  kanbanFeatureRoute,
  timeBlockingFeatureRoute,
  focusModeFeatureRoute,
  aiIntegrationFeatureRoute,
  commandPaletteFeatureRoute,
  calendarSyncFeatureRoute,
  appRoute.addChildren([
    appIndexRoute,
    appBoardRoute,
    appCalendarRoute,
    appSettingsRoute,
    appTasksListRoute,
    appFocusRoute,
    appFocusCompleteRoute,
    appMoreRoute,
    appRoutinesRoute,
  ]),
]);

export { routeTree };
