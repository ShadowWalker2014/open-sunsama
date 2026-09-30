import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ConnectIntegrationRequest,
  IntegrationAccount,
  IntegrationProviderInfo,
  Task,
  TaskExternalLink,
} from "@open-sunsama/types";
import { isApiError } from "@open-sunsama/api-client";
import { getApiClient } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { integrationKeys, taskKeys } from "@/lib/query-keys";

export { integrationKeys };

export interface ImportTaskResult {
  task: Task;
  link: TaskExternalLink;
  alreadyExisted: boolean;
}

/**
 * Turn a provider failure into something a person can act on. "It didn't
 * work" is the same message for a revoked token, a private task and a
 * typo, but only one of those is the user's to fix.
 */
function describeIntegrationError(
  error: unknown,
  fallbackTitle: string
): { title: string; description: string } {
  if (isApiError(error)) {
    switch (error.code) {
      case "PROVIDER_CREDENTIAL_INVALID":
        return { title: "Token rejected", description: error.message };
      case "INVALID_CREDENTIALS":
        return { title: "Check the token", description: error.message };
      case "UNRECOGNIZED_REFERENCE":
        return { title: "Link not recognized", description: error.message };
      case "EXTERNAL_TASK_NOT_FOUND":
        return { title: "Task not found", description: error.message };
      case "PROVIDER_RATE_LIMITED":
        return {
          title: "Rate limited",
          description: "The provider is throttling us. Try again in a moment.",
        };
      default:
        return { title: fallbackTitle, description: error.message };
    }
  }
  return {
    title: fallbackTitle,
    description:
      error instanceof Error ? error.message : "Something went wrong.",
  };
}

/** What can be connected, and which fields the connect dialog renders. */
export function useIntegrationProviders() {
  return useQuery({
    queryKey: integrationKeys.providers(),
    queryFn: async (): Promise<IntegrationProviderInfo[]> => {
      const client = getApiClient();
      const response = await client.get<{
        success: boolean;
        data: IntegrationProviderInfo[];
      }>("integrations/providers");
      return response.data;
    },
    // The registry only changes on deploy.
    staleTime: Infinity,
  });
}

export function useIntegrationAccounts() {
  return useQuery({
    queryKey: integrationKeys.accounts(),
    queryFn: async (): Promise<IntegrationAccount[]> => {
      const client = getApiClient();
      const response = await client.get<{
        success: boolean;
        data: IntegrationAccount[];
      }>("integrations/accounts");
      return response.data;
    },
  });
}

export function useConnectIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      body: ConnectIntegrationRequest
    ): Promise<IntegrationAccount> => {
      const client = getApiClient();
      const response = await client.post<{
        success: boolean;
        data: IntegrationAccount;
      }>("integrations/accounts", body);
      return response.data;
    },
    onSuccess: (account) => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.accounts() });
      toast({
        title: `${account.label} connected`,
        description: "You can now import tasks by pasting a link.",
      });
    },
    onError: (error) => {
      toast({
        ...describeIntegrationError(error, "Couldn't connect"),
        variant: "destructive",
      });
    },
  });
}

export function useDisconnectIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: string): Promise<void> => {
      const client = getApiClient();
      await client.delete(`integrations/accounts/${accountId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.accounts() });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      toast({
        title: "Disconnected",
        description:
          "Imported tasks were kept — they just can't be refreshed any more.",
      });
    },
    onError: (error) => {
      toast({
        ...describeIntegrationError(error, "Couldn't disconnect"),
        variant: "destructive",
      });
    },
  });
}

/** Import one task from a pasted link or id. */
export function useImportTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reference: string): Promise<ImportTaskResult> => {
      const client = getApiClient();
      const response = await client.post<{
        success: boolean;
        data: ImportTaskResult;
      }>("integrations/import", { reference });
      return response.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      toast({
        title: result.alreadyExisted
          ? "Already imported"
          : "Task imported",
        description: result.alreadyExisted
          ? `"${result.task.title}" is already in your backlog.`
          : `"${result.task.title}" is in your backlog.`,
      });
    },
    onError: (error) => {
      toast({
        ...describeIntegrationError(error, "Couldn't import"),
        variant: "destructive",
      });
    },
  });
}

/** Pull a linked task's current values from the provider. */
export function useRefreshLinkedTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      linkId: string
    ): Promise<{ task: Task; link: TaskExternalLink }> => {
      const client = getApiClient();
      const response = await client.post<{
        success: boolean;
        data: { task: Task; link: TaskExternalLink };
      }>(`integrations/links/${linkId}/refresh`);
      return response.data;
    },
    onSuccess: ({ link }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      if (link.status === "orphaned") {
        toast({
          title: "Gone upstream",
          description:
            "That task no longer exists in the source. Your local copy is untouched.",
        });
      } else {
        toast({ title: "Refreshed from source" });
      }
    },
    onError: (error) => {
      toast({
        ...describeIntegrationError(error, "Couldn't refresh"),
        variant: "destructive",
      });
    },
  });
}
