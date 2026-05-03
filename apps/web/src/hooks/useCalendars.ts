import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CalendarAccount,
  Calendar,
  CalendarEvent,
  ConnectCalDavRequest,
  UpdateCalendarRequest,
} from "@open-sunsama/types";
import { isApiError } from "@open-sunsama/api-client";
import { getApiClient } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { calendarKeys } from "@/lib/query-keys";

/**
 * Map a write-back API error into a human-readable {title, description}
 * pair. The server already produces clean message strings for known
 * codes (EVENT_OUT_OF_SYNC, PROVIDER_AUTH_FAILED, etc.); this helper
 * just gives them friendlier titles and falls back to generic for
 * unknown errors.
 */
function describeWriteBackError(error: unknown, action: "update" | "delete" | "create"): { title: string; description: string } {
  const verb = action === "update" ? "updated" : action === "delete" ? "deleted" : "created";
  if (isApiError(error)) {
    if (error.code === "EVENT_OUT_OF_SYNC" || error.code === "CALENDAR_OUT_OF_SYNC") {
      return {
        title: "Event out of sync",
        description: error.message,
      };
    }
    if (error.code === "PROVIDER_AUTH_FAILED") {
      return {
        title: "Reconnect your calendar",
        description: error.message,
      };
    }
    if (error.code === "PROVIDER_READ_ONLY" || error.code === "CALENDAR_READ_ONLY") {
      return {
        title: "Read-only calendar",
        description: error.message,
      };
    }
    return {
      title: `Failed to ${action} event`,
      description: error.message,
    };
  }
  return {
    title: `Failed to ${action} event`,
    description: error instanceof Error ? error.message : `Couldn't be ${verb}.`,
  };
}

// Canonical key factory lives in lib/query-keys; re-exported for callers.
export { calendarKeys };

/**
 * Fetch all connected calendar accounts
 */
export function useCalendarAccounts() {
  return useQuery({
    queryKey: calendarKeys.accounts(),
    queryFn: async (): Promise<CalendarAccount[]> => {
      const client = getApiClient();
      const response = await client.get<{ success: boolean; data: CalendarAccount[] }>(
        "calendar/accounts"
      );
      return response.data;
    },
    // Always fetch fresh data - important for OAuth redirect flow
    staleTime: 0,
  });
}

/**
 * API response type for calendars endpoint (grouped by account)
 */
interface CalendarsApiResponse {
  success: boolean;
  data: Array<{
    id: string;
    provider: string;
    email: string;
    isActive: boolean;
    calendars: Array<Omit<Calendar, "accountId">>;
  }>;
}

/**
 * Fetch all calendars (flattened from grouped response)
 */
export function useCalendars() {
  return useQuery({
    queryKey: calendarKeys.calendars(),
    queryFn: async (): Promise<Calendar[]> => {
      const client = getApiClient();
      const response = await client.get<CalendarsApiResponse>("calendars");
      
      // Flatten the nested structure and add accountId to each calendar
      return response.data.flatMap((account) =>
        account.calendars.map((cal) => ({
          ...cal,
          accountId: account.id,
        }))
      );
    },
    // Always fetch fresh data - important for OAuth redirect flow
    staleTime: 0,
  });
}

/**
 * Fetch calendar events for a date range
 */
export function useCalendarEvents(from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: calendarKeys.events(from, to),
    queryFn: async (): Promise<CalendarEvent[]> => {
      const client = getApiClient();
      const response = await client.get<{ success: boolean; data: CalendarEvent[] }>(
        "calendar-events",
        { searchParams: { from, to } }
      );
      return response.data;
    },
    enabled,
  });
}

/**
 * Disconnect a calendar account
 */
export function useDisconnectAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: string): Promise<void> => {
      const client = getApiClient();
      await client.delete(`calendar/accounts/${accountId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.accounts() });
      queryClient.invalidateQueries({ queryKey: calendarKeys.calendars() });

      toast({
        title: "Account disconnected",
        description: "The calendar account has been removed.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to disconnect account",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

/**
 * Trigger manual sync for a calendar account.
 *
 * Pass `{ force: true }` to wipe local events for the account's
 * calendars and re-fetch from scratch — used to recover from
 * historical attribution bugs where events landed under the wrong
 * calendar. Force is slower but always converges to a clean state.
 */
export function useSyncAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      accountId,
      force = false,
    }: {
      accountId: string;
      force?: boolean;
    }): Promise<void> => {
      const client = getApiClient();
      const path = force
        ? `calendar/accounts/${accountId}/sync?force=true`
        : `calendar/accounts/${accountId}/sync`;
      await client.post(path);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.accounts() });
      queryClient.invalidateQueries({ queryKey: calendarKeys.calendars() });
      // Force refetch all calendar-events queries so the just-rebuilt
      // attribution lands immediately in any open calendar view.
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });

      toast({
        title: vars.force ? "Reset & re-sync started" : "Sync started",
        description: vars.force
          ? "Wiping local events and re-fetching from your provider."
          : "Calendar sync has been initiated.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to start sync",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

/**
 * Update calendar settings (enable/disable, set defaults)
 */
export function useUpdateCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      calendarId,
      data,
    }: {
      calendarId: string;
      data: UpdateCalendarRequest;
    }): Promise<Calendar> => {
      const client = getApiClient();
      const response = await client.patch<{ success: boolean; data: Calendar }>(
        `calendars/${calendarId}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.calendars() });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update calendar",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

/**
 * Connect iCloud calendar via CalDAV
 */
export function useConnectICloud() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ConnectCalDavRequest): Promise<CalendarAccount> => {
      const client = getApiClient();
      const response = await client.post<{ success: boolean; data: CalendarAccount }>(
        "calendar/caldav/connect",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.accounts() });
      queryClient.invalidateQueries({ queryKey: calendarKeys.calendars() });

      toast({
        title: "iCloud connected",
        description: "Your iCloud calendar has been connected successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to connect iCloud",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

/**
 * Input for useCreateCalendarEvent. The client picks which writable
 * calendar to create the event on.
 */
export interface CreateCalendarEventInput {
  calendarId: string;
  /** Same range scoping as updates — for optimistic placement. */
  rangeFrom: string;
  rangeTo: string;
  payload: {
    title: string;
    description?: string | null;
    location?: string | null;
    startTime: Date;
    endTime: Date;
    isAllDay?: boolean;
    timezone?: string | null;
  };
}

/**
 * Create a new external calendar event. Sends to the provider first;
 * the local cache is then updated with the returned canonical event so
 * the UI shows it immediately. No optimistic insertion because we need
 * the provider's id to render the event correctly (clicks resolve to
 * the right detail sheet, etc.).
 */
export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      calendarId,
      payload,
    }: CreateCalendarEventInput): Promise<CalendarEvent> => {
      const client = getApiClient();
      const body: Record<string, unknown> = {
        calendarId,
        title: payload.title,
        startTime: payload.startTime.toISOString(),
        endTime: payload.endTime.toISOString(),
      };
      if (payload.description !== undefined) body.description = payload.description;
      if (payload.location !== undefined) body.location = payload.location;
      if (payload.isAllDay !== undefined) body.isAllDay = payload.isAllDay;
      if (payload.timezone !== undefined) body.timezone = payload.timezone;
      const response = await client.post<{
        success: boolean;
        data: CalendarEvent;
      }>("calendar-events", body);
      return response.data;
    },
    onSuccess: (created, input) => {
      // Append to the visible-range cache so the chip appears without
      // waiting for the next refetch. If the canonical refetch lands
      // before this update is overridden, no harm done — invariant is
      // that the event ends up visible.
      const key = calendarKeys.events(input.rangeFrom, input.rangeTo);
      const previous = queryClient.getQueryData<CalendarEvent[]>(key);
      if (previous) {
        queryClient.setQueryData<CalendarEvent[]>(key, [...previous, created]);
      }
      // Also invalidate so any other open ranges pick it up.
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    },
    onError: (error) => {
      const { title, description } = describeWriteBackError(error, "create");
      toast({ variant: "destructive", title, description });
    },
  });
}

/**
 * Patch shape accepted by useUpdateCalendarEvent. Times are local Date
 * objects on the wire; the hook serialises them to ISO 8601.
 */
export interface UpdateCalendarEventInput {
  id: string;
  /**
   * The from/to range the event currently appears in. We use this to
   * scope the optimistic update to the right cache key. Without it the
   * update would only land after a refetch.
   */
  rangeFrom: string;
  rangeTo: string;
  patch: {
    title?: string;
    description?: string | null;
    location?: string | null;
    startTime?: Date;
    endTime?: Date;
    isAllDay?: boolean;
    timezone?: string | null;
  };
}

/**
 * Edit an external calendar event in place. The change is sent upstream
 * to the provider (Google, etc.) and the local cache is optimistically
 * updated so the UI reflects the new value immediately. If the upstream
 * write fails, the optimistic change is rolled back.
 */
export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: UpdateCalendarEventInput): Promise<CalendarEvent> => {
      const client = getApiClient();
      const body: Record<string, unknown> = {};
      if (patch.title !== undefined) body.title = patch.title;
      if (patch.description !== undefined) body.description = patch.description;
      if (patch.location !== undefined) body.location = patch.location;
      if (patch.startTime !== undefined) {
        body.startTime = patch.startTime.toISOString();
      }
      if (patch.endTime !== undefined) {
        body.endTime = patch.endTime.toISOString();
      }
      if (patch.isAllDay !== undefined) body.isAllDay = patch.isAllDay;
      if (patch.timezone !== undefined) body.timezone = patch.timezone;

      const response = await client.patch<{ success: boolean; data: CalendarEvent }>(
        `calendar-events/${id}`,
        body
      );
      return response.data;
    },
    onMutate: async (input) => {
      // Patch the event in EVERY cached event range so the change shows
      // up across all open views (board sidebar, calendar week, etc.),
      // not just the one that originated the mutation. Snapshots
      // restore each range on rollback.
      const eventsPrefix = ["calendars", "events"] as const;
      await queryClient.cancelQueries({ queryKey: eventsPrefix });
      const snapshots: Array<[unknown[], CalendarEvent[]]> = [];
      const cached = queryClient.getQueriesData<CalendarEvent[]>({
        queryKey: eventsPrefix,
      });
      for (const [key, data] of cached) {
        if (!data) continue;
        snapshots.push([key as unknown[], data]);
        const next: CalendarEvent[] = data.map((ev) => {
          if (ev.id !== input.id) return ev;
          // Wire shape: API serialises Date → ISO string, so optimistic
          // values must be ISO strings to match the refetch payload.
          const merged: CalendarEvent = { ...ev };
          if (input.patch.title !== undefined) merged.title = input.patch.title;
          if (input.patch.description !== undefined) {
            merged.description = input.patch.description;
          }
          if (input.patch.location !== undefined) {
            merged.location = input.patch.location;
          }
          if (input.patch.startTime !== undefined) {
            (merged as unknown as { startTime: string }).startTime =
              input.patch.startTime.toISOString();
          }
          if (input.patch.endTime !== undefined) {
            (merged as unknown as { endTime: string }).endTime =
              input.patch.endTime.toISOString();
          }
          if (input.patch.isAllDay !== undefined) {
            merged.isAllDay = input.patch.isAllDay;
          }
          if (input.patch.timezone !== undefined) {
            merged.timezone = input.patch.timezone;
          }
          return merged;
        });
        queryClient.setQueryData<CalendarEvent[]>(key, next);
      }
      return { snapshots };
    },
    onError: (error, _input, context) => {
      if (context?.snapshots) {
        for (const [key, prior] of context.snapshots) {
          queryClient.setQueryData(key, prior);
        }
      }
      const { title, description } = describeWriteBackError(error, "update");
      toast({ variant: "destructive", title, description });
      // EVENT_OUT_OF_SYNC means the server already cleaned up the
      // stale local row — refetch so the dead event disappears from
      // the UI. (The standard onSettled invalidation also fires, but
      // doing this here ensures we cover the rollback path too.)
      if (isApiError(error) && error.code === "EVENT_OUT_OF_SYNC") {
        queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      }
    },
    onSettled: () => {
      // Invalidate ALL cached calendar-event ranges so other open
      // views (board sidebar showing day, main calendar showing week,
      // a stale month range from a prior render) all refetch the
      // canonical state. Without the broader invalidation, a saved
      // edit would only land in the range that originated the
      // mutation, leaving siblings stale or showing the event in the
      // wrong slot if its time changed enough to leave the range.
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
}

/**
 * Delete an external calendar event upstream + locally.
 */
export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
    }: {
      id: string;
      rangeFrom: string;
      rangeTo: string;
    }): Promise<void> => {
      const client = getApiClient();
      await client.delete(`calendar-events/${id}`);
    },
    onMutate: async (input) => {
      // Optimistically remove the event from EVERY cached event range
      // (the prefix `["calendars","events"]` matches all ranges) so it
      // disappears from all open views — board sidebar, calendar week,
      // any stale ranges — not just the one that originated the call.
      // Snapshot each range so rollback restores them all on error.
      const eventsPrefix = ["calendars", "events"] as const;
      await queryClient.cancelQueries({ queryKey: eventsPrefix });
      const snapshots: Array<[unknown[], CalendarEvent[]]> = [];
      const cached = queryClient.getQueriesData<CalendarEvent[]>({
        queryKey: eventsPrefix,
      });
      for (const [key, data] of cached) {
        if (!data) continue;
        snapshots.push([key as unknown[], data]);
        queryClient.setQueryData<CalendarEvent[]>(
          key,
          data.filter((ev) => ev.id !== input.id)
        );
      }
      return { snapshots };
    },
    onError: (error, _input, context) => {
      if (context?.snapshots) {
        for (const [key, prior] of context.snapshots) {
          queryClient.setQueryData(key, prior);
        }
      }
      const { title, description } = describeWriteBackError(error, "delete");
      toast({ variant: "destructive", title, description });
    },
    onSettled: () => {
      // Invalidate ALL cached ranges — same reasoning as update.
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
}

/**
 * Initiate OAuth flow for a calendar provider
 * Calls the API with auth to get the OAuth URL, then redirects
 */
export function useInitiateOAuth() {
  return useMutation({
    mutationFn: async (provider: "google" | "outlook"): Promise<string> => {
      const client = getApiClient();
      const response = await client.get<{
        success: boolean;
        data: { authUrl: string; state: string };
      }>(`calendar/oauth/${provider}/initiate`);
      return response.data.authUrl;
    },
    onSuccess: (authUrl) => {
      // Redirect to the OAuth provider
      window.location.href = authUrl;
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to connect calendar",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

// Re-export types for convenience
export type {
  CalendarAccount,
  Calendar,
  CalendarEvent,
  ConnectCalDavRequest,
  UpdateCalendarRequest,
};
