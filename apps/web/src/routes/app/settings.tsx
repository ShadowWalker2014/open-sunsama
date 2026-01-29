// @ts-nocheck
import * as React from "react";
import { useForm } from "react-hook-form";
import { Loader2, User, Bell, Palette, Key, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Separator,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui";
import { toast } from "@/hooks/use-toast";
import {
  ApiKeysSettings,
  PasswordSettings,
  TaskReminderDialog,
  EmailNotificationsDialog,
} from "@/components/settings";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  requestNotificationPermission,
  getNotificationPermissionStatus,
} from "@/hooks/useNotificationPreferences";
import { Switch, Skeleton } from "@/components/ui";

/**
 * Settings page with multiple sections
 */
export default function SettingsPage() {
  return (
    <div className="container max-w-4xl py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileSettings />
          </TabsContent>

          <TabsContent value="security">
            <PasswordSettings />
          </TabsContent>

          <TabsContent value="appearance">
            <AppearanceSettings />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="api">
            <ApiKeysSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface ProfileForm {
  name: string;
  email: string;
  timezone: string;
}

function ProfileSettings() {
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      timezone: user?.timezone ?? "America/New_York",
    },
  });

  const userInitials = React.useMemo(() => {
    if (!user?.name) return user?.email?.charAt(0).toUpperCase() ?? "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [user]);

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    try {
      await updateUser({
        name: data.name,
        timezone: data.timezone,
      });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description:
          error instanceof Error ? error.message : "Could not update profile",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Update your personal information and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.avatarUrl ?? undefined} />
              <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
            </Avatar>
            <div>
              <Button type="button" variant="outline" size="sm">
                Change Avatar
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">
                JPG, PNG or GIF. Max 2MB.
              </p>
            </div>
          </div>

          <Separator />

          {/* Form Fields */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                {...register("name", { required: "Name is required" })}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                {...register("timezone")}
                disabled={isLoading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading || !isDirty}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

const THEME_STORAGE_KEY = "chronoflow_theme";

type Theme = "light" | "dark" | "system";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "dark";
}

function applyTheme(theme: Theme) {
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  
  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

function AppearanceSettings() {
  const [theme, setTheme] = React.useState<Theme>(getStoredTheme);

  // Apply theme on mount and when it changes
  React.useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // Listen for system theme changes when in "system" mode
  React.useEffect(() => {
    if (theme !== "system") return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("system");
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const handleThemeChange = (value: string) => {
    setTheme(value as Theme);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize how Chronoflow looks on your device
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>Theme</Label>
          <div className="grid grid-cols-3 gap-4">
            {(["light", "dark", "system"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleThemeChange(option)}
                className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all hover:border-primary ${
                  theme === option ? "border-primary bg-accent" : ""
                }`}
              >
                <div
                  className={`h-16 w-full rounded-md border ${
                    option === "dark"
                      ? "bg-zinc-900"
                      : option === "light"
                        ? "bg-white"
                        : "bg-gradient-to-r from-white to-zinc-900"
                  }`}
                />
                <span className="text-sm font-medium capitalize">{option}</span>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationSettings() {
  const { data: preferences, isLoading, error } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();
  
  const [taskReminderDialogOpen, setTaskReminderDialogOpen] = React.useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = React.useState(false);
  const [pushLoading, setPushLoading] = React.useState(false);
  
  // Get browser notification permission status
  const permissionStatus = React.useMemo(() => {
    return getNotificationPermissionStatus();
  }, []);
  
  // Handler for task reminder dialog save
  const handleTaskReminderSave = async (
    taskRemindersEnabled: boolean,
    reminderTiming: number
  ) => {
    await updatePreferences.mutateAsync({
      taskRemindersEnabled,
      reminderTiming,
    });
    toast({
      title: "Task reminders updated",
      description: "Your task reminder settings have been saved.",
    });
  };
  
  // Handler for email notifications dialog save
  const handleEmailSave = async (
    emailNotificationsEnabled: boolean,
    dailySummaryEnabled: boolean
  ) => {
    await updatePreferences.mutateAsync({
      emailNotificationsEnabled,
      dailySummaryEnabled,
    });
    toast({
      title: "Email notifications updated",
      description: "Your email notification settings have been saved.",
    });
  };
  
  // Handler for browser push notifications toggle
  const handlePushToggle = async () => {
    if (!permissionStatus.supported) {
      toast({
        variant: "destructive",
        title: "Not supported",
        description: "Browser notifications are not supported in this browser.",
      });
      return;
    }
    
    const currentEnabled = preferences?.pushNotificationsEnabled ?? false;
    
    if (!currentEnabled) {
      // Trying to enable - request permission first
      setPushLoading(true);
      try {
        const permission = await requestNotificationPermission();
        
        if (permission === "granted") {
          await updatePreferences.mutateAsync({
            pushNotificationsEnabled: true,
          });
          toast({
            title: "Browser notifications enabled",
            description: "You will now receive browser notifications.",
          });
        } else if (permission === "denied") {
          toast({
            variant: "destructive",
            title: "Permission denied",
            description: "Please enable notifications in your browser settings.",
          });
        }
      } finally {
        setPushLoading(false);
      }
    } else {
      // Disabling
      setPushLoading(true);
      try {
        await updatePreferences.mutateAsync({
          pushNotificationsEnabled: false,
        });
        toast({
          title: "Browser notifications disabled",
          description: "You will no longer receive browser notifications.",
        });
      } finally {
        setPushLoading(false);
      }
    }
  };
  
  // Helper to get push button text
  const getPushButtonText = () => {
    if (pushLoading) return "...";
    if (!permissionStatus.supported) return "Not Supported";
    if (permissionStatus.permission === "denied") return "Blocked";
    if (preferences?.pushNotificationsEnabled) return "Enabled";
    return "Enable";
  };
  
  // Helper to get task reminders status text
  const getTaskReminderStatus = () => {
    if (!preferences) return "";
    if (!preferences.taskRemindersEnabled) return "Disabled";
    const timing = preferences.reminderTiming;
    if (timing === 60) return "1 hour before";
    if (timing === 120) return "2 hours before";
    return `${timing} min before`;
  };
  
  // Helper to get email status text
  const getEmailStatus = () => {
    if (!preferences) return "";
    if (!preferences.emailNotificationsEnabled) return "Disabled";
    if (preferences.dailySummaryEnabled) return "Daily summary";
    return "Enabled";
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Configure how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-destructive">Failed to load notification preferences</p>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Configure how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Task Reminders */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">Task Reminders</p>
                <p className="text-sm text-muted-foreground">
                  Get notified before scheduled tasks
                </p>
                {isLoading ? (
                  <Skeleton className="h-4 w-24 mt-1" />
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    Status: {getTaskReminderStatus()}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTaskReminderDialogOpen(true)}
                disabled={isLoading}
              >
                Configure
              </Button>
            </div>
            
            <Separator />
            
            {/* Email Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive daily summary emails
                </p>
                {isLoading ? (
                  <Skeleton className="h-4 w-20 mt-1" />
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    Status: {getEmailStatus()}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEmailDialogOpen(true)}
                disabled={isLoading}
              >
                Configure
              </Button>
            </div>
            
            <Separator />
            
            {/* Browser Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">Browser Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Get notifications in your browser
                </p>
                {!permissionStatus.supported && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                    Your browser doesn't support notifications
                  </p>
                )}
                {permissionStatus.supported && permissionStatus.permission === "denied" && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                    Notifications are blocked in browser settings
                  </p>
                )}
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-11" />
              ) : (
                <Switch
                  checked={preferences?.pushNotificationsEnabled ?? false}
                  onCheckedChange={handlePushToggle}
                  disabled={
                    pushLoading ||
                    !permissionStatus.supported ||
                    permissionStatus.permission === "denied"
                  }
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Task Reminder Dialog */}
      <TaskReminderDialog
        open={taskReminderDialogOpen}
        onOpenChange={setTaskReminderDialogOpen}
        taskRemindersEnabled={preferences?.taskRemindersEnabled ?? true}
        reminderTiming={preferences?.reminderTiming ?? 15}
        onSave={handleTaskReminderSave}
        isLoading={isLoading}
      />
      
      {/* Email Notifications Dialog */}
      <EmailNotificationsDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        emailNotificationsEnabled={preferences?.emailNotificationsEnabled ?? false}
        dailySummaryEnabled={preferences?.dailySummaryEnabled ?? false}
        onSave={handleEmailSave}
        isLoading={isLoading}
      />
    </>
  );
}

// Component exported as default above
