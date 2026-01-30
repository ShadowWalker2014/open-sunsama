import * as React from "react";
import {
  type ThemeMode,
  type FontFamily,
  type UserPreferences,
  DEFAULT_PREFERENCES,
  COLOR_THEMES,
  FONT_OPTIONS,
} from "@/lib/themes";
import { useAuth } from "@/hooks/useAuth";
import { useSavePreferences } from "@/hooks/useUserPreferences";

const STORAGE_KEY = "open_sunsama_preferences";

interface ThemeContextValue {
  // Current values
  themeMode: ThemeMode;
  colorTheme: string;
  fontFamily: FontFamily;
  
  // Computed
  resolvedTheme: "light" | "dark"; // Actual applied theme (after resolving 'system')
  
  // Setters
  setThemeMode: (mode: ThemeMode) => void;
  setColorTheme: (theme: string) => void;
  setFontFamily: (font: FontFamily) => void;
  
  // Utility
  isLoading: boolean;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

// Get stored preferences from localStorage
function getStoredPreferences(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        themeMode: parsed.themeMode || DEFAULT_PREFERENCES.themeMode,
        colorTheme: parsed.colorTheme || DEFAULT_PREFERENCES.colorTheme,
        fontFamily: parsed.fontFamily || DEFAULT_PREFERENCES.fontFamily,
      };
    }
  } catch {
    // Ignore parse errors
  }
  
  return DEFAULT_PREFERENCES;
}

// Save preferences to localStorage
function savePreferences(prefs: UserPreferences) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

// Resolve system theme preference
function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Get initial resolved theme from stored preferences (for sync initialization)
function getInitialResolvedTheme(): "light" | "dark" {
  const prefs = getStoredPreferences();
  if (prefs.themeMode === "system") {
    return getSystemTheme();
  }
  return prefs.themeMode;
}

// Apply theme to document
function applyTheme(mode: ThemeMode, colorTheme: string, fontFamily: FontFamily) {
  const root = document.documentElement;
  
  // Resolve actual theme
  const resolvedMode = mode === "system" ? getSystemTheme() : mode;
  
  // Apply dark/light mode
  if (resolvedMode === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  
  // Remove all theme classes
  COLOR_THEMES.forEach(t => {
    root.classList.remove(`theme-${t.id}`);
  });
  
  // Apply color theme (skip for default)
  if (colorTheme !== "default") {
    root.classList.add(`theme-${colorTheme}`);
  }
  
  // Remove all font classes
  FONT_OPTIONS.forEach(f => {
    root.classList.remove(`font-${f.id}`);
  });
  
  // Apply font family
  root.classList.add(`font-${fontFamily}`);
  
  return resolvedMode;
}

// Debounce utility
function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Use lazy initialization to read from localStorage on first render
  // This ensures React state is in sync with what index.html script already applied
  const [preferences, setPreferences] = React.useState<UserPreferences>(getStoredPreferences);
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">(getInitialResolvedTheme);
  const [isLoading] = React.useState(false);
  const [hasLoadedFromUser, setHasLoadedFromUser] = React.useState(false);
  
  // Get user and save mutation for DB sync
  const { user } = useAuth();
  const savePreferencesMutation = useSavePreferences();

  // Apply theme on mount to ensure DOM is in sync (index.html should have done this, but this is a safety net)
  // We read from localStorage directly to avoid dependency on React state
  React.useEffect(() => {
    const stored = getStoredPreferences();
    applyTheme(stored.themeMode, stored.colorTheme, stored.fontFamily);
  }, []);

  // Load preferences from user when they log in
  React.useEffect(() => {
    if (user?.preferences && !hasLoadedFromUser) {
      const prefs = user.preferences as UserPreferences;
      setPreferences(prefs);
      savePreferences(prefs); // Cache to localStorage
      const resolved = applyTheme(prefs.themeMode, prefs.colorTheme, prefs.fontFamily as FontFamily);
      setResolvedTheme(resolved);
      setHasLoadedFromUser(true);
    }
  }, [user?.preferences, hasLoadedFromUser]);

  // Reset hasLoadedFromUser when user logs out
  React.useEffect(() => {
    if (!user) {
      setHasLoadedFromUser(false);
    }
  }, [user]);

  // Debounced save to database - user check is done at call site to avoid stale closures
  const debouncedSaveToDb = React.useMemo(
    () =>
      debounce((prefs: UserPreferences) => {
        savePreferencesMutation.mutate(prefs);
      }, 500),
    [savePreferencesMutation]
  );

  // Listen for system theme changes
  React.useEffect(() => {
    if (preferences.themeMode !== "system") return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const resolved = applyTheme(preferences.themeMode, preferences.colorTheme, preferences.fontFamily);
      setResolvedTheme(resolved);
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [preferences]);

  const setThemeMode = React.useCallback((mode: ThemeMode) => {
    setPreferences(prev => {
      const newPrefs = { ...prev, themeMode: mode };
      savePreferences(newPrefs);
      if (user) {
        debouncedSaveToDb(newPrefs);
      }
      const resolved = applyTheme(mode, prev.colorTheme, prev.fontFamily);
      setResolvedTheme(resolved);
      return newPrefs;
    });
  }, [debouncedSaveToDb, user]);

  const setColorTheme = React.useCallback((theme: string) => {
    setPreferences(prev => {
      const newPrefs = { ...prev, colorTheme: theme };
      savePreferences(newPrefs);
      if (user) {
        debouncedSaveToDb(newPrefs);
      }
      applyTheme(prev.themeMode, theme, prev.fontFamily);
      return newPrefs;
    });
  }, [debouncedSaveToDb, user]);

  const setFontFamily = React.useCallback((font: FontFamily) => {
    setPreferences(prev => {
      const newPrefs = { ...prev, fontFamily: font };
      savePreferences(newPrefs);
      if (user) {
        debouncedSaveToDb(newPrefs);
      }
      applyTheme(prev.themeMode, prev.colorTheme, font);
      return newPrefs;
    });
  }, [debouncedSaveToDb, user]);

  const value = React.useMemo(
    () => ({
      themeMode: preferences.themeMode,
      colorTheme: preferences.colorTheme,
      fontFamily: preferences.fontFamily,
      resolvedTheme,
      setThemeMode,
      setColorTheme,
      setFontFamily,
      isLoading,
    }),
    [preferences, resolvedTheme, setThemeMode, setColorTheme, setFontFamily, isLoading]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
