import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  User,
  LoginInput,
  CreateUserInput,
  AuthResponse,
  UpdateUserInput,
} from "@open-sunsama/types";
import {
  getApi,
  setAuthToken,
  clearApiClient,
  refreshAuthToken,
  onTokenRefreshed,
  getTokenExpiryMs,
} from "@/lib/api";
import { clearPersistedCache } from "@/lib/query-persister";
import { trackGoal } from "@/lib/analytics";

// Refresh the access token this long before it expires. With the default 7d
// token lifetime, an active user is renewed roughly a day before expiry, so
// the token never actually lapses while the app is in use.
const REFRESH_BEFORE_EXPIRY_MS = 24 * 60 * 60 * 1000;
// setTimeout clamps delays larger than ~24.8 days; cap to stay well under it.
const MAX_TIMEOUT_MS = 2 ** 31 - 1;
// If a proactive refresh fails (transient network/server blip), retry on this
// fixed interval rather than recomputing a now-zero delay, which would spin.
const REFRESH_RETRY_MS = 5 * 60 * 1000;

const AUTH_TOKEN_KEY = "open_sunsama_token";
const AUTH_USER_KEY = "open_sunsama_user";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (credentials: LoginInput) => Promise<void>;
  register: (data: CreateUserInput) => Promise<void>;
  logout: () => void;
  updateUser: (data: UpdateUserInput) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(AUTH_USER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as User;
  } catch {
    return null;
  }
}

function storeAuthData(token: string, user: User): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  setAuthToken(token);
}

function clearAuthData(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  clearApiClient();
  clearPersistedCache();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = React.useState<string | null>(getStoredToken);
  // Seed the user from localStorage so the app can render with a known user
  // immediately on cold start — the /auth/me roundtrip then hydrates the
  // canonical user in the background.
  const [cachedUser, setCachedUser] = React.useState<User | null>(getStoredUser);

  React.useEffect(() => {
    const storedToken = getStoredToken();
    if (storedToken) {
      setAuthToken(storedToken);
    }
  }, []);

  // Mirror background token refreshes (proactive timer or 401 auto-retry) into
  // React state so isAuthenticated stays true and the WebSocket reconnects
  // with the new token instead of being dropped when the old one expires.
  React.useEffect(() => {
    return onTokenRefreshed((newToken) => {
      setToken(newToken);
    });
  }, []);

  // Proactively refresh the token before it expires so an active session is
  // never logged out. We schedule a timer for ~1 day before expiry and also
  // re-check whenever the tab becomes visible — background timers get throttled
  // by the browser, so a long-open-but-hidden tab can't be relied on alone.
  React.useEffect(() => {
    if (!token) return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = () => {
      void refreshAuthToken().then((newToken) => {
        // On success the token state changes and this effect re-runs, which
        // reschedules cleanly. On failure nothing changes, so re-arm here on a
        // fixed backoff — otherwise one transient failure would permanently
        // disable proactive refresh for the session.
        if (!newToken) {
          if (timer) clearTimeout(timer);
          timer = setTimeout(tick, REFRESH_RETRY_MS);
        }
      });
    };

    const schedule = () => {
      if (timer) clearTimeout(timer);
      const exp = getTokenExpiryMs(token);
      if (exp == null) return;
      const delay = Math.max(0, exp - Date.now() - REFRESH_BEFORE_EXPIRY_MS);
      timer = setTimeout(tick, Math.min(delay, MAX_TIMEOUT_MS));
    };

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      const exp = getTokenExpiryMs(token);
      if (exp != null && exp - Date.now() <= REFRESH_BEFORE_EXPIRY_MS) {
        void refreshAuthToken();
      } else {
        schedule();
      }
    };

    schedule();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [token]);

  // Keep the cached user query primed so consumers reading from
  // ["auth", "me"] never see undefined when we already have a value on disk.
  React.useEffect(() => {
    if (cachedUser) {
      const existing = queryClient.getQueryData<User | null>(["auth", "me"]);
      if (!existing) {
        queryClient.setQueryData(["auth", "me"], cachedUser);
      }
    }
  }, [cachedUser, queryClient]);

  // Background refresh of the user. We seed initialData from localStorage so
  // the query starts with a value and `isLoading` is false on first render.
  const { data: user } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      if (!token) return null;
      try {
        const api = getApi();
        const me = await api.auth.getMe();
        // Keep localStorage in sync with the canonical server user.
        try {
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(me));
        } catch {
          // ignore quota errors
        }
        return me;
      } catch {
        clearAuthData();
        setToken(null);
        setCachedUser(null);
        return null;
      }
    },
    enabled: !!token,
    initialData: cachedUser ?? undefined,
    // Treat the cached user as fresh for 30s — avoids a refetch on every
    // mount (e.g. when the user navigates back to /app).
    staleTime: 30 * 1000,
    gcTime: Infinity,
    retry: false,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginInput): Promise<AuthResponse> => {
      const api = getApi();
      return await api.auth.login(credentials);
    },
    onSuccess: (data) => {
      storeAuthData(data.token, data.user);
      setToken(data.token);
      setCachedUser(data.user);
      queryClient.setQueryData(["auth", "me"], data.user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: CreateUserInput): Promise<AuthResponse> => {
      const api = getApi();
      return await api.auth.register(data);
    },
    onSuccess: (data) => {
      trackGoal("signup");
      storeAuthData(data.token, data.user);
      setToken(data.token);
      setCachedUser(data.user);
      queryClient.setQueryData(["auth", "me"], data.user);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: UpdateUserInput): Promise<User> => {
      const api = getApi();
      return await api.auth.updateMe(data);
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["auth", "me"], updatedUser);
      try {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
      } catch {
        // ignore
      }
      setCachedUser(updatedUser);
    },
  });

  const login = React.useCallback(
    async (credentials: LoginInput) => {
      await loginMutation.mutateAsync(credentials);
    },
    [loginMutation]
  );

  const register = React.useCallback(
    async (data: CreateUserInput) => {
      await registerMutation.mutateAsync(data);
    },
    [registerMutation]
  );

  const logout = React.useCallback(() => {
    clearAuthData();
    setToken(null);
    setCachedUser(null);
    queryClient.setQueryData(["auth", "me"], null);
    queryClient.clear();
  }, [queryClient]);

  const updateUser = React.useCallback(
    async (data: UpdateUserInput) => {
      await updateUserMutation.mutateAsync(data);
    },
    [updateUserMutation]
  );

  const effectiveUser = user ?? cachedUser;
  // We treat the user as authenticated as soon as a token exists. This lets
  // task/time-block queries fire in parallel with the /auth/me background
  // verification instead of waterfalling behind it. If /auth/me later fails,
  // clearAuthData() runs and queries are flushed.
  const isAuthenticated = !!token;
  // We only block on auth when there is no cached user AND the network
  // request is in-flight. With initialData seeded from localStorage this is
  // effectively never true after the first login.
  const isLoading = !!token && !effectiveUser;

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user: effectiveUser,
      token,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
      updateUser,
    }),
    [effectiveUser, token, isAuthenticated, isLoading, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication state and methods
 */
export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Hook to require authentication
 * Returns the authenticated user or redirects to login
 */
export function useRequireAuth(): User {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    throw new Promise(() => {}); // Suspend rendering
  }

  if (!isAuthenticated || !user) {
    throw new Error("Not authenticated");
  }

  return user;
}
