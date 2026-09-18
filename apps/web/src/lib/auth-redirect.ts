/**
 * Post-login redirects (`/login?redirect=/oauth/consent?...`). Only same-site
 * paths are honored so the parameter can't be used as an open redirect.
 */

export function getSafeRedirect(): string | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("redirect");
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return null;
  }
  return value;
}

/** `/login` or `/register` carrying the current redirect target along. */
export function withRedirect(path: "/login" | "/register", redirect: string | null): string {
  return redirect ? `${path}?redirect=${encodeURIComponent(redirect)}` : path;
}
