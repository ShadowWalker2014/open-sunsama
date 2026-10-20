/**
 * Brand marks and per-provider presentation for task sources.
 *
 * Mirrors `calendar-provider-icons.tsx`: adding a provider is a single
 * entry here plus its backend implementation.
 */
import type * as React from "react";
import { Plug } from "lucide-react";
import { TodoistIcon } from "@/components/ui/todoist-icon";

export interface IntegrationProviderConfig {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Tailwind classes for the source chip shown on task cards. */
  chipColor: string;
  /** What the user should expect after connecting. */
  blurb: string;
}

export const INTEGRATION_PROVIDER_CONFIG: Record<string, IntegrationProviderConfig> = {
  todoist: {
    name: "Todoist",
    icon: TodoistIcon,
    chipColor: "#E44332",
    blurb: "Import one task at a time into your backlog. Nothing is written back to Todoist.",
  },
};

export function getIntegrationProviderConfig(
  provider: string
): IntegrationProviderConfig {
  return (
    INTEGRATION_PROVIDER_CONFIG[provider] ?? {
      name: provider,
      icon: Plug,
      chipColor: "#6366F1",
      blurb: "",
    }
  );
}
