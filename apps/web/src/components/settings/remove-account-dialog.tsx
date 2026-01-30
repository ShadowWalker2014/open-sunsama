import { Loader2, AlertTriangle } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import type { CalendarAccount } from "@/hooks/useCalendars";
import { PROVIDER_CONFIG } from "./calendar-provider-icons";

/**
 * Remove account confirmation dialog
 */
export function RemoveAccountDialog({
  account,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: {
  account: CalendarAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  if (!account) return null;
  
  const config = PROVIDER_CONFIG[account.provider];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Remove Calendar Account</DialogTitle>
              <DialogDescription>This action cannot be undone</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to disconnect this calendar account? All synced
            events will be removed from Open Sunsama.
          </p>

          <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
            <config.icon className="h-5 w-5" />
            <div>
              <p className="font-medium">{config.name}</p>
              <p className="text-xs text-muted-foreground">{account.email}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Remove Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
