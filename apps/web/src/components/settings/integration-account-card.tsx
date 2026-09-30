import { MoreVertical, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import type { IntegrationAccount } from "@open-sunsama/types";
import { getIntegrationProviderConfig } from "./integration-provider-icons";

interface IntegrationAccountCardProps {
  account: IntegrationAccount;
  onDisconnect: () => void;
}

export function IntegrationAccountCard({
  account,
  onDisconnect,
}: IntegrationAccountCardProps) {
  const config = getIntegrationProviderConfig(account.provider);
  const Icon = config.icon;

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Icon className="h-6 w-6 shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{config.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {account.label}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="outline" className="text-muted-foreground">
            Connected
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={onDisconnect}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
