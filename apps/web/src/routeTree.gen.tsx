// Manual route tree for TanStack Router
// @ts-nocheck

import { createRootRoute, createRoute, redirect, Outlet } from "@tanstack/react-router";
import { Toaster } from "./components/ui/toaster";

// Import route components
import LoginPage from "./routes/login";
import RegisterPage from "./routes/register";
import ForgotPasswordPage from "./routes/forgot-password";
import ResetPasswordPage from "./routes/reset-password";
import AppLayout from "./routes/app";
import TasksPage from "./routes/app/index";
import CalendarPage from "./routes/app/calendar";
import SettingsPage from "./routes/app/settings";

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
  beforeLoad: () => {
    const token = localStorage.getItem("open_sunsama_token");
    if (token) {
      throw redirect({ to: "/app" });
    } else {
      throw redirect({ to: "/login" });
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

// Build the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  appRoute.addChildren([
    appIndexRoute,
    appCalendarRoute,
    appSettingsRoute,
  ]),
]);

export { routeTree };
