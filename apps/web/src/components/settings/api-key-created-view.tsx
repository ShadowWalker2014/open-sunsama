import * as React from "react";
import { Copy, Check, AlertTriangle, Key } from "lucide-react";
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
import type { CreateApiKeyResponse } from "@open-sunsama/types";

interface ApiKeyCreatedViewProps {
  open: boolean;
  createdKey: CreateApiKeyResponse;
  onClose: () => void;
}

export function ApiKeyCreatedView({
  open,
  createdKey,
  onClose,
}: ApiKeyCreatedViewProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(createdKey.key);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "API key copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Could not copy to clipboard",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
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
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
