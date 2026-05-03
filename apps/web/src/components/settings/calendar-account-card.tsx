import {
  Loader2,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  MoreVertical,
  RotateCcw,
} from "lucide-react";
import {
  Button,
  Switch,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import { CalendarColorPicker } from "./calendar-color-picker";
import { cn } from "@/lib/utils";
import type { CalendarAccount, Calendar } from "@/hooks/useCalendars";
import { PROVIDER_CONFIG } from "./calendar-provider-icons";

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
export function SyncStatusBadge({
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
 * Individual calendar item with toggle
 */
export function CalendarItem({
  calendar,
  defaultForEvents,
  defaultForTasks,
  onToggleEnabled,
  onSetDefaultEvents,
  onSetDefaultTasks,
  onSetColor,
  isUpdating,
}: {
  calendar: Calendar;
  defaultForEvents: boolean;
  defaultForTasks: boolean;
  onToggleEnabled: () => void;
  onSetDefaultEvents: () => void;
  onSetDefaultTasks: () => void;
  /**
   * Persist a custom color override for this calendar. Pass null to
   * clear the override (the per-calendar dot then falls back to
   * whatever the provider assigned at first sync).
   */
  onSetColor: (color: string | null) => void;
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
        <CalendarColorPicker
          value={calendar.color}
          disabled={isUpdating}
          onChange={(c) => onSetColor(c)}
          onReset={() => onSetColor(null)}
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
          disabled={
            isUpdating || !calendar.isEnabled || calendar.isReadOnly
          }
          className={cn(
            "flex h-7 items-center gap-1 rounded-md border px-2 text-xs transition-colors",
            defaultForEvents
              ? "border-primary bg-primary/10 text-primary"
              : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
            (!calendar.isEnabled || isUpdating || calendar.isReadOnly) &&
              "cursor-not-allowed opacity-50"
          )}
          title={
            calendar.isReadOnly
              ? "Read-only calendars can't be a default for new events"
              : "Set as default for new events"
          }
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
export function AccountCard({
  account,
  calendars,
  onSync,
  onForceResync,
  onRemove,
  onUpdateCalendar,
  isSyncing,
  isUpdatingCalendar,
}: {
  account: CalendarAccount;
  calendars: Calendar[];
  onSync: () => void;
  /**
   * Wipes local events for this account's calendars and re-fetches
   * from scratch. Used as a self-service repair for past attribution
   * bugs where events landed under the wrong calendar.
   */
  onForceResync: () => void;
  onRemove: () => void;
  onUpdateCalendar: (
    calendarId: string,
    data: {
      isEnabled?: boolean;
      isDefaultForEvents?: boolean;
      isDefaultForTasks?: boolean;
      color?: string | null;
    }
  ) => void;
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
        <div className="flex min-w-0 items-center gap-3">
          <Icon className="h-5 w-5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="max-w-[200px] truncate text-sm font-medium">{account.email}</p>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" title="More options">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={onForceResync}
                disabled={isSyncing || account.syncStatus === "syncing"}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset & re-sync
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onRemove}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Disconnect account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Calendars list */}
      <div className="divide-y px-4">
        {calendars.length === 0 ? (
          // Only show "No calendars found" if account has been synced at least once
          account.syncStatus === "syncing" || isSyncing ? (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Syncing calendars...</span>
            </div>
          ) : !account.lastSyncedAt ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Click sync to fetch calendars
            </p>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No calendars found
            </p>
          )
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
              onSetColor={(color) => onUpdateCalendar(calendar.id, { color })}
              isUpdating={isUpdatingCalendar}
            />
          ))
        )}
      </div>
    </div>
  );
}
