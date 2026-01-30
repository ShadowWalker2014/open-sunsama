import * as React from "react";
import { User, Lock, Palette, Bell, Key } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ApiKeysSettings,
  PasswordSettings,
  ProfileSettings,
  AppearanceSettings,
  NotificationSettings,
} from "@/components/settings";

type SettingsTab = "profile" | "security" | "appearance" | "notifications" | "api";

const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Lock },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "api", label: "API Keys", icon: Key },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState<SettingsTab>("profile");

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Left Navigation - Linear style */}
      <nav className="w-56 flex-shrink-0 border-r border-border/40 bg-background/50 p-3">
        <div className="space-y-0.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl px-8 py-6">
          {activeTab === "profile" && <ProfileSettings />}
          {activeTab === "security" && <PasswordSettings />}
          {activeTab === "appearance" && <AppearanceSettings />}
          {activeTab === "notifications" && <NotificationSettings />}
          {activeTab === "api" && <ApiKeysSettings />}
        </div>
      </main>
    </div>
  );
}
