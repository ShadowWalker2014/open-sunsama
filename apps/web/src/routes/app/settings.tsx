import * as React from "react";
import { User, Lock, Palette, Bell, Key, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ApiKeysSettings,
  PasswordSettings,
  ProfileSettings,
  AppearanceSettings,
  NotificationSettings,
  TaskSettings,
} from "@/components/settings";

type SettingsTab = "profile" | "security" | "appearance" | "tasks" | "notifications" | "api";

const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Lock },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "api", label: "API Keys", icon: Key },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState<SettingsTab>("profile");

  return (
    <div className="flex h-[calc(100vh-2.75rem)] overflow-hidden">
      {/* Left Navigation - Linear style */}
      <nav className="w-48 flex-shrink-0 border-r border-border/40 bg-background/50 p-2">
        <div className="space-y-0.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded px-2 py-1.5 text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-xl px-6 py-4">
          {activeTab === "profile" && <ProfileSettings />}
          {activeTab === "security" && <PasswordSettings />}
          {activeTab === "appearance" && <AppearanceSettings />}
          {activeTab === "tasks" && <TaskSettings />}
          {activeTab === "notifications" && <NotificationSettings />}
          {activeTab === "api" && <ApiKeysSettings />}
        </div>
      </main>
    </div>
  );
}
