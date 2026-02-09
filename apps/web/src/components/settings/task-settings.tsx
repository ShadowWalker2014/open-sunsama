import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
  Skeleton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { DEFAULT_PREFERENCES } from "@/lib/themes";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks/useNotificationPreferences";
import type {
  HomeTabPreference,
  RolloverDestination,
  RolloverPosition,
  UserPreferences,
} from "@open-sunsama/types";

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

const HOME_TAB_OPTIONS: { value: HomeTabPreference; label: string }[] = [
  { value: "board", label: "Board" },
  { value: "tasks", label: "Tasks" },
  { value: "calendar", label: "Calendar" },
];

/**
 * Task settings component for managing task behavior preferences
 */
export function TaskSettings() {
  const { user, updateUser } = useAuth();
  const { data: preferences, isLoading, error } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();
  const [isSavingHomeTab, setIsSavingHomeTab] = React.useState(false);

  const handleRolloverDestinationChange = async (value: string) => {
    try {
      await updatePreferences.mutateAsync({ rolloverDestination: value as RolloverDestination });
      const label = ROLLOVER_DESTINATION_OPTIONS.find((o) => o.value === value)?.label ?? value;
      toast({ title: "Rollover destination updated", description: `Tasks will now rollover to: ${label}` });
    } catch {
      // Error toast is handled by the mutation's onError callback
    }
  };

  const handleRolloverPositionChange = async (value: string) => {
    try {
      await updatePreferences.mutateAsync({ rolloverPosition: value as RolloverPosition });
      const label = ROLLOVER_POSITION_OPTIONS.find((o) => o.value === value)?.label ?? value;
      toast({ title: "Rollover position updated", description: `Rolled-over tasks will appear at the ${label.toLowerCase()} of the list` });
    } catch {
      // Error toast is handled by the mutation's onError callback
    }
  };

  const handleHomeTabChange = (value: string) => {
    const nextHomeTab = value as HomeTabPreference;
    const mergedPreferences: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      ...(user?.preferences ?? {}),
      homeTab: nextHomeTab,
    };

    setIsSavingHomeTab(true);
    void updateUser({ preferences: mergedPreferences })
      .then(() => {
        const selectedOption = HOME_TAB_OPTIONS.find(
          (option) => option.value === nextHomeTab
        );
        toast({
          title: "Home tab updated",
          description: `Opening /app now goes to ${
            selectedOption?.label ?? nextHomeTab
          }.`,
        });
      })
      .finally(() => {
        setIsSavingHomeTab(false);
      });
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>Configure task behavior</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-destructive text-[13px]">Failed to load task settings</p>
            <p className="text-xs text-muted-foreground mt-1">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Home Tab</CardTitle>
          <CardDescription>
            Choose which tab opens by default when you visit /app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium">Default home view</p>
              <p className="text-xs text-muted-foreground">
                This preference is synced across your devices.
              </p>
            </div>
            <Select
              value={user?.preferences?.homeTab ?? "board"}
              onValueChange={handleHomeTabChange}
              disabled={isSavingHomeTab}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOME_TAB_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Task Rollover</CardTitle>
          <CardDescription>
            Configure how incomplete tasks are handled at the end of each day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium">Rollover destination</p>
                <p className="text-xs text-muted-foreground">
                  Where should incomplete tasks go?
                </p>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <Select
                  value={preferences?.rolloverDestination ?? "backlog"}
                  onValueChange={handleRolloverDestinationChange}
                  disabled={updatePreferences.isPending}
                >
                  <SelectTrigger className="w-28">
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
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium">Rollover position</p>
                <p className="text-xs text-muted-foreground">
                  Where in the list should rolled-over tasks appear?
                </p>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <Select
                  value={preferences?.rolloverPosition ?? "top"}
                  onValueChange={handleRolloverPositionChange}
                  disabled={updatePreferences.isPending}
                >
                  <SelectTrigger className="w-28">
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
    </div>
  );
}

export default TaskSettings;
