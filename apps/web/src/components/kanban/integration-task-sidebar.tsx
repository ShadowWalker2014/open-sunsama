import * as React from "react";
import { useDraggable } from "@dnd-kit/core";
import { GripVertical, Plug, RefreshCw, Search } from "lucide-react";
import type {
  ExternalTaskSummary,
  IntegrationAccount,
} from "@open-sunsama/types";
import { Button } from "@/components/ui";
import { renderInlineMarkdown } from "@/components/ui/inline-markdown";
import { Link } from "@tanstack/react-router";
import {
  useIntegrationAccounts,
  useIntegrationTasks,
} from "@/hooks/useIntegrations";
import { getIntegrationProviderConfig } from "@/components/settings/integration-provider-icons";

interface ExternalTaskDragData {
  accountId: string;
  externalTask: ExternalTaskSummary;
}

function PickerTask({
  accountId,
  task,
}: {
  accountId: string;
  task: ExternalTaskSummary;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `external-task-${accountId}-${task.externalId}`,
      data: { accountId, externalTask: task } satisfies ExternalTaskDragData,
    });

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
          : undefined
      }
      className="flex w-full items-start gap-1.5 rounded-md border border-border/70 bg-card px-2 py-2 text-left text-xs shadow-sm transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      aria-label={`Drag ${task.title} onto the board to import it`}
    >
      <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className={isDragging ? "opacity-40" : "min-w-0"}>
        <span className="line-clamp-2 block font-medium">{renderInlineMarkdown(task.title)}</span>
        {(task.containerName || task.dueDate) && (
          <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
            {[task.containerName, task.dueDate ? `Due ${task.dueDate}` : null]
              .filter(Boolean)
              .join(" · ")}
          </span>
        )}
      </span>
    </button>
  );
}

function AccountTasks({ account }: { account: IntegrationAccount }) {
  const {
    data: tasks = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useIntegrationTasks(account.id);
  const [query, setQuery] = React.useState("");
  const [project, setProject] = React.useState("all");

  React.useEffect(() => {
    setQuery("");
    setProject("all");
  }, [account.id]);

  if (isLoading)
    return (
      <p className="px-2 py-3 text-xs text-muted-foreground">Loading tasks…</p>
    );
  if (isError)
    return (
      <div className="space-y-2 px-2 py-3 text-xs text-muted-foreground">
        <p>Couldn&apos;t load tasks.</p>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-1.5 text-xs"
          onClick={() => void refetch()}
        >
          Retry
        </Button>
      </div>
    );
  if (!tasks.length)
    return (
      <p className="px-2 py-3 text-xs text-muted-foreground">
        No open tasks found.
      </p>
    );

  const openTasks = tasks.filter((task) => !task.isCompleted);
  if (!openTasks.length)
    return (
      <p className="px-2 py-3 text-xs text-muted-foreground">
        No open tasks found.
      </p>
    );

  const projects = [
    ...new Set(
      openTasks
        .map((task) => task.projectName ?? task.containerName)
        .filter((name): name is string => name !== null)
    ),
  ].sort((a, b) => a.localeCompare(b));
  const filteredTasks = openTasks.filter(
    (task) =>
      (project === "all" || (task.projectName ?? task.containerName) === project) &&
      task.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
  );

  return (
    <div className="space-y-1.5 px-2 pb-2">
      <div className="flex items-center justify-between px-0.5 text-[11px] text-muted-foreground">
        <span>Drag a task onto a day</span>
        <button
          type="button"
          onClick={() => void refetch()}
          aria-label="Refresh source tasks"
          disabled={isFetching}
        >
          <RefreshCw
            className={isFetching ? "h-3 w-3 animate-spin" : "h-3 w-3"}
          />
        </button>
      </div>
      <div className="space-y-1.5">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tasks"
            aria-label="Search Todoist tasks"
            className="h-8 w-full rounded-md border bg-background pl-7 pr-2 text-xs outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
          />
        </label>
        <select
          value={project}
          onChange={(event) => setProject(event.target.value)}
          aria-label="Todoist project"
          className="h-8 w-full rounded-md border bg-background px-2 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="all">All projects</option>
          {projects.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      {filteredTasks.length === 0 && (
        <p className="px-0.5 py-2 text-xs text-muted-foreground">No matching tasks.</p>
      )}
      {filteredTasks.map((task) => (
        <PickerTask key={task.externalId} accountId={account.id} task={task} />
      ))}
    </div>
  );
}

/** Connected source tasks that can be dragged directly into the board. */
export function IntegrationTaskSidebar() {
  const { data: accounts = [], isLoading } = useIntegrationAccounts();
  const activeAccounts = accounts.filter(
    (account) => account.isActive && account.provider === "todoist"
  );
  const [selectedAccountId, setSelectedAccountId] = React.useState<
    string | null
  >(null);
  const selectedAccount =
    activeAccounts.find((account) => account.id === selectedAccountId) ??
    activeAccounts[0];

  if (isLoading) return null;

  if (!activeAccounts.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm font-medium">Connect Todoist</p>
        <p className="text-xs text-muted-foreground">
          Browse Todoist tasks here and drag them onto your board.
        </p>
        <Button asChild size="sm">
          <Link to="/app/settings" search={{ tab: "integrations" } as never}>
            Connect Todoist
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <aside
      className="flex h-full min-h-0 flex-col"
      aria-label="Todoist task picker"
    >
      <div className="border-b px-3 py-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Plug className="h-4 w-4" />
          Todoist
        </div>
        {activeAccounts.length > 1 && (
          <select
            value={selectedAccount?.id ?? ""}
            onChange={(event) => setSelectedAccountId(event.target.value)}
            className="mt-2 h-7 w-full rounded border bg-background px-1.5 text-xs"
            aria-label="Integration account"
          >
            {activeAccounts.map((account) => {
              const config = getIntegrationProviderConfig(account.provider);
              return (
                <option key={account.id} value={account.id}>
                  {config.name}: {account.label}
                </option>
              );
            })}
          </select>
        )}
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto pt-2">
        {selectedAccount && <AccountTasks account={selectedAccount} />}
      </div>
    </aside>
  );
}
