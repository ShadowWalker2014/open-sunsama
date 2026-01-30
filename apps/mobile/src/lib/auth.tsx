import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { User, LoginInput, CreateUserInput, AuthResponse, UpdateUserInput } from '@open-sunsama/types';
import { getApi, setAuthToken, clearAuthToken, getToken, setToken, removeToken, initializeApi } from './api';
import { getDeviceTimezone } from './timezone';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setTokenState] = React.useState<string | null>(null);
  const [initialized, setInitialized] = React.useState(false);

  // Initialize auth on mount
  React.useEffect(() => {
    (async () => {
      await initializeApi();
      const storedToken = await getToken();
      if (storedToken) {
        setTokenState(storedToken);
        setAuthToken(storedToken);
      }
      setInitialized(true);
    })();
  }, []);

  // Track if timezone sync has been attempted for this session
  const timezoneSyncAttempted = React.useRef(false);

  // Fetch current user
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      if (!token) return null;
      try {
        const api = getApi();
        return await api.auth.getMe();
      } catch {
        // If token is invalid, clear auth
        await removeToken();
        clearAuthToken();
        setTokenState(null);
        return null;
      }
    },
    enabled: initialized && !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  // Sync device timezone with server
  React.useEffect(() => {
    if (!user || timezoneSyncAttempted.current) return;
    
    const deviceTimezone = getDeviceTimezone();
    
    // Only update if different from server
    if (deviceTimezone && deviceTimezone !== user.timezone) {
      timezoneSyncAttempted.current = true;
      console.log(`[Timezone Sync] Updating timezone from ${user.timezone} to ${deviceTimezone}`);
      
      const api = getApi();
      api.auth.updateMe({ timezone: deviceTimezone })
        .then((updatedUser) => {
          queryClient.setQueryData(['auth', 'me'], updatedUser);
        })
        .catch((error) => {
          console.error('[Timezone Sync] Failed to update timezone:', error);
          // Reset flag so we can try again later
          timezoneSyncAttempted.current = false;
        });
    } else {
      timezoneSyncAttempted.current = true;
    }
  }, [user?.id]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginInput): Promise<AuthResponse> => {
      const api = getApi();
      return await api.auth.login(credentials);
    },
    onSuccess: async (data) => {
      await setToken(data.token);
      setAuthToken(data.token);
      setTokenState(data.token);
      queryClient.setQueryData(['auth', 'me'], data.user);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: CreateUserInput): Promise<AuthResponse> => {
      const api = getApi();
      return await api.auth.register(data);
    },
    onSuccess: async (data) => {
      await setToken(data.token);
      setAuthToken(data.token);
      setTokenState(data.token);
      queryClient.setQueryData(['auth', 'me'], data.user);
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: UpdateUserInput): Promise<User> => {
      const api = getApi();
      return await api.auth.updateMe(data);
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['auth', 'me'], updatedUser);
    },
  });

  const login = React.useCallback(async (credentials: LoginInput) => {
    await loginMutation.mutateAsync(credentials);
  }, [loginMutation]);

  const register = React.useCallback(async (data: CreateUserInput) => {
    await registerMutation.mutateAsync(data);
  }, [registerMutation]);

  const logout = React.useCallback(async () => {
    await removeToken();
    clearAuthToken();
    setTokenState(null);
    queryClient.setQueryData(['auth', 'me'], null);
    queryClient.clear();
  }, [queryClient]);

  const updateUser = React.useCallback(async (data: UpdateUserInput) => {
    await updateUserMutation.mutateAsync(data);
  }, [updateUserMutation]);

  const isLoading = !initialized || (!!token && isUserLoading);

  const value = React.useMemo<AuthContextValue>(() => ({
    user: user ?? null,
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
