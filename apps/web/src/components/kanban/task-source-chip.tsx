import * as React from "react";
import {
  ExternalLink,
  GitPullRequest,
  Loader2,
  RefreshCw,
  Unlink,
} from "lucide-react";
import type { TaskExternalLink } from "@open-sunsama/types";
import { getIntegrationProviderConfig } from "@/components/settings/integration-provider-icons";
import { useRefreshLinkedTask } from "@/hooks/useIntegrations";
import { cn } from "@/lib/utils";

/**
 * Where a task came from, and what else is attached to it.
 *
 * A task can carry several links at once — the external task it was
 * imported from plus a pull request someone attached by hand — so this
 * renders a row of chips rather than a single source label.
 *
 * Stays visible on completed cards: completing a task must not hide its
 * fields.
 */
export function TaskSourceChips({
  links,
  className,
  showRefresh = false,
}: {
  links: TaskExternalLink[] | undefined;
  className?: string;
  /**
   * Show the refresh affordance. Off on the board card, where space is
   * tight and a stray click is expensive; on in the task detail panel.
   */
  showRefresh?: boolean;
}) {
  if (!links?.length) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {links.map((link) => (
        <TaskSourceChip key={link.id} link={link} showRefresh={showRefresh} />
      ))}
    </div>
  );
}

function TaskSourceChip({
  link,
  showRefresh,
}: {
  link: TaskExternalLink;
  showRefresh: boolean;
}) {
  const config = getIntegrationProviderConfig(link.provider);
  const ProviderIcon = config.icon;
  const refreshMutation = useRefreshLinkedTask();

  const label =
    link.remoteMeta?.containerName ||
    (link.kind === "pull_request" ? "Pull request" : config.name);

  const isOrphaned = link.status === "orphaned";
  // Only the source link owns the task's fields, and only a link with a
  // live account can be fetched again.
  const canRefresh =
    showRefresh && link.role === "source" && link.accountId !== null;

  const chipStyle = {
    color: config.chipColor,
    backgroundColor: `${config.chipColor}15`,
  };

  const inner = (
    <>
      {link.kind === "pull_request" ? (
        <GitPullRequest className="h-3 w-3 shrink-0" />
      ) : (
        <ProviderIcon className="h-3 w-3 shrink-0" />
      )}
      <span className="truncate">{label}</span>
      {isOrphaned ? (
        <Unlink className="h-2.5 w-2.5 shrink-0 opacity-70" />
      ) : (
        <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-0 transition-opacity group-hover/chip:opacity-70" />
      )}
    </>
  );

  const chipClass = cn(
    "group/chip inline-flex max-w-[140px] items-center gap-1 rounded px-1.5 py-0.5 text-[11px]",
    isOrphaned && "opacity-60"
  );

  const chip = link.externalUrl ? (
    <a
      href={link.externalUrl}
      target="_blank"
      rel="noreferrer"
      // The card is a drag handle and opens a modal on click; both have
      // to be suppressed or opening the source is impossible.
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn(chipClass, "hover:underline")}
      style={chipStyle}
      title={
        isOrphaned
          ? `Removed in ${config.name} — open anyway`
          : `Open in ${config.name}`
      }
    >
      {inner}
    </a>
  ) : (
    <span className={chipClass} style={chipStyle}>
      {inner}
    </span>
  );

  if (!canRefresh) return chip;

  return (
    <span className="inline-flex items-center gap-0.5">
      {chip}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          refreshMutation.mutate(link.id);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        disabled={refreshMutation.isPending}
        title={`Pull the latest values from ${config.name}`}
        className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
      >
        {refreshMutation.isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <RefreshCw className="h-3 w-3" />
        )}
      </button>
    </span>
  );
}
