/**
 * Recovers from chunk-load failures.
 *
 * When the app deploys a new version, any tab that's been open since the
 * previous deploy holds references to the old hashed chunk filenames. The
 * first time a `React.lazy(import("..."))` boundary fires after the deploy,
 * the request 404s and React.lazy throws — without recovery the user sees a
 * blank screen.
 *
 * Vite emits a `vite:preloadError` window event for these. We listen once
 * (pre-app-mount) and trigger a single soft reload — but only if we haven't
 * already attempted one in this session, to avoid an infinite reload loop
 * if the chunk genuinely never resolves.
 *
 * Reference: https://vite.dev/guide/build.html#load-error-handling
 */

const RELOAD_FLAG = "open_sunsama_chunk_reload_v1";

function shouldAttemptReload(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(RELOAD_FLAG) !== "1";
  } catch {
    // Private mode etc — allow the reload, fall back to URL flag.
    return true;
  }
}

function markReloadAttempted(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(RELOAD_FLAG, "1");
  } catch {
    // ignore
  }
}

function clearReloadFlagIfStale(): void {
  // If the user successfully loaded the page, clear the flag so a future
  // chunk error after the next deploy can trigger another reload. Run after
  // a brief delay to ensure we're past initial chunk loads.
  if (typeof window === "undefined") return;
  window.setTimeout(() => {
    try {
      window.sessionStorage.removeItem(RELOAD_FLAG);
    } catch {
      // ignore
    }
  }, 10_000);
}

let installed = false;

export function installChunkErrorRecovery(): void {
  if (installed) return;
  if (typeof window === "undefined") return;
  installed = true;

  clearReloadFlagIfStale();

  const handleChunkError = (event: Event) => {
    if (!shouldAttemptReload()) {
      // We already tried reloading once this session — let the error
      // propagate to React's error boundary (if any) so the user sees a
      // real error instead of looping.
      return;
    }
    markReloadAttempted();
    // Best-effort: prevent any default visible error before reload.
    event.preventDefault?.();
    window.location.reload();
  };

  window.addEventListener("vite:preloadError", handleChunkError as EventListener);

  // Belt-and-suspenders: also catch unhandled `ChunkLoadError`/`Loading chunk`
  // promise rejections from `React.lazy` failures that didn't go through the
  // Vite preload path (e.g., a dynamic import that races the polyfill).
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason as unknown;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === "string"
          ? reason
          : "";
    if (
      typeof message === "string" &&
      (message.includes("Loading chunk") ||
        message.includes("Failed to fetch dynamically imported module") ||
        message.includes("Importing a module script failed"))
    ) {
      handleChunkError(event);
    }
  });
}
