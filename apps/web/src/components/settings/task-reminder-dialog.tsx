import * as React from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { REMINDER_TIMING_OPTIONS } from "@open-sunsama/types";

interface TaskReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskRemindersEnabled: boolean;
  reminderTiming: number;
  onSave: (taskRemindersEnabled: boolean, reminderTiming: number) => Promise<void>;
  isLoading?: boolean;
}

export function TaskReminderDialog({
  open,
  onOpenChange,
  taskRemindersEnabled,
  reminderTiming,
  onSave,
  isLoading = false,
}: TaskReminderDialogProps) {
  const [enabled, setEnabled] = React.useState(taskRemindersEnabled);
  const [timing, setTiming] = React.useState(reminderTiming);
  const [isSaving, setIsSaving] = React.useState(false);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setEnabled(taskRemindersEnabled);
      setTiming(reminderTiming);
    }
  }, [open, taskRemindersEnabled, reminderTiming]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(enabled, timing);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = enabled !== taskRemindersEnabled || timing !== reminderTiming;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Task Reminders</DialogTitle>
          <DialogDescription>
            Configure when you want to be reminded about upcoming scheduled tasks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="task-reminders-enabled">Enable Task Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications before scheduled tasks
              </p>
            </div>
            <Switch
              id="task-reminders-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
              disabled={isLoading || isSaving}
            />
          </div>

          {enabled && (
            <div className="space-y-2">
              <Label htmlFor="reminder-timing">Reminder Timing</Label>
              <Select
                value={timing.toString()}
                onValueChange={(value) => setTiming(parseInt(value, 10))}
                disabled={isLoading || isSaving}
              >
                <SelectTrigger id="reminder-timing">
                  <SelectValue placeholder="Select timing" />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_TIMING_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                How long before a scheduled task to send the reminder
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
