import * as React from "react";
import {
  Loader2,
  RefreshCw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Switch,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Badge,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  useCalendarAccounts,
  useCalendars,
  useDisconnectAccount,
  useSyncAccount,
  useUpdateCalendar,
  getOAuthUrl,
  type CalendarAccount,
  type Calendar,
} from "@/hooks/useCalendars";
import { ICloudConnectDialog } from "./icloud-connect-dialog";

// Provider icons as simple SVG components
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function OutlookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 7.387v10.478c0 .23-.08.424-.238.576-.158.154-.352.231-.582.231h-8.08v-6.508l1.903 1.503c.088.072.191.108.309.108s.221-.036.31-.108l5.378-4.27v-1.62L16.94 12.58a.646.646 0 01-.819 0L10 7.98v-.593c0-.23.08-.424.238-.576.158-.154.352-.231.582-.231H23.18c.23 0 .424.077.582.231.158.152.238.346.238.576z" fill="#0072C6"/>
      <path d="M7.974 10.072c-.417-.245-.917-.368-1.5-.368-.583 0-1.083.123-1.5.368-.417.246-.74.582-.97 1.007-.23.426-.346.905-.346 1.439s.116 1.014.346 1.439c.23.426.553.762.97 1.008.417.245.917.368 1.5.368.583 0 1.083-.123 1.5-.368.417-.246.74-.582.97-1.008.23-.425.346-.905.346-1.439s-.116-1.013-.346-1.439c-.23-.425-.553-.76-.97-1.007zm-.324 3.34c-.277.316-.644.475-1.1.475-.457 0-.823-.159-1.1-.475-.278-.317-.416-.74-.416-1.27 0-.53.138-.952.416-1.27.277-.315.643-.474 1.1-.474.456 0 .823.159 1.1.475.277.317.416.74.416 1.27 0 .53-.139.952-.416 1.27z" fill="#0072C6"/>
      <path d="M14 18V6.5l-2 1v11.99c0 .28-.22.51-.5.51H.5c-.28 0-.5-.23-.5-.51V5.01c0-.28.22-.51.5-.51h11c.28 0 .5.23.5.51V6l2-1V4.5c0-.83-.67-1.5-1.5-1.5h-11C.67 3 0 3.67 0 4.5v14c0 .83.67 1.5 1.5 1.5h11c.83 0 1.5-.67 1.5-1.5V18z" fill="#0072C6"/>
    </svg>
  );
}

function ICloudIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.762 4.29a6.51 6.51 0 0 0-5.669 3.332 3.571 3.571 0 0 0-1.558-.36 3.571 3.571 0 0 0-3.516 3.003A4.996 4.996 0 0 0 0 14.868 4.996 4.996 0 0 0 5.01 19.88h13.467a5.517 5.517 0 0 0 5.516-5.524 5.517 5.517 0 0 0-5.516-5.524h-.014a6.51 6.51 0 0 0-4.701-4.542z" fill="#A3AAAE"/>
    </svg>
  );
}

const PROVIDER_CONFIG = {
  google: {
    name: "Google Calendar",
    icon: GoogleIcon,
    color: "#4285F4",
  },
  outlook: {
    name: "Outlook",
    icon: OutlookIcon,
    color: "#0072C6",
  },
  icloud: {
    name: "iCloud",
    icon: ICloudIcon,
    color: "#A3AAAE",
  },
} as const;

/**
 * Format a date string for display as "last synced" time
 */
function formatSyncTime(dateString: string | null): string {
  if (!dateString) return "Never";
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

/**
 * Sync status badge component
 */
function SyncStatusBadge({
  status,
  lastSyncedAt,
  syncError,
}: {
  status: CalendarAccount["syncStatus"];
  lastSyncedAt: string | null;
  syncError: string | null;
}) {
  if (status === "syncing") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Syncing
      </Badge>
    );
  }

  if (status === "error") {
    return (
      <Badge variant="destructive" className="gap-1" title={syncError || undefined}>
        <AlertCircle className="h-3 w-3" />
        Error
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      <Clock className="h-3 w-3" />
      {formatSyncTime(lastSyncedAt)}
    </Badge>
  );
}

/**
 * Remove account confirmation dialog
 */
function RemoveAccountDialog({
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

/**
 * Individual calendar item with toggle
 */
function CalendarItem({
  calendar,
  defaultForEvents,
  defaultForTasks,
  onToggleEnabled,
  onSetDefaultEvents,
  onSetDefaultTasks,
  isUpdating,
}: {
  calendar: Calendar;
  defaultForEvents: boolean;
  defaultForTasks: boolean;
  onToggleEnabled: () => void;
  onSetDefaultEvents: () => void;
  onSetDefaultTasks: () => void;
  isUpdating: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <Switch
          checked={calendar.isEnabled}
          onCheckedChange={onToggleEnabled}
          disabled={isUpdating}
        />
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: calendar.color || "#6B7280" }}
        />
        <span className={cn("text-sm", !calendar.isEnabled && "text-muted-foreground")}>
          {calendar.name}
        </span>
        {calendar.isReadOnly && (
          <Badge variant="outline" className="text-xs">
            Read-only
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSetDefaultEvents}
          disabled={isUpdating || !calendar.isEnabled}
          className={cn(
            "flex h-7 items-center gap-1 rounded-md border px-2 text-xs transition-colors",
            defaultForEvents
              ? "border-primary bg-primary/10 text-primary"
              : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
            (!calendar.isEnabled || isUpdating) && "cursor-not-allowed opacity-50"
          )}
          title="Set as default for new events"
        >
          {defaultForEvents && <CheckCircle2 className="h-3 w-3" />}
          Events
        </button>
        <button
          type="button"
          onClick={onSetDefaultTasks}
          disabled={isUpdating || !calendar.isEnabled || calendar.isReadOnly}
          className={cn(
            "flex h-7 items-center gap-1 rounded-md border px-2 text-xs transition-colors",
            defaultForTasks
              ? "border-primary bg-primary/10 text-primary"
              : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
            (!calendar.isEnabled || isUpdating || calendar.isReadOnly) &&
              "cursor-not-allowed opacity-50"
          )}
          title="Set as default for tasks"
        >
          {defaultForTasks && <CheckCircle2 className="h-3 w-3" />}
          Tasks
        </button>
      </div>
    </div>
  );
}

/**
 * Account card with calendars list
 */
function AccountCard({
  account,
  calendars,
  onSync,
  onRemove,
  onUpdateCalendar,
  isSyncing,
  isUpdatingCalendar,
}: {
  account: CalendarAccount;
  calendars: Calendar[];
  onSync: () => void;
  onRemove: () => void;
  onUpdateCalendar: (calendarId: string, data: { isEnabled?: boolean; isDefaultForEvents?: boolean; isDefaultForTasks?: boolean }) => void;
  isSyncing: boolean;
  isUpdatingCalendar: boolean;
}) {
  const config = PROVIDER_CONFIG[account.provider];
  const Icon = config.icon;

  const handleSetDefaultEvents = (calendarId: string) => {
    // Clear other defaults first, then set this one
    calendars.forEach((cal) => {
      if (cal.isDefaultForEvents && cal.id !== calendarId) {
        onUpdateCalendar(cal.id, { isDefaultForEvents: false });
      }
    });
    onUpdateCalendar(calendarId, { isDefaultForEvents: true });
  };

  const handleSetDefaultTasks = (calendarId: string) => {
    // Clear other defaults first, then set this one
    calendars.forEach((cal) => {
      if (cal.isDefaultForTasks && cal.id !== calendarId) {
        onUpdateCalendar(cal.id, { isDefaultForTasks: false });
      }
    });
    onUpdateCalendar(calendarId, { isDefaultForTasks: true });
  };

  return (
    <div className="rounded-lg border bg-card">
      {/* Account header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5" />
          <div>
            <p className="text-sm font-medium">{account.email}</p>
            <p className="text-xs text-muted-foreground">{config.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SyncStatusBadge
            status={account.syncStatus}
            lastSyncedAt={account.lastSyncedAt}
            syncError={account.syncError}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={onSync}
            disabled={isSyncing || account.syncStatus === "syncing"}
            title="Sync now"
          >
            <RefreshCw
              className={cn("h-4 w-4", isSyncing && "animate-spin")}
            />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            title="Remove account"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendars list */}
      <div className="divide-y px-4">
        {calendars.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No calendars found
          </p>
        ) : (
          calendars.map((calendar) => (
            <CalendarItem
              key={calendar.id}
              calendar={calendar}
              defaultForEvents={calendar.isDefaultForEvents}
              defaultForTasks={calendar.isDefaultForTasks}
              onToggleEnabled={() =>
                onUpdateCalendar(calendar.id, { isEnabled: !calendar.isEnabled })
              }
              onSetDefaultEvents={() => handleSetDefaultEvents(calendar.id)}
              onSetDefaultTasks={() => handleSetDefaultTasks(calendar.id)}
              isUpdating={isUpdatingCalendar}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Calendar Settings Tab
 * Manages calendar account connections and individual calendar settings
 */
export function CalendarSettings() {
  const [iCloudDialogOpen, setICloudDialogOpen] = React.useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = React.useState(false);
  const [accountToRemove, setAccountToRemove] = React.useState<CalendarAccount | null>(null);

  const { data: accounts, isLoading: isLoadingAccounts } = useCalendarAccounts();
  const { data: calendars, isLoading: isLoadingCalendars } = useCalendars();
  const disconnectMutation = useDisconnectAccount();
  const syncMutation = useSyncAccount();
  const updateCalendarMutation = useUpdateCalendar();

  const isLoading = isLoadingAccounts || isLoadingCalendars;

  // Group calendars by account
  const calendarsByAccount = React.useMemo(() => {
    if (!calendars) return {};
    return calendars.reduce<Record<string, Calendar[]>>((acc, calendar) => {
      const accountCalendars = acc[calendar.accountId] ?? [];
      accountCalendars.push(calendar);
      acc[calendar.accountId] = accountCalendars;
      return acc;
    }, {});
  }, [calendars]);

  const handleConnectGoogle = () => {
    window.location.href = getOAuthUrl("google");
  };

  const handleConnectOutlook = () => {
    window.location.href = getOAuthUrl("outlook");
  };

  const handleRemoveAccount = () => {
    if (accountToRemove) {
      disconnectMutation.mutate(accountToRemove.id, {
        onSuccess: () => {
          setRemoveDialogOpen(false);
          setAccountToRemove(null);
        },
      });
    }
  };

  const handleUpdateCalendar = (
    calendarId: string,
    data: { isEnabled?: boolean; isDefaultForEvents?: boolean; isDefaultForTasks?: boolean }
  ) => {
    updateCalendarMutation.mutate({ calendarId, data });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Calendar Integration</CardTitle>
          <CardDescription>
            Connect your calendars to see events alongside tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Calendar Integration</CardTitle>
          <CardDescription>
            Connect your calendars to see events alongside tasks and avoid
            double-booking
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Connect buttons */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleConnectGoogle}>
              <GoogleIcon className="mr-2 h-4 w-4" />
              Add Google Calendar
            </Button>
            <Button variant="outline" onClick={handleConnectOutlook}>
              <OutlookIcon className="mr-2 h-4 w-4" />
              Add Outlook
            </Button>
            <Button variant="outline" onClick={() => setICloudDialogOpen(true)}>
              <ICloudIcon className="mr-2 h-4 w-4" />
              Add iCloud
            </Button>
          </div>

          {/* Connected accounts */}
          {accounts && accounts.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Connected Accounts</h3>
              {accounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  calendars={calendarsByAccount[account.id] || []}
                  onSync={() => syncMutation.mutate(account.id)}
                  onRemove={() => {
                    setAccountToRemove(account);
                    setRemoveDialogOpen(true);
                  }}
                  onUpdateCalendar={handleUpdateCalendar}
                  isSyncing={syncMutation.isPending && syncMutation.variables === account.id}
                  isUpdatingCalendar={updateCalendarMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Plus className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <h3 className="mt-2 text-sm font-medium">No calendars connected</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Connect a calendar account to see your events alongside tasks
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ICloudConnectDialog
        open={iCloudDialogOpen}
        onOpenChange={setICloudDialogOpen}
      />
      <RemoveAccountDialog
        account={accountToRemove}
        open={removeDialogOpen}
        onOpenChange={setRemoveDialogOpen}
        onConfirm={handleRemoveAccount}
        isLoading={disconnectMutation.isPending}
      />
    </>
  );
}
