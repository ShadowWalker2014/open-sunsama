import * as React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
} from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { useTimezoneSync } from "@/hooks/useTimezoneSync";
import { persister, shouldPersistQueryFn } from "@/lib/query-persister";
import { installChunkErrorRecovery } from "@/lib/chunk-error-recovery";
import { routeTree } from "./routeTree.gen.tsx";

import "./index.css";

// Recover from stale-deploy chunk loads (vite:preloadError) before any
// component tree mounts so a failed `React.lazy(...)` triggers exactly one
// soft reload instead of crashing the app.
installChunkErrorRecovery();

/**
 * Component that syncs user timezone with the server
 * Must be inside AuthProvider to access user state
 */
function TimezoneSync({ children }: { children: React.ReactNode }) {
  useTimezoneSync();
  return <>{children}</>;
}

// Create the router instance.
// `defaultPreloadStaleTime` controls how long preloaded data is reused before
// the router considers it stale. Bumping this off 0 means hovering a link
// doesn't trigger a redundant fetch on every hover.
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 30_000,
  defaultPreloadGcTime: 5 * 60_000,
});

// Register the router for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Create a QueryClient instance.
// staleTime is generous because we trust optimistic updates + WebSocket events
// to keep caches in sync, and the persisted cache makes refetch-on-mount
// instant (we serve from disk, then revalidate in the background).
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute — feels live, avoids thundering herds
      gcTime: 24 * 60 * 60 * 1000, // 24h — keep cache around for fast remounts
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: "always",
      networkMode: "offlineFirst",
    },
    mutations: {
      retry: 0,
      networkMode: "offlineFirst",
    },
  },
});

// Treat tab focus as the only signal to revalidate — Tauri windows that lose
// focus shouldn't refetch in the background.
if (typeof document !== "undefined") {
  focusManager.setEventListener((handleFocus) => {
    const onVisibility = () => {
      handleFocus(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
    };
  });
}

const persistOptions = persister
  ? {
      persister,
      maxAge: 24 * 60 * 60 * 1000, // 24h
      // Bump this when the cache shape changes to invalidate stored data.
      buster: "v1",
      dehydrateOptions: {
        shouldDehydrateQuery: ({
          state,
          queryKey,
        }: {
          state: { status: string };
          queryKey: readonly unknown[];
        }) => {
          if (state.status !== "success") return false;
          return shouldPersistQueryFn({ queryKey });
        },
      },
    }
  : null;

/**
 * Root App component
 * Sets up providers and router
 */
function App() {
  const inner = (
    <AuthProvider>
      <ThemeProvider>
        <TimezoneSync>
          <RouterProvider router={router} />
        </TimezoneSync>
      </ThemeProvider>
    </AuthProvider>
  );

  return (
    <HelmetProvider>
      {persistOptions ? (
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={persistOptions}
        >
          {inner}
        </PersistQueryClientProvider>
      ) : (
        <QueryClientProvider client={queryClient}>{inner}</QueryClientProvider>
      )}
    </HelmetProvider>
  );
}

// Render the app
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
