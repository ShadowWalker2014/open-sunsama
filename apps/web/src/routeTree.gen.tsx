// Manual route tree for TanStack Router
// @ts-nocheck

import { createRootRoute, createRoute, redirect, Outlet } from "@tanstack/react-router";
import { Toaster } from "./components/ui/toaster";

// Import route components
import LandingPage from "./routes/landing";
import LoginPage from "./routes/login";
import RegisterPage from "./routes/register";
import ForgotPasswordPage from "./routes/forgot-password";
import ResetPasswordPage from "./routes/reset-password";
import PrivacyPage from "./routes/privacy";
import TermsPage from "./routes/terms";
import DownloadPage from "./routes/download";
import AppLayout from "./routes/app";
import TasksPage from "./routes/app/index";
import CalendarPage from "./routes/app/calendar";
import SettingsPage from "./routes/app/settings";
import TasksListPage from "./routes/app/tasks";
import FocusPage from "./routes/app/focus.$taskId";
import FocusCompletePage from "./routes/app/focus.complete";
import MorePage from "./routes/app/more";

// Import feature pages
import KanbanFeaturePage from "./routes/features/kanban";
import TimeBlockingFeaturePage from "./routes/features/time-blocking";
import FocusModeFeaturePage from "./routes/features/focus-mode";
import AIIntegrationFeaturePage from "./routes/features/ai-integration";
import CommandPaletteFeaturePage from "./routes/features/command-palette";
import CalendarSyncFeaturePage from "./routes/features/calendar-sync";

// Import blog pages
import BlogPage from "./routes/blog";
import BlogPostPage from "./routes/blog.$slug";

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
  component: LandingPage,
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
  component: ForgotPasswordPage,
});

const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reset-password",
  component: ResetPasswordPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: typeof search.token === "string" ? search.token : "",
    };
  },
});

const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/privacy",
  component: PrivacyPage,
});

const termsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/terms",
  component: TermsPage,
});

const downloadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/download",
  component: DownloadPage,
});

const kanbanFeatureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/features/kanban",
  component: KanbanFeaturePage,
});

const timeBlockingFeatureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/features/time-blocking",
  component: TimeBlockingFeaturePage,
});

const focusModeFeatureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/features/focus-mode",
  component: FocusModeFeaturePage,
});

const aiIntegrationFeatureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/features/ai-integration",
  component: AIIntegrationFeaturePage,
});

const commandPaletteFeatureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/features/command-palette",
  component: CommandPaletteFeaturePage,
});

const calendarSyncFeatureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/features/calendar-sync",
  component: CalendarSyncFeaturePage,
});

const blogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/blog",
  component: BlogPage,
});

const blogPostRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/blog/$slug",
  component: BlogPostPage,
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
  component: TasksPage,
});

const appCalendarRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/calendar",
  component: CalendarPage,
});

const appSettingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/settings",
  component: SettingsPage,
});

const appTasksListRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/tasks",
  component: TasksListPage,
});

const appFocusRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/focus/$taskId",
  component: FocusPage,
});

const appFocusCompleteRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/focus/complete",
  component: FocusCompletePage,
});

const appMoreRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/more",
  component: MorePage,
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
  kanbanFeatureRoute,
  timeBlockingFeatureRoute,
  focusModeFeatureRoute,
  aiIntegrationFeatureRoute,
  commandPaletteFeatureRoute,
  calendarSyncFeatureRoute,
  appRoute.addChildren([
    appIndexRoute,
    appCalendarRoute,
    appSettingsRoute,
    appTasksListRoute,
    appFocusRoute,
    appFocusCompleteRoute,
    appMoreRoute,
  ]),
]);

export { routeTree };
