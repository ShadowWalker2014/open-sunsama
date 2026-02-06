import * as React from "react";
import { Clock, Loader2, Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
} from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import {
  useCalendarAccounts,
  useCalendars,
  useDisconnectAccount,
  useSyncAccount,
  useUpdateCalendar,
  useInitiateOAuth,
  type Calendar,
} from "@/hooks/useCalendars";
import { ICloudConnectDialog } from "./icloud-connect-dialog";
import { GoogleIcon, OutlookIcon, ICloudIcon } from "./calendar-provider-icons";
import { AccountCard } from "./calendar-account-card";
import { RemoveAccountDialog } from "./remove-account-dialog";

function formatHour(hour: number): string {
  if (hour === 0) return "12:00 AM";
  if (hour === 12) return "12:00 PM";
  if (hour < 12) return `${hour}:00 AM`;
  return `${hour - 12}:00 PM`;
}

function WorkingHoursCard() {
  const { user, updateUser } = useAuth();
  const [isSaving, setIsSaving] = React.useState(false);

  const workStartHour = user?.preferences?.workStartHour ?? 9;
  const workEndHour = user?.preferences?.workEndHour ?? 18;

  const handleStartChange = async (value: string) => {
    const hour = parseInt(value, 10);
    if (hour >= workEndHour) {
      toast({ variant: "destructive", title: "Start time must be before end time" });
      return;
    }
    setIsSaving(true);
    await updateUser({
      preferences: {
        ...(user?.preferences ?? { themeMode: "system" as const, colorTheme: "default", fontFamily: "geist" }),
        workStartHour: hour,
        workEndHour,
      },
    });
    setIsSaving(false);
    toast({ title: "Working hours updated" });
  };

  const handleEndChange = async (value: string) => {
    const hour = parseInt(value, 10);
    if (hour <= workStartHour) {
      toast({ variant: "destructive", title: "End time must be after start time" });
      return;
    }
    setIsSaving(true);
    await updateUser({
      preferences: {
        ...(user?.preferences ?? { themeMode: "system" as const, colorTheme: "default", fontFamily: "geist" }),
        workStartHour,
        workEndHour: hour,
      },
    });
    setIsSaving(false);
    toast({ title: "Working hours updated" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Working Hours
        </CardTitle>
        <CardDescription>
          Set your working hours for auto-scheduling. Tasks will be scheduled within these hours when possible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-4">
          <div className="space-y-2">
            <Label>Start time</Label>
            <Select value={String(workStartHour)} onValueChange={handleStartChange} disabled={isSaving}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {formatHour(i)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="pb-2 text-muted-foreground">to</span>
          <div className="space-y-2">
            <Label>End time</Label>
            <Select value={String(workEndHour)} onValueChange={handleEndChange} disabled={isSaving}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {formatHour(i)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Calendar Settings Tab
 * Manages calendar account connections and individual calendar settings
 */
export function CalendarSettings() {
  const [iCloudDialogOpen, setICloudDialogOpen] = React.useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = React.useState(false);
  const [accountToRemove, setAccountToRemove] = React.useState<Parameters<typeof RemoveAccountDialog>[0]["account"]>(null);

  const { data: accounts, isLoading: isLoadingAccounts } = useCalendarAccounts();
  const { data: calendars, isLoading: isLoadingCalendars } = useCalendars();
  const disconnectMutation = useDisconnectAccount();
  const syncMutation = useSyncAccount();
  const updateCalendarMutation = useUpdateCalendar();
  const initiateOAuthMutation = useInitiateOAuth();

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
    initiateOAuthMutation.mutate("google");
  };

  const handleConnectOutlook = () => {
    initiateOAuthMutation.mutate("outlook");
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
      <WorkingHoursCard />
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
            <Button 
              variant="outline" 
              onClick={handleConnectGoogle}
              disabled={initiateOAuthMutation.isPending}
            >
              {initiateOAuthMutation.isPending && initiateOAuthMutation.variables === "google" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon className="mr-2 h-4 w-4" />
              )}
              Add Google Calendar
            </Button>
            <Button 
              variant="outline" 
              onClick={handleConnectOutlook}
              disabled={initiateOAuthMutation.isPending}
            >
              {initiateOAuthMutation.isPending && initiateOAuthMutation.variables === "outlook" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <OutlookIcon className="mr-2 h-4 w-4" />
              )}
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
