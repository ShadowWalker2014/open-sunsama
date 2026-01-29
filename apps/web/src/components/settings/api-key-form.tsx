import * as React from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
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
import type { CreateApiKeyInput, ApiKeyScope } from "@chronoflow/types";

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

interface ApiKeyFormProps {
  open: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (data: CreateApiKeyInput) => Promise<void>;
}

export function ApiKeyForm({
  open,
  isLoading,
  onClose,
  onSubmit,
}: ApiKeyFormProps) {
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

    await onSubmit(input);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => reset(), 200);
  };

  const toggleScope = (scopeId: keyof FormData["scopes"]) => {
    setValue(`scopes.${scopeId}`, !watchedScopes[scopeId]);
  };

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
