import { CalendarClock, CalendarDays, CheckSquare, ListChecks, Lock, User, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/landing/motion";
import { CARD, CONTAINER, MarketingPageView, SECTION, SectionHeading } from "@/components/marketing";
import page, {
  ACCESS_LABEL,
  TOOL_GROUPS,
  type McpToolGroup,
  type ToolAccess,
} from "@/content/marketing/features/ai-integration";
import type { CustomSection } from "@/content/marketing/types";
import { cn } from "@/lib/utils";

const GROUP_ICONS: Record<string, LucideIcon> = {
  Tasks: CheckSquare,
  "Time blocks": CalendarClock,
  Subtasks: ListChecks,
  "Calendar events": CalendarDays,
  Profile: User,
};

const ACCESS_STYLE: Record<ToolAccess, string> = {
  read: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  write: "bg-primary/10 text-primary",
  delete: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
};

function AccessBadge({ access }: { access: ToolAccess }) {
  return (
    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium leading-4", ACCESS_STYLE[access])}>
      {ACCESS_LABEL[access]}
    </span>
  );
}

function GroupCard({ group, delay }: { group: McpToolGroup; delay: number }) {
  const Icon = GROUP_ICONS[group.title] ?? CheckSquare;
  const readOnly = group.tools.every((tool) => tool.access === "read");
  return (
    <Reveal
      delay={delay}
      className={cn(CARD, "overflow-hidden", readOnly && "ring-1 ring-primary/30 dark:ring-primary/40")}
    >
      <div className="flex items-start gap-3 border-b border-border/60 px-5 py-4">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em]">
            {group.title}
            <span className="text-[12px] font-medium tabular-nums text-muted-foreground">{group.tools.length}</span>
          </h3>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{group.note}</p>
        </div>
        {readOnly && (
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-primary/30 px-2 py-0.5 text-[11px] font-medium text-primary">
            <Lock className="h-3 w-3" aria-hidden />
            Read-only
          </span>
        )}
      </div>
      <ul className="divide-y divide-border/50 px-5">
        {group.tools.map((tool) => (
          <li key={tool.name} className="py-3">
            <div className="flex items-center justify-between gap-3">
              <code className="min-w-0 break-all font-mono text-[13px] font-medium text-foreground">{tool.name}</code>
              <AccessBadge access={tool.access} />
            </div>
            <p className="mt-1 text-[13.5px] leading-snug text-muted-foreground">{tool.does}</p>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

/** Every MCP tool, grouped, with what it can touch: the "tools" custom section. */
function ToolsReference() {
  const section = page.sections.find((s): s is CustomSection => s.kind === "custom" && s.id === "tools");
  const byTitle = (title: string) => TOOL_GROUPS.find((g) => g.title === title);
  const columns = [
    ["Tasks", "Calendar events", "Profile"],
    ["Time blocks", "Subtasks"],
  ].map((titles) => titles.map(byTitle).filter((g): g is McpToolGroup => Boolean(g)));

  return (
    <section id="tools" className={SECTION} aria-labelledby="tools-heading">
      <div className={CONTAINER}>
        <SectionHeading id="tools-heading" eyebrow={section?.eyebrow} heading={section?.heading ?? ""} lead={section?.lead} />
        <Reveal className="mt-8 flex flex-wrap items-center justify-center gap-2 text-[12.5px] text-muted-foreground">
          {(Object.keys(ACCESS_LABEL) as ToolAccess[]).map((access) => (
            <AccessBadge key={access} access={access} />
          ))}
        </Reveal>
        {/* Phones: one column in reading order. md and up: two balanced columns. */}
        <div className="mx-auto mt-8 flex max-w-5xl flex-col gap-4 md:hidden">
          {TOOL_GROUPS.map((group, i) => (
            <GroupCard key={group.title} group={group} delay={i * 60} />
          ))}
        </div>
        <div className="mx-auto mt-8 hidden max-w-5xl grid-cols-2 gap-5 md:grid">
          {columns.map((groups, col) => (
            <div key={col} className="flex min-w-0 flex-col gap-5">
              {groups.map((group, i) => (
                <GroupCard key={group.title} group={group} delay={(col + i) * 80} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * /features/ai-integration, built from the marketing kit. Copy and the tool
 * list live in src/content/marketing/features/ai-integration.ts.
 */
export default function AiIntegrationFeaturePage() {
  return <MarketingPageView page={page} slots={{ tools: <ToolsReference /> }} />;
}
