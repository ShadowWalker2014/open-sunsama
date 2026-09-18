import { FeatureLayout } from "@/components/layout/feature-layout";
import { AssistantDemo } from "@/components/landing/ai-section";
import { Bot, Key, Command, ArrowRight } from "lucide-react";
import { useSEO, SEO_CONFIGS } from "@/hooks/useSEO";

function FeatureItem({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="text-[13px] font-semibold">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

export default function AIIntegrationFeaturePage() {
  useSEO(SEO_CONFIGS.features.aiIntegration);

  return (
    <FeatureLayout
      visual={<div className="mx-auto max-w-4xl"><AssistantDemo /></div>}
      badge="Feature"
      title="AI Integration"
      subtitle="Connect Claude, ChatGPT, or Cursor with one URL and let AI agents schedule, manage, and optimize your day."
    >
      {/* Features */}
      <section className="py-12 border-t border-border/40 bg-muted/10">
        <div className="container px-4 mx-auto max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureItem
              icon={Bot}
              title="23 MCP Tools"
              description="Full suite of tools for tasks, time blocks, subtasks, and user management."
            />
            <FeatureItem
              icon={Key}
              title="Sign In, Don't Paste Keys"
              description="Connect with OAuth: approve exactly what each assistant can access, and disconnect it anytime."
            />
            <FeatureItem
              icon={Command}
              title="Command Palette"
              description="⌘K opens a smart palette with contextual AI commands and quick actions."
            />
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="py-12 border-t border-border/40">
        <div className="container px-4 mx-auto max-w-3xl">
          <div className="space-y-8">
            <div>
              <h3 className="text-[15px] font-semibold mb-2">Available MCP Tools</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  "list_tasks", "create_task", "update_task", "complete_task",
                  "list_time_blocks", "create_time_block", "get_schedule_for_day",
                  "list_subtasks", "create_subtask", "toggle_subtask"
                ].map((tool, i) => (
                  <div key={i} className="px-2 py-1.5 rounded bg-muted/50 font-mono text-muted-foreground">
                    {tool}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-[15px] font-semibold mb-2">Permissions You Approve</h3>
              <ul className="space-y-2">
                {[
                  "tasks:read - View tasks and subtasks",
                  "tasks:write - Create, update, complete tasks",
                  "time-blocks:read - View schedule and blocks",
                  "time-blocks:write - Manage time blocks"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ArrowRight className="h-3 w-3 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-[15px] font-semibold mb-2">One-URL Setup</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Add <code className="rounded bg-muted px-1 py-0.5 text-xs">https://api.opensunsama.com/mcp</code> to
                Claude, ChatGPT, or Cursor and sign in. No API key and no install: the MCP server runs on our
                infrastructure. Prefer a local server? <code className="text-xs">npx @open-sunsama/mcp</code> still works.
              </p>
            </div>
          </div>
        </div>
      </section>
    </FeatureLayout>
  );
}
