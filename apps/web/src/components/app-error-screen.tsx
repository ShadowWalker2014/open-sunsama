import * as React from "react";
import { isDesktop } from "@/lib/desktop";
import { checkForUpdate, downloadAndInstallUpdate } from "@/lib/updater";

/**
 * Last-resort error screen for the router and the root error boundary.
 *
 * A render error must never leave someone stuck. Most crashes we have seen
 * come from bad data restored from the persisted query cache, which would
 * crash again on every launch. So the first time this screen mounts it clears
 * that cache and reloads by itself. If the error comes back within a minute,
 * it shows the screen with manual ways out: reload, reset local data, sign
 * out, and (desktop) install an update — the in-app update banner lives
 * inside the tree that just crashed, so it can't help here.
 *
 * Deliberately plain: no router, query, or UI-kit dependencies that could be
 * the thing that broke.
 */

const RECOVERY_FLAG = "open_sunsama_error_recovery_at";
const PENDING_RESET_FLAG = "open_sunsama_pending_cache_reset";
const RECOVERY_WINDOW_MS = 60_000;
const CACHE_KEY_PREFIX = "open_sunsama_rq_cache";
const SESSION_KEYS = ["open_sunsama_token", "open_sunsama_user"];
const ISSUES_URL = "https://github.com/ShadowWalker2014/open-sunsama/issues/new";

function removeLocalKeys(match: (key: string) => boolean) {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && match(key)) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage unavailable; nothing to clear.
  }
}

/** Clears cached server data. Keeps the session, so the user stays signed in. */
export function resetLocalData() {
  removeLocalKeys((key) => key.startsWith(CACHE_KEY_PREFIX));
  // A throttled persist can still write the old cache back before the reload
  // lands, so clear it again on the next start, before it's restored.
  try {
    sessionStorage.setItem(PENDING_RESET_FLAG, "1");
  } catch {
    // ignore
  }
}

/** Call before the query cache is restored (main.tsx). */
export function applyPendingCacheReset() {
  try {
    if (sessionStorage.getItem(PENDING_RESET_FLAG) !== "1") return;
    sessionStorage.removeItem(PENDING_RESET_FLAG);
  } catch {
    return;
  }
  removeLocalKeys((key) => key.startsWith(CACHE_KEY_PREFIX));
}

function recoveredRecently(): boolean {
  try {
    const at = Number(sessionStorage.getItem(RECOVERY_FLAG));
    return Number.isFinite(at) && Date.now() - at < RECOVERY_WINDOW_MS;
  } catch {
    // Without sessionStorage we can't tell, so don't risk a reload loop.
    return true;
  }
}

function markRecovered() {
  try {
    sessionStorage.setItem(RECOVERY_FLAG, String(Date.now()));
  } catch {
    // ignore
  }
}

function describe(error: unknown): { message: string; stack: string } {
  if (error instanceof Error) return { message: error.message, stack: error.stack ?? "" };
  return { message: String(error), stack: "" };
}

type UpdateState = "idle" | "checking" | "installing" | "none" | "failed";

export function AppErrorScreen({ error }: { error: unknown }) {
  const [autoRecovering] = React.useState(() => !recoveredRecently());
  const [updateState, setUpdateState] = React.useState<UpdateState>("idle");
  const [copied, setCopied] = React.useState(false);
  const desktop = isDesktop();
  const { message, stack } = describe(error);

  React.useEffect(() => {
    console.error("[AppErrorScreen]", error);
    if (!autoRecovering) return;
    markRecovered();
    resetLocalData();
    window.location.reload();
  }, [autoRecovering, error]);

  const reload = () => window.location.reload();

  const resetAndReload = () => {
    resetLocalData();
    window.location.reload();
  };

  const signOut = () => {
    resetLocalData();
    removeLocalKeys((key) => SESSION_KEYS.includes(key));
    window.location.assign("/login");
  };

  const installUpdate = async () => {
    setUpdateState("checking");
    try {
      if (!(await checkForUpdate())) {
        setUpdateState("none");
        return;
      }
      setUpdateState("installing");
      await downloadAndInstallUpdate();
    } catch {
      setUpdateState("failed");
    }
  };

  const copyDetails = async () => {
    const details = [
      `Error: ${message}`,
      `URL: ${window.location.href}`,
      `App: ${desktop ? "desktop" : "web"}`,
      `User agent: ${navigator.userAgent}`,
      stack,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(details);
      setCopied(true);
    } catch {
      // Clipboard blocked; the message is still on screen.
    }
  };

  if (autoRecovering) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-sm text-muted-foreground">
        Something went wrong. Reloading…
      </div>
    );
  }

  const button =
    "inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors disabled:opacity-60";
  const primary = `${button} bg-primary text-primary-foreground hover:bg-primary/90`;
  const secondary = `${button} border border-border bg-background text-foreground hover:bg-muted`;

  const updateLabel: Record<UpdateState, string> = {
    idle: "Install latest version",
    checking: "Checking for updates…",
    installing: "Installing update…",
    none: "You're on the latest version",
    failed: "Update failed. Try again",
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-md space-y-5">
        <div className="space-y-2">
          <h1 className="text-lg font-semibold">Open Sunsama hit an error</h1>
          <p className="text-sm text-muted-foreground">
            Your tasks are safe on the server. Reload to try again. If it keeps happening, reset
            local data: it clears this device's cached copy and keeps you signed in.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className={primary} onClick={reload}>
            Reload
          </button>
          <button type="button" className={secondary} onClick={resetAndReload}>
            Reset local data
          </button>
          {desktop && (
            <button
              type="button"
              className={secondary}
              onClick={installUpdate}
              disabled={updateState === "checking" || updateState === "installing"}
            >
              {updateLabel[updateState]}
            </button>
          )}
          <button type="button" className={secondary} onClick={signOut}>
            Sign out
          </button>
        </div>

        <details className="rounded-md border border-border bg-muted/40 p-3 text-xs">
          <summary className="cursor-pointer select-none font-medium">Error details</summary>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-muted-foreground">
            {message}
            {stack ? `\n\n${stack}` : ""}
          </pre>
          <div className="mt-3 flex gap-3">
            <button type="button" className="underline underline-offset-2" onClick={copyDetails}>
              {copied ? "Copied" : "Copy details"}
            </button>
            <a className="underline underline-offset-2" href={ISSUES_URL} target="_blank" rel="noreferrer">
              Report the issue
            </a>
          </div>
        </details>
      </div>
    </div>
  );
}

/** Catches errors outside the router (providers, the router itself). */
export class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: unknown }
> {
  state: { error: unknown } = { error: null };

  static getDerivedStateFromError(error: unknown) {
    return { error: error ?? new Error("Unknown error") };
  }

  render() {
    if (this.state.error) return <AppErrorScreen error={this.state.error} />;
    return this.props.children;
  }
}
