import * as React from "react";
import { Loader2, Plug } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
} from "@/components/ui";
import {
  useImportTask,
  useIntegrationAccounts,
  useIntegrationProviders,
} from "@/hooks/useIntegrations";
import { getIntegrationProviderConfig } from "@/components/settings/integration-provider-icons";

interface ImportTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Paste a task link or id from a connected source and pull it in.
 *
 * The provider is worked out from the reference itself, so there is no
 * source picker to get wrong.
 */
export function ImportTaskDialog({
  open,
  onOpenChange,
}: ImportTaskDialogProps) {
  const [reference, setReference] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const importMutation = useImportTask();
  const { data: accounts = [], isLoading: accountsLoading } =
    useIntegrationAccounts();
  const { data: providers = [] } = useIntegrationProviders();

  const hasAccount = accounts.length > 0;

  // Show the example from a provider the user has actually connected.
  const placeholder = React.useMemo(() => {
    const connected = providers.find((p) =>
      accounts.some((a) => a.provider === p.id)
    );
    return connected?.referenceExample ?? providers[0]?.referenceExample ?? "";
  }, [providers, accounts]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setReference("");
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reference.trim()) {
      setError("Paste a task link or id");
      return;
    }

    try {
      await importMutation.mutateAsync(reference.trim());
      setReference("");
      onOpenChange(false);
    } catch (err) {
      // The mutation toasts too; this keeps the reason in front of the
      // user while the dialog stays open so they can fix the link.
      if (err instanceof Error) setError(err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Import a task</DialogTitle>
            <DialogDescription>
              Paste a link or id from a connected source. The task lands in
              your backlog — nothing is written back.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!accountsLoading && !hasAccount ? (
              <div className="flex items-start gap-3 rounded-md border border-dashed p-4">
                <Plug className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium">No sources connected</p>
                  <p className="text-muted-foreground">
                    Connect one in Settings → Integrations, then come back and
                    paste a link.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="import-reference">Task link or id</Label>
                  <Input
                    id="import-reference"
                    autoFocus
                    autoComplete="off"
                    placeholder={placeholder}
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    disabled={importMutation.isPending}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>Connected:</span>
                  {accounts.map((account) => {
                    const config = getIntegrationProviderConfig(
                      account.provider
                    );
                    const Icon = config.icon;
                    return (
                      <span
                        key={account.id}
                        className="inline-flex items-center gap-1"
                      >
                        <Icon className="h-3 w-3" />
                        {config.name}
                      </span>
                    );
                  })}
                </div>
              </>
            )}

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={importMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={importMutation.isPending || !hasAccount}
            >
              {importMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Import
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
