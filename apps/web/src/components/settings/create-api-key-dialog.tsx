import * as React from "react";
import { useForm } from "react-hook-form";
import { Copy, Check, AlertTriangle, Loader2, Key } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type { CreateApiKeyInput, CreateApiKeyResponse, ApiKeyScope } from "@chronoflow/types";

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateApiKeyInput) => Promise<CreateApiKeyResponse>;
  isLoading?: boolean;
}

interface FormData {
  name: string;
  expiresAt: string;
  scopes: {
    "tasks:read": boolean;
    "tasks:write": boolean;
    "time-blocks:read": boolean;
    "time-blocks:write": boolean;
  };
}

const AVAILABLE_SCOPES = [
  { id: "tasks:read", label: "Tasks Read", description: "View tasks" },
  { id: "tasks:write", label: "Tasks Write", description: "Create, update, delete tasks" },
  { id: "time-blocks:read", label: "Time Blocks Read", description: "View time blocks" },
  { id: "time-blocks:write", label: "Time Blocks Write", description: "Create, update, delete time blocks" },
] as const;

/**
 * Dialog for creating a new API key
 * Two-phase flow: input form -> key display
 */
export function CreateApiKeyDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: CreateApiKeyDialogProps) {
  const [createdKey, setCreatedKey] = React.useState<CreateApiKeyResponse | null>(null);
  const [copied, setCopied] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      expiresAt: "",
      scopes: {
        "tasks:read": true,
        "tasks:write": false,
        "time-blocks:read": true,
        "time-blocks:write": false,
      },
    },
  });

  const watchedScopes = watch("scopes");

  const handleFormSubmit = async (data: FormData) => {
    const selectedScopes = Object.entries(data.scopes)
      .filter(([_, enabled]) => enabled)
      .map(([scope]) => scope);

    const input: CreateApiKeyInput = {
      name: data.name,
      scopes: selectedScopes as ApiKeyScope[],
      expiresAt: data.expiresAt || null,
    };

    try {
      const response = await onSubmit(input);
      setCreatedKey(response);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCopyKey = async () => {
    if (!createdKey) return;

    try {
      await navigator.clipboard.writeText(createdKey.key);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "API key copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Could not copy to clipboard",
      });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation completes
    setTimeout(() => {
      setCreatedKey(null);
      setCopied(false);
      reset();
    }, 200);
  };

  const toggleScope = (scopeId: keyof FormData["scopes"]) => {
    setValue(`scopes.${scopeId}`, !watchedScopes[scopeId]);
  };

  // Show key display if key was created
  if (createdKey) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                <Key className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <DialogTitle>API Key Created</DialogTitle>
                <DialogDescription>
                  {createdKey.apiKey.name}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium text-yellow-500">
                    Copy your API key now
                  </p>
                  <p className="text-xs text-yellow-500/80">
                    This is the only time you'll see this key. Store it securely - 
                    you won't be able to retrieve it later.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Your API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    value={createdKey.key}
                    readOnly
                    className="font-mono text-sm pr-10"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyKey}
                  className={cn(
                    "shrink-0",
                    copied && "border-green-500 text-green-500"
                  )}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="sr-only">Copy</span>
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Show creation form
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
          <DialogDescription>
            Create a new API key to access Chronoflow from external applications
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="space-y-4 py-4">
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name">Key Name *</Label>
              <Input
                id="name"
                placeholder="e.g., My Integration"
                {...register("name", { required: "Name is required" })}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                A descriptive name to help you identify this key
              </p>
            </div>

            {/* Expiration Date */}
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expiration Date (optional)</Label>
              <Input
                id="expiresAt"
                type="date"
                {...register("expiresAt")}
                disabled={isLoading}
                min={new Date().toISOString().split("T")[0]}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for no expiration
              </p>
            </div>

            {/* Scopes */}
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid gap-2">
                {AVAILABLE_SCOPES.map((scope) => (
                  <label
                    key={scope.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                      watchedScopes[scope.id as keyof FormData["scopes"]]
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={watchedScopes[scope.id as keyof FormData["scopes"]]}
                      onChange={() => toggleScope(scope.id as keyof FormData["scopes"])}
                      disabled={isLoading}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{scope.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {scope.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Key
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
