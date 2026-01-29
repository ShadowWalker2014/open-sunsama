import * as React from "react";
import { Key, Plus, Loader2, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from "@/components/ui";
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from "@/hooks/useApiKeys";
import type { ApiKey, CreateApiKeyInput, CreateApiKeyResponse } from "@/hooks/useApiKeys";
import { ApiKeyCard } from "./api-key-card";
import { CreateApiKeyDialog } from "./create-api-key-dialog";
import { RevokeKeyDialog } from "./revoke-key-dialog";

/**
 * API Keys settings tab content
 * Displays list of keys and provides create/revoke functionality
 */
export function ApiKeysSettings() {
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = React.useState(false);
  const [keyToRevoke, setKeyToRevoke] = React.useState<ApiKey | null>(null);

  const { data: apiKeys, isLoading, isError, error } = useApiKeys();
  const createMutation = useCreateApiKey();
  const revokeMutation = useRevokeApiKey();

  const handleCreateKey = async (data: CreateApiKeyInput): Promise<CreateApiKeyResponse> => {
    return createMutation.mutateAsync(data);
  };

  const handleRevokeClick = (apiKey: ApiKey) => {
    setKeyToRevoke(apiKey);
    setRevokeDialogOpen(true);
  };

  const handleRevokeConfirm = async () => {
    if (!keyToRevoke) return;

    try {
      await revokeMutation.mutateAsync(keyToRevoke.id);
      setRevokeDialogOpen(false);
      setKeyToRevoke(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleRevokeDialogChange = (open: boolean) => {
    setRevokeDialogOpen(open);
    if (!open) {
      setKeyToRevoke(null);
    }
  };

  // Filter active and revoked keys
  const activeKeys = apiKeys?.filter((key: ApiKey) => !key.revokedAt) ?? [];
  const revokedKeys = apiKeys?.filter((key: ApiKey) => key.revokedAt) ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Manage API keys for external integrations and third-party applications
          </CardDescription>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Generate New Key
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Security Notice */}
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="flex items-start gap-3">
            <Key className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">API Key Security</p>
              <p className="text-xs text-muted-foreground">
                API keys grant access to your Chronoflow data. Keep them secure and
                never share them publicly. Keys are only shown once at creation -
                store them safely. Revoked keys cannot be restored.
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">
                Failed to load API keys: {error instanceof Error ? error.message : "Unknown error"}
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && apiKeys?.length === 0 && (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Key className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No API Keys</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              You haven't created any API keys yet. Create one to integrate with
              external applications.
            </p>
            <Button
              className="mt-4"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Key
            </Button>
          </div>
        )}

        {/* Active Keys */}
        {!isLoading && !isError && activeKeys.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Active Keys ({activeKeys.length})
            </h3>
            <div className="space-y-2">
              {activeKeys.map((apiKey: ApiKey) => (
                <ApiKeyCard
                  key={apiKey.id}
                  apiKey={apiKey}
                  onRevoke={handleRevokeClick}
                />
              ))}
            </div>
          </div>
        )}

        {/* Revoked Keys */}
        {!isLoading && !isError && revokedKeys.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Revoked Keys ({revokedKeys.length})
            </h3>
            <div className="space-y-2">
              {revokedKeys.map((apiKey: ApiKey) => (
                <ApiKeyCard
                  key={apiKey.id}
                  apiKey={apiKey}
                  onRevoke={handleRevokeClick}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Dialogs */}
      <CreateApiKeyDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateKey}
        isLoading={createMutation.isPending}
      />

      <RevokeKeyDialog
        apiKey={keyToRevoke}
        open={revokeDialogOpen}
        onOpenChange={handleRevokeDialogChange}
        onConfirm={handleRevokeConfirm}
        isLoading={revokeMutation.isPending}
      />
    </Card>
  );
}
