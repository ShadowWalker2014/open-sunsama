import { format, formatDistanceToNow } from "date-fns";
import { Key, MoreVertical, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ApiKey } from "@chronoflow/types";

interface ApiKeyCardProps {
  apiKey: ApiKey;
  onRevoke: (apiKey: ApiKey) => void;
}

/**
 * Display card for a single API key
 * Shows key name, masked prefix, dates, and status
 */
export function ApiKeyCard({ apiKey, onRevoke }: ApiKeyCardProps) {
  const isExpired = apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date();
  const isActive = !isExpired;

  const formatLastUsed = (date: Date | null) => {
    if (!date) return "Never used";
    return `Last used ${formatDistanceToNow(new Date(date), { addSuffix: true })}`;
  };

  const formatCreatedDate = (date: Date) => {
    return format(new Date(date), "MMM d, yyyy");
  };

  return (
    <Card className={cn(!isActive && "opacity-60")}>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <Key className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{apiKey.name}</span>
              {isActive ? (
                <Badge variant="success">Active</Badge>
              ) : (
                <Badge variant="warning">Expired</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                {apiKey.keyPrefix}...
              </code>
              <span>·</span>
              <span>Created {formatCreatedDate(apiKey.createdAt)}</span>
              <span>·</span>
              <span>{formatLastUsed(apiKey.lastUsedAt)}</span>
            </div>
            {apiKey.scopes.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {apiKey.scopes.map((scope) => (
                  <Badge key={scope} variant="outline" className="text-xs">
                    {scope}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isActive && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onRevoke(apiKey)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Revoke Key
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
