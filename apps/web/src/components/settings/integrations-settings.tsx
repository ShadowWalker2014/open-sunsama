import * as React from "react";
import { Loader2, Plug, Plus } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import type { IntegrationProviderInfo } from "@open-sunsama/types";
import {
  useDisconnectIntegration,
  useIntegrationAccounts,
  useIntegrationProviders,
} from "@/hooks/useIntegrations";
import { ConnectIntegrationDialog } from "./connect-integration-dialog";
import { IntegrationAccountCard } from "./integration-account-card";
import { getIntegrationProviderConfig } from "./integration-provider-icons";

export function IntegrationsSettings() {
  const { data: providers = [] } = useIntegrationProviders();
  const { data: accounts = [], isLoading } = useIntegrationAccounts();
  const disconnectMutation = useDisconnectIntegration();

  const [connectProvider, setConnectProvider] =
    React.useState<IntegrationProviderInfo | null>(null);

  const handleDisconnect = (accountId: string, label: string) => {
    // Disconnecting keeps every imported task, so a plain confirm is
    // proportionate — nothing here is destructive.
    if (
      !window.confirm(
        `Disconnect ${label}? Imported tasks are kept, they just can't be refreshed any more.`
      )
    ) {
      return;
    }
    disconnectMutation.mutate(accountId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5" />
            Task sources
          </CardTitle>
          <CardDescription>
            Connect a tool, then pull individual tasks in with{" "}
            <span className="font-medium">Import</span> on the Tasks or Board
            page. Nothing syncs automatically and nothing is written back.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : accounts.length > 0 ? (
            <div className="space-y-3">
              {accounts.map((account) => (
                <IntegrationAccountCard
                  key={account.id}
                  account={account}
                  onDisconnect={() =>
                    handleDisconnect(account.id, account.label)
                  }
                />
              ))}
            </div>
          ) : (
            <p className="py-2 text-sm text-muted-foreground">
              {providers.length ? "No task sources connected yet." : "No task sources available yet."}
            </p>
          )}

          <div className="flex flex-wrap gap-2 border-t pt-4">
            {providers.map((provider) => {
              const config = getIntegrationProviderConfig(provider.id);
              const Icon = config.icon;
              return (
                <Button
                  key={provider.id}
                  variant="outline"
                  onClick={() => setConnectProvider(provider)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <Plus className="mr-1 h-3 w-3" />
                  {provider.displayName}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <ConnectIntegrationDialog
        provider={connectProvider}
        open={connectProvider !== null}
        onOpenChange={(open) => {
          if (!open) setConnectProvider(null);
        }}
      />
    </div>
  );
}
