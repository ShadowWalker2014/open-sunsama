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
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
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

/**
 * Task settings component for managing task behavior preferences
 */
export function TaskSettings() {
  const { data: preferences, isLoading, error } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();

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
    <Card>
      <CardHeader>
        <CardTitle>Task Rollover</CardTitle>
        <CardDescription>Configure how incomplete tasks are handled at the end of each day</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Rollover Destination */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium">Rollover destination</p>
              <p className="text-xs text-muted-foreground">Where should incomplete tasks go?</p>
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
          {/* Rollover Position */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium">Rollover position</p>
              <p className="text-xs text-muted-foreground">Where in the list should rolled-over tasks appear?</p>
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
  );
}

export default TaskSettings;
