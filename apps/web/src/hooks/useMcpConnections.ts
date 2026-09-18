import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

/** An AI app the user authorized through the MCP OAuth connector flow. */
export interface McpConnection {
  clientId: string;
  clientName: string;
  clientUri: string | null;
  logoUri: string | null;
  verifiedDomain: string | null;
  scopes: string[];
  connectedAt: string;
  lastUsedAt: string | null;
}

const connectionsKey = ["mcp", "connections"] as const;

export function useMcpConnections() {
  return useQuery({
    queryKey: connectionsKey,
    queryFn: async () => {
      const res = await getApiClient().get<{ data: McpConnection[] }>("oauth/connections");
      return res.data;
    },
  });
}

export function useDisconnectMcpConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (clientId: string) => {
      await getApiClient().delete(`oauth/connections/${encodeURIComponent(clientId)}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: connectionsKey });
      toast({ title: "Disconnected", description: "The app can no longer access your account." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Couldn't disconnect", description: "Please try again." });
    },
  });
}
