/**
 * OAuth consent screen for MCP connectors (Claude, ChatGPT, Cursor, ...).
 *
 * The API's /oauth/authorize validates the request and sends the browser here
 * with a signed `request`. The signed-in user approves or denies; the API
 * mints the authorization code and we bounce back to the app's redirect URI.
 */

import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeftRight, BadgeCheck, CalendarClock, CheckSquare, Loader2, ShieldAlert, UserRound } from "lucide-react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { AppLogo } from "@/components/settings/app-logo";
import { Button } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import { withRedirect } from "@/lib/auth-redirect";
import { trackGoal } from "@/lib/analytics";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface ConsentDetails {
  client: {
    name: string;
    uri: string | null;
    logoUri: string | null;
    verifiedDomain: string | null;
  };
  redirectHost: string;
  scopes: string[];
}

const PERMISSION_GROUPS = [
  {
    icon: CheckSquare,
    label: "Tasks and subtasks",
    read: "tasks:read",
    write: "tasks:write",
  },
  {
    icon: CalendarClock,
    label: "Calendar time blocks",
    read: "time-blocks:read",
    write: "time-blocks:write",
  },
  {
    icon: UserRound,
    label: "Profile (name, email, timezone)",
    read: "user:read",
    write: "user:write",
  },
] as const;

function describeAccess(scopes: string[], read: string, write: string): string | null {
  const canRead = scopes.includes(read);
  const canWrite = scopes.includes(write);
  if (canRead && canWrite) return "View and edit";
  if (canWrite) return "Edit";
  if (canRead) return "View";
  return null;
}

function ConsentError({ title, message }: { title: string; message: string }) {
  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-3 text-center">
        <ShieldAlert className="h-8 w-8 text-destructive" />
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        <a
          href="/docs/mcp/overview"
          className="text-sm text-foreground underline underline-offset-4"
        >
          How to connect an AI assistant
        </a>
      </div>
    </AuthLayout>
  );
}

export default function OAuthConsentPage() {
  useSEO({
    title: "Authorize access",
    description: "Allow an AI assistant to connect to your Open Sunsama account.",
    noindex: true,
  });
  const navigate = useNavigate();
  const { user, token, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();

  const params = React.useMemo(() => new URLSearchParams(window.location.search), []);
  const request = params.get("request");
  const upstreamError = params.get("error_description") ?? params.get("error");
  const currentPath = `${window.location.pathname}${window.location.search}`;

  const [details, setDetails] = React.useState<ConsentDetails | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState<"allow" | "deny" | null>(null);

  React.useEffect(() => {
    if (!request) return;
    fetch(`${API_URL}/oauth/consent?request=${encodeURIComponent(request)}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error_description ?? "This authorization link is invalid.");
        setDetails(body as ConsentDetails);
      })
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : "This authorization link is invalid.");
      });
  }, [request]);

  const decide = async (decision: "allow" | "deny") => {
    if (!request || !token) return;
    setSubmitting(decision);
    try {
      const res = await fetch(`${API_URL}/oauth/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ request, decision }),
      });
      if (res.status === 401) {
        logout();
        void navigate({ href: withRedirect("/login", currentPath), replace: true });
        return;
      }
      const body = await res.json();
      if (!res.ok || !body.redirectTo) {
        throw new Error(body.error_description ?? "Something went wrong. Please try connecting again.");
      }
      if (decision === "allow") {
        trackGoal("connect_ai", { client: details?.client.name ?? "unknown" });
        // The goal is sent by XHR, which navigating away would cancel.
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      window.location.assign(body.redirectTo as string);
    } catch (error) {
      setSubmitting(null);
      setLoadError(error instanceof Error ? error.message : "Something went wrong.");
    }
  };

  if (upstreamError) {
    return <ConsentError title="Can't connect this app" message={upstreamError} />;
  }
  if (!request) {
    return (
      <ConsentError
        title="Nothing to authorize"
        message="Start connecting from Claude, ChatGPT, or your AI assistant, and it will bring you here."
      />
    );
  }
  if (loadError) {
    return <ConsentError title="Can't connect this app" message={loadError} />;
  }
  if (!details || isAuthLoading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </AuthLayout>
    );
  }

  const { client } = details;

  return (
    <AuthLayout className="p-0">
      <div className="p-6 pb-5">
        <div className="mb-5 flex items-center justify-center gap-3">
          <AppLogo
            name={client.name}
            logoUri={client.logoUri}
            className="h-11 w-11 rounded-xl"
            imageClassName="h-7 w-7"
          />
          <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          <img
            src="/open-sunsama-logo.png"
            alt=""
            className="h-11 w-11 rounded-xl border object-cover"
          />
        </div>

        <h1 className="text-center text-lg font-semibold tracking-tight">
          {client.name} wants to access your Open Sunsama account
        </h1>
        {client.verifiedDomain && (
          <p className="mt-1.5 flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <BadgeCheck className="h-3.5 w-3.5 text-primary" />
            Verified app from {client.verifiedDomain}
          </p>
        )}
      </div>

      <div className="border-t px-6 py-4">
        <p className="mb-3 text-xs font-medium text-muted-foreground">
          {isAuthenticated ? "It will be able to:" : "It is asking to:"}
        </p>
        <ul className="space-y-2.5">
          {PERMISSION_GROUPS.map(({ icon: Icon, label, read, write }) => {
            const access = describeAccess(details.scopes, read, write);
            if (!access) return null;
            return (
              <li key={label} className="flex items-center gap-2.5 text-sm">
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1">{label}</span>
                <span className="text-xs text-muted-foreground">{access}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="border-t px-6 py-5">
        {isAuthenticated ? (
          <>
            <div className="mb-4 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="truncate">
                Signed in as <span className="font-medium text-foreground">{user?.email}</span>
              </span>
              <button
                type="button"
                className="shrink-0 underline underline-offset-4 hover:text-foreground"
                onClick={() => {
                  logout();
                  void navigate({ href: withRedirect("/login", currentPath) });
                }}
              >
                Switch account
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-9 text-[13px]"
                disabled={submitting !== null}
                onClick={() => decide("deny")}
              >
                {submitting === "deny" && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Cancel
              </Button>
              <Button
                className="h-9 text-[13px]"
                disabled={submitting !== null}
                onClick={() => decide("allow")}
              >
                {submitting === "allow" && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Allow access
              </Button>
            </div>
          </>
        ) : (
          <div className="grid gap-2">
            <Button
              className="h-9 text-[13px]"
              onClick={() => void navigate({ href: withRedirect("/login", currentPath) })}
            >
              Sign in to continue
            </Button>
            <Button
              variant="outline"
              className="h-9 text-[13px]"
              onClick={() => void navigate({ href: withRedirect("/register", currentPath) })}
            >
              Create an account
            </Button>
          </div>
        )}
        <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
          You'll be sent back to <span className="font-medium">{details.redirectHost}</span>. You can
          disconnect it anytime in Settings → MCP.
        </p>
      </div>
    </AuthLayout>
  );
}
