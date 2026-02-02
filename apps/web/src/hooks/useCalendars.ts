import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CalendarAccount,
  Calendar,
  CalendarEvent,
  ConnectCalDavRequest,
  UpdateCalendarRequest,
} from "@open-sunsama/types";
import { getApiClient } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

/**
 * Query key factory for calendar data
 */
export const calendarKeys = {
  all: ["calendars"] as const,
  accounts: () => [...calendarKeys.all, "accounts"] as const,
  calendars: () => [...calendarKeys.all, "list"] as const,
  events: (from: string, to: string) =>
    [...calendarKeys.all, "events", from, to] as const,
};

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
 * Trigger manual sync for a calendar account
 */
export function useSyncAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: string): Promise<void> => {
      const client = getApiClient();
      await client.post(`calendar/accounts/${accountId}/sync`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.accounts() });
      queryClient.invalidateQueries({ queryKey: calendarKeys.calendars() });

      toast({
        title: "Sync started",
        description: "Calendar sync has been initiated.",
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
