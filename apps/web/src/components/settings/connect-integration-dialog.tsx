import * as React from "react";
import { ExternalLink, Loader2 } from "lucide-react";
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
import type { IntegrationProviderInfo } from "@open-sunsama/types";
import { useConnectIntegration } from "@/hooks/useIntegrations";
import { getIntegrationProviderConfig } from "./integration-provider-icons";

interface ConnectIntegrationDialogProps {
  provider: IntegrationProviderInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Credential-paste connect flow, driven entirely by the provider's
 * `credentialFields`. Adding a provider with different fields needs no
 * change here.
 */
export function ConnectIntegrationDialog({
  provider,
  open,
  onOpenChange,
}: ConnectIntegrationDialogProps) {
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [error, setError] = React.useState<string | null>(null);

  const connectMutation = useConnectIntegration();
  const config = provider
    ? getIntegrationProviderConfig(provider.id)
    : null;

  const reset = React.useCallback(() => {
    setValues({});
    setError(null);
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider) return;
    setError(null);

    const missing = provider.credentialFields.find(
      (field) => !values[field.key]?.trim()
    );
    if (missing) {
      setError(`${missing.label} is required`);
      return;
    }

    const credentials = Object.fromEntries(
      provider.credentialFields.map((field) => [
        field.key,
        values[field.key]!.trim(),
      ])
    );

    try {
      await connectMutation.mutateAsync({ provider: provider.id, credentials });
      reset();
      onOpenChange(false);
    } catch (err) {
      // The mutation already toasts; this keeps the reason in front of
      // the user while the dialog stays open so they can fix the token.
      if (err instanceof Error) setError(err.message);
    }
  };

  if (!provider || !config) return null;

  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              Connect {provider.displayName}
            </DialogTitle>
            <DialogDescription>{config.blurb}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {provider.credentialFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={`integration-${field.key}`}>
                  {field.label}
                </Label>
                <Input
                  id={`integration-${field.key}`}
                  type={field.type}
                  autoComplete="off"
                  placeholder={field.placeholder}
                  value={values[field.key] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                  disabled={connectMutation.isPending}
                />
                {field.help && (
                  <p className="text-xs text-muted-foreground">{field.help}</p>
                )}
              </div>
            ))}

            <a
              href={provider.docsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Where do I find this?
              <ExternalLink className="h-3 w-3" />
            </a>

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
              disabled={connectMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={connectMutation.isPending}>
              {connectMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Connect
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
