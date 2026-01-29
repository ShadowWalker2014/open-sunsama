import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Index route - redirects to /app if authenticated, /login otherwise
 */
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // Check if user has a stored token
    const token = localStorage.getItem("chronoflow_token");
    
    if (token) {
      // Redirect to app
      throw redirect({ to: "/app" });
    } else {
      // Redirect to login
      throw redirect({ to: "/login" });
    }
  },
});
