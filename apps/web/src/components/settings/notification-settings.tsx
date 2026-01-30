import * as React from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
  Switch,
  Skeleton,
} from "@/components/ui";
import { toast } from "@/hooks/use-toast";
import { TaskReminderDialog, EmailNotificationsDialog } from "@/components/settings";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  requestNotificationPermission,
  getNotificationPermissionStatus,
} from "@/hooks/useNotificationPreferences";

/** Get task reminders status text */
function getTaskReminderStatus(preferences: { taskRemindersEnabled: boolean; reminderTiming: number } | undefined) {
  if (!preferences) return "";
  if (!preferences.taskRemindersEnabled) return "Disabled";
  const timing = preferences.reminderTiming;
  if (timing === 60) return "1 hour before";
  if (timing === 120) return "2 hours before";
  return `${timing} min before`;
}

/** Get email status text */
function getEmailStatus(preferences: { emailNotificationsEnabled: boolean; dailySummaryEnabled: boolean } | undefined) {
  if (!preferences) return "";
  if (!preferences.emailNotificationsEnabled) return "Disabled";
  if (preferences.dailySummaryEnabled) return "Daily summary";
  return "Enabled";
}

/**
 * Notification settings component for managing notification preferences
 */
export function NotificationSettings() {
  const { data: preferences, isLoading, error } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();
  const [taskReminderDialogOpen, setTaskReminderDialogOpen] = React.useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = React.useState(false);
  const [pushLoading, setPushLoading] = React.useState(false);
  const permissionStatus = React.useMemo(() => getNotificationPermissionStatus(), []);

  const handleTaskReminderSave = async (taskRemindersEnabled: boolean, reminderTiming: number) => {
    await updatePreferences.mutateAsync({ taskRemindersEnabled, reminderTiming });
    toast({ title: "Task reminders updated", description: "Your task reminder settings have been saved." });
  };

  const handleEmailSave = async (emailNotificationsEnabled: boolean, dailySummaryEnabled: boolean) => {
    await updatePreferences.mutateAsync({ emailNotificationsEnabled, dailySummaryEnabled });
    toast({ title: "Email notifications updated", description: "Your email notification settings have been saved." });
  };

  const handlePushToggle = async () => {
    if (!permissionStatus.supported) {
      toast({ variant: "destructive", title: "Not supported", description: "Browser notifications are not supported in this browser." });
      return;
    }
    const currentEnabled = preferences?.pushNotificationsEnabled ?? false;
    setPushLoading(true);
    try {
      if (!currentEnabled) {
        const permission = await requestNotificationPermission();
        if (permission === "granted") {
          await updatePreferences.mutateAsync({ pushNotificationsEnabled: true });
          toast({ title: "Browser notifications enabled", description: "You will now receive browser notifications." });
        } else if (permission === "denied") {
          toast({ variant: "destructive", title: "Permission denied", description: "Please enable notifications in your browser settings." });
        }
      } else {
        await updatePreferences.mutateAsync({ pushNotificationsEnabled: false });
        toast({ title: "Browser notifications disabled", description: "You will no longer receive browser notifications." });
      }
    } finally {
      setPushLoading(false);
    }
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Configure how you receive notifications</CardDescription>
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
          <CardDescription>Configure how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Task Reminders */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">Task Reminders</p>
                <p className="text-sm text-muted-foreground">Get notified before scheduled tasks</p>
                {isLoading ? (
                  <Skeleton className="h-4 w-24 mt-1" />
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">Status: {getTaskReminderStatus(preferences)}</p>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => setTaskReminderDialogOpen(true)} disabled={isLoading}>
                Configure
              </Button>
            </div>
            <Separator />
            {/* Email Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive daily summary emails</p>
                {isLoading ? (
                  <Skeleton className="h-4 w-20 mt-1" />
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">Status: {getEmailStatus(preferences)}</p>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => setEmailDialogOpen(true)} disabled={isLoading}>
                Configure
              </Button>
            </div>
            <Separator />
            {/* Browser Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">Browser Notifications</p>
                <p className="text-sm text-muted-foreground">Get notifications in your browser</p>
                {!permissionStatus.supported && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">Your browser doesn't support notifications</p>
                )}
                {permissionStatus.supported && permissionStatus.permission === "denied" && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">Notifications are blocked in browser settings</p>
                )}
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-11" />
              ) : (
                <Switch
                  checked={preferences?.pushNotificationsEnabled ?? false}
                  onCheckedChange={handlePushToggle}
                  disabled={pushLoading || !permissionStatus.supported || permissionStatus.permission === "denied"}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <TaskReminderDialog
        open={taskReminderDialogOpen}
        onOpenChange={setTaskReminderDialogOpen}
        taskRemindersEnabled={preferences?.taskRemindersEnabled ?? true}
        reminderTiming={preferences?.reminderTiming ?? 15}
        onSave={handleTaskReminderSave}
        isLoading={isLoading}
      />
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

export default NotificationSettings;
