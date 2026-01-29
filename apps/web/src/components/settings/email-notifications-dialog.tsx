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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface EmailNotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emailNotificationsEnabled: boolean;
  dailySummaryEnabled: boolean;
  onSave: (emailNotificationsEnabled: boolean, dailySummaryEnabled: boolean) => Promise<void>;
  isLoading?: boolean;
}

export function EmailNotificationsDialog({
  open,
  onOpenChange,
  emailNotificationsEnabled,
  dailySummaryEnabled,
  onSave,
  isLoading = false,
}: EmailNotificationsDialogProps) {
  const [emailEnabled, setEmailEnabled] = React.useState(emailNotificationsEnabled);
  const [dailySummary, setDailySummary] = React.useState(dailySummaryEnabled);
  const [isSaving, setIsSaving] = React.useState(false);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setEmailEnabled(emailNotificationsEnabled);
      setDailySummary(dailySummaryEnabled);
    }
  }, [open, emailNotificationsEnabled, dailySummaryEnabled]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(emailEnabled, dailySummary);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    emailEnabled !== emailNotificationsEnabled ||
    dailySummary !== dailySummaryEnabled;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Email Notifications</DialogTitle>
          <DialogDescription>
            Configure which email notifications you want to receive.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications-enabled">
                Enable Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive important updates via email
              </p>
            </div>
            <Switch
              id="email-notifications-enabled"
              checked={emailEnabled}
              onCheckedChange={setEmailEnabled}
              disabled={isLoading || isSaving}
            />
          </div>

          {emailEnabled && (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="daily-summary-enabled">Daily Summary</Label>
                <p className="text-sm text-muted-foreground">
                  Receive a daily summary of your tasks and schedule
                </p>
              </div>
              <Switch
                id="daily-summary-enabled"
                checked={dailySummary}
                onCheckedChange={setDailySummary}
                disabled={isLoading || isSaving}
              />
            </div>
          )}

          {!emailEnabled && (
            <p className="text-sm text-muted-foreground italic">
              Enable email notifications to configure additional options.
            </p>
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
