import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User, LoginInput, CreateUserInput, AuthResponse, UpdateUserInput } from "@open-sunsama/types";
import { getApi, setAuthToken, clearApiClient } from "@/lib/api";

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

/**
 * Get stored auth token from localStorage
 */
function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Get stored user from localStorage
 */
function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(AUTH_USER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Store auth data in localStorage
 */
function storeAuthData(token: string, user: User): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  setAuthToken(token);
}

/**
 * Clear auth data from localStorage
 */
function clearAuthData(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  clearApiClient();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = React.useState<string | null>(getStoredToken);
  
  // Initialize API client with stored token
  React.useEffect(() => {
    const storedToken = getStoredToken();
    if (storedToken) {
      setAuthToken(storedToken);
    }
  }, []);

  // Fetch current user
  const { data: user, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      if (!token) return null;
      try {
        const api = getApi();
        return await api.auth.getMe();
      } catch {
        // If token is invalid, clear auth
        clearAuthData();
        setToken(null);
        return null;
      }
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginInput): Promise<AuthResponse> => {
      const api = getApi();
      return await api.auth.login(credentials);
    },
    onSuccess: (data) => {
      storeAuthData(data.token, data.user);
      setToken(data.token);
      queryClient.setQueryData(["auth", "me"], data.user);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: CreateUserInput): Promise<AuthResponse> => {
      const api = getApi();
      return await api.auth.register(data);
    },
    onSuccess: (data) => {
      storeAuthData(data.token, data.user);
      setToken(data.token);
      queryClient.setQueryData(["auth", "me"], data.user);
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: UpdateUserInput): Promise<User> => {
      const api = getApi();
      return await api.auth.updateMe(data);
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["auth", "me"], updatedUser);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
    },
  });

  const login = React.useCallback(async (credentials: LoginInput) => {
    await loginMutation.mutateAsync(credentials);
  }, [loginMutation]);

  const register = React.useCallback(async (data: CreateUserInput) => {
    await registerMutation.mutateAsync(data);
  }, [registerMutation]);

  const logout = React.useCallback(() => {
    clearAuthData();
    setToken(null);
    queryClient.setQueryData(["auth", "me"], null);
    queryClient.clear();
  }, [queryClient]);

  const updateUser = React.useCallback(async (data: UpdateUserInput) => {
    await updateUserMutation.mutateAsync(data);
  }, [updateUserMutation]);

  const value = React.useMemo<AuthContextValue>(() => ({
    user: user ?? getStoredUser(),
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  }), [user, token, isLoading, login, register, logout, updateUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
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
