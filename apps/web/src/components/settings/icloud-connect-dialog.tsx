import * as React from "react";
import { Loader2, ExternalLink, Cloud } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
} from "@/components/ui";
import { useConnectICloud } from "@/hooks/useCalendars";

interface ICloudConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_CALDAV_URL = "https://caldav.icloud.com";

/**
 * Dialog for connecting iCloud calendar via CalDAV credentials
 * Requires an app-specific password from Apple
 */
export function ICloudConnectDialog({
  open,
  onOpenChange,
}: ICloudConnectDialogProps) {
  const [email, setEmail] = React.useState("");
  const [appPassword, setAppPassword] = React.useState("");
  const [caldavUrl, setCaldavUrl] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const connectMutation = useConnectICloud();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Apple ID email is required");
      return;
    }

    if (!appPassword.trim()) {
      setError("App-specific password is required");
      return;
    }

    try {
      await connectMutation.mutateAsync({
        email: email.trim(),
        appPassword: appPassword.trim(),
        caldavUrl: caldavUrl.trim() || undefined,
      });
      
      // Reset form and close dialog on success
      setEmail("");
      setAppPassword("");
      setCaldavUrl("");
      onOpenChange(false);
    } catch (err) {
      // Error is already handled by the mutation's onError
      // But we can also set a local error for display
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setEmail("");
      setAppPassword("");
      setCaldavUrl("");
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <Cloud className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            </div>
            <div>
              <DialogTitle>Connect iCloud Calendar</DialogTitle>
              <DialogDescription>
                Enter your Apple ID and app-specific password
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="icloud-email">Apple ID Email</Label>
            <Input
              id="icloud-email"
              type="email"
              placeholder="your@icloud.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={connectMutation.isPending}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icloud-password">App-Specific Password</Label>
            <Input
              id="icloud-password"
              type="password"
              placeholder="xxxx-xxxx-xxxx-xxxx"
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              disabled={connectMutation.isPending}
              autoComplete="current-password"
            />
            <p className="text-xs text-muted-foreground">
              You need an app-specific password from Apple.{" "}
              <a
                href="https://support.apple.com/en-us/102654"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Learn how to create one
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="icloud-caldav-url">
              CalDAV URL{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="icloud-caldav-url"
              type="url"
              placeholder={DEFAULT_CALDAV_URL}
              value={caldavUrl}
              onChange={(e) => setCaldavUrl(e.target.value)}
              disabled={connectMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use the default iCloud CalDAV server
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <DialogFooter className="gap-2 pt-4 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={connectMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={connectMutation.isPending}>
              {connectMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Connect
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
