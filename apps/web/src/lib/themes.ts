/**
 * Theme System for Open Sunsama
 * 8 unique color themes with light/dark variants
 */

export type ThemeMode = "light" | "dark" | "system";

export interface ColorTheme {
  id: string;
  name: string;
  description: string;
  // Primary accent color (used for buttons, links, focus)
  primary: { light: string; dark: string };
  // Preview colors for theme picker
  preview: { light: string; dark: string };
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: "default",
    name: "Default",
    description: "Classic neutral theme",
    primary: { light: "222.2 47.4% 11.2%", dark: "210 40% 98%" },
    preview: { light: "#1f2937", dark: "#f9fafb" },
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Deep blue waters",
    primary: { light: "221 83% 53%", dark: "217 91% 60%" },
    preview: { light: "#3b82f6", dark: "#60a5fa" },
  },
  {
    id: "forest",
    name: "Forest",
    description: "Natural green tones",
    primary: { light: "142 76% 36%", dark: "142 71% 45%" },
    preview: { light: "#16a34a", dark: "#22c55e" },
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm orange glow",
    primary: { light: "24 95% 53%", dark: "20 90% 48%" },
    preview: { light: "#f97316", dark: "#ea580c" },
  },
  {
    id: "lavender",
    name: "Lavender",
    description: "Soft purple hues",
    primary: { light: "262 83% 58%", dark: "263 70% 50%" },
    preview: { light: "#8b5cf6", dark: "#a78bfa" },
  },
  {
    id: "rose",
    name: "Rose",
    description: "Elegant pink tones",
    primary: { light: "330 81% 60%", dark: "330 90% 66%" },
    preview: { light: "#ec4899", dark: "#f472b6" },
  },
  {
    id: "amber",
    name: "Amber",
    description: "Golden warmth",
    primary: { light: "45 93% 47%", dark: "43 96% 56%" },
    preview: { light: "#eab308", dark: "#facc15" },
  },
  {
    id: "slate",
    name: "Slate",
    description: "Professional cool gray",
    primary: { light: "215 20% 40%", dark: "215 20% 65%" },
    preview: { light: "#64748b", dark: "#94a3b8" },
  },
];

export type FontFamily = "geist" | "system" | "inter" | "jetbrains";

export interface FontOption {
  id: FontFamily;
  name: string;
  fontFamily: string;
  description: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: "geist",
    name: "Geist",
    fontFamily: '"Geist", "Geist Sans", system-ui, sans-serif',
    description: "Modern Vercel font",
  },
  {
    id: "system",
    name: "System",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    description: "Native system font",
  },
  {
    id: "inter",
    name: "Inter",
    fontFamily: '"Inter", system-ui, sans-serif',
    description: "Clean and readable",
  },
  {
    id: "jetbrains",
    name: "JetBrains Mono",
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    description: "Developer monospace",
  },
];

export interface UserPreferences {
  themeMode: ThemeMode;
  colorTheme: string;
  fontFamily: FontFamily;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  themeMode: "system",
  colorTheme: "default",
  fontFamily: "geist",
};

// CSS variable generation for a theme
export function generateThemeCSS(theme: ColorTheme, mode: "light" | "dark"): Record<string, string> {
  const primary = theme.primary[mode];
  
  return {
    "--primary": primary,
    "--primary-foreground": mode === "dark" ? "222.2 47.4% 11.2%" : "210 40% 98%",
    "--ring": primary,
  };
}
