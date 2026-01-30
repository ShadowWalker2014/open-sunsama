import * as React from "react";
import { Monitor, Sun, Moon, Check } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { COLOR_THEMES, FONT_OPTIONS, type ThemeMode } from "@/lib/themes";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui";

const THEME_MODES: { id: ThemeMode; label: string; icon: React.ElementType }[] = [
  { id: "system", label: "System", icon: Monitor },
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
];

export function AppearanceSettings() {
  const { themeMode, colorTheme, fontFamily, setThemeMode, setColorTheme, setFontFamily, resolvedTheme } = useTheme();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Appearance</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Customize the look and feel of your workspace
        </p>
      </div>

      {/* Theme Mode - Segmented Control */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Theme</Label>
        <div className="inline-flex items-center rounded-lg border border-border bg-muted/30 p-1">
          {THEME_MODES.map((mode) => {
            const Icon = mode.icon;
            const isActive = themeMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setThemeMode(mode.id)}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Themes - Grid Picker */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Accent Color</Label>
        <div className="grid grid-cols-4 gap-3">
          {COLOR_THEMES.map((theme) => {
            const isActive = colorTheme === theme.id;
            const previewColor = resolvedTheme === "dark" ? theme.preview.dark : theme.preview.light;
            
            return (
              <button
                key={theme.id}
                onClick={() => setColorTheme(theme.id)}
                className={cn(
                  "group relative flex flex-col items-center gap-2 rounded-lg border p-3 transition-all",
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border/50 hover:border-border hover:bg-accent/30"
                )}
              >
                {/* Color preview circle */}
                <div
                  className={cn(
                    "h-8 w-8 rounded-full transition-all",
                    isActive && "ring-2 ring-offset-2 ring-offset-background"
                  )}
                  style={{ 
                    backgroundColor: previewColor,
                    ...(isActive && { "--tw-ring-color": previewColor } as React.CSSProperties),
                  }}
                >
                  {isActive && (
                    <div className="flex h-full items-center justify-center">
                      <Check className="h-4 w-4 text-white drop-shadow-sm" />
                    </div>
                  )}
                </div>
                {/* Theme name */}
                <span className={cn(
                  "text-xs font-medium",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}>
                  {theme.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Font Family */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Font</Label>
        <div className="space-y-2">
          {FONT_OPTIONS.map((font) => {
            const isActive = fontFamily === font.id;
            
            return (
              <button
                key={font.id}
                onClick={() => setFontFamily(font.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-all",
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border/50 hover:border-border hover:bg-accent/30"
                )}
              >
                <div>
                  <p 
                    className="text-sm font-medium"
                    style={{ fontFamily: font.fontFamily }}
                  >
                    {font.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {font.description}
                  </p>
                </div>
                {isActive && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AppearanceSettings;
