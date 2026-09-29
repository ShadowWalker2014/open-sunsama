/**
 * Brand marks and per-provider presentation for task sources.
 *
 * Mirrors `calendar-provider-icons.tsx`: adding a provider is a single
 * entry here plus its backend implementation.
 */
import * as React from "react";
import { Plug } from "lucide-react";

export interface IntegrationProviderConfig {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Tailwind classes for the source chip shown on task cards. */
  chipColor: string;
  /** What the user should expect after connecting. */
  blurb: string;
}

export function TodoistIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#E44332" />
      <path d="m7 12 3 3 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
