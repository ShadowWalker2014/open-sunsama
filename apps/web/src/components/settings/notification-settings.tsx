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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { toast } from "@/hooks/use-toast";
import { TaskReminderDialog, EmailNotificationsDialog } from "@/components/settings";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  requestNotificationPermission,
  getNotificationPermissionStatus,
} from "@/hooks/useNotificationPreferences";
import type { RolloverDestination, RolloverPosition } from "@open-sunsama/types";

/** Rollover destination options */
const ROLLOVER_DESTINATION_OPTIONS = [
  { value: "next_day", label: "Next day" },
  { value: "backlog", label: "Backlog" },
] as const;

/** Rollover position options */
const ROLLOVER_POSITION_OPTIONS = [
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
] as const;

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

  const handleRolloverDestinationChange = async (value: string) => {
    await updatePreferences.mutateAsync({ rolloverDestination: value as RolloverDestination });
    const label = ROLLOVER_DESTINATION_OPTIONS.find((o) => o.value === value)?.label ?? value;
    toast({ title: "Rollover destination updated", description: `Tasks will now rollover to: ${label}` });
  };

  const handleRolloverPositionChange = async (value: string) => {
    await updatePreferences.mutateAsync({ rolloverPosition: value as RolloverPosition });
    const label = ROLLOVER_POSITION_OPTIONS.find((o) => o.value === value)?.label ?? value;
    toast({ title: "Rollover position updated", description: `Rolled-over tasks will appear at the ${label.toLowerCase()} of the list` });
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

      {/* Task Rollover Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Task Rollover</CardTitle>
          <CardDescription>Configure how incomplete tasks are handled at the end of each day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Rollover Destination */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">Task rollover destination</p>
                <p className="text-sm text-muted-foreground">When tasks rollover, should they go to the next day or back to backlog?</p>
              </div>
              {isLoading ? (
                <Skeleton className="h-10 w-32" />
              ) : (
                <Select
                  value={preferences?.rolloverDestination ?? "backlog"}
                  onValueChange={handleRolloverDestinationChange}
                  disabled={updatePreferences.isPending}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLLOVER_DESTINATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Separator />
            {/* Rollover Position */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">Task rollover position</p>
                <p className="text-sm text-muted-foreground">When tasks rollover, should they appear at the top or bottom of the list?</p>
              </div>
              {isLoading ? (
                <Skeleton className="h-10 w-32" />
              ) : (
                <Select
                  value={preferences?.rolloverPosition ?? "top"}
                  onValueChange={handleRolloverPositionChange}
                  disabled={updatePreferences.isPending}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLLOVER_POSITION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
