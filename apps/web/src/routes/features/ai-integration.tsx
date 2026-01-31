import { FeatureLayout } from "@/components/layout/feature-layout";
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
      badge="Feature"
      title="AI Integration"
      subtitle="Full MCP support lets AI agents schedule, manage, and optimize your day autonomously."
    >
      {/* Visual Demo */}
      <section className="pb-12">
        <div className="container px-4 mx-auto max-w-4xl">
          <div className="rounded-xl border border-border/40 bg-card/50 p-1 shadow-lg">
            <div className="rounded-lg border border-border/40 bg-background overflow-hidden">
              {/* Mock MCP interaction */}
              <div className="p-4 md:p-6 font-mono text-xs">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground">→</span>
                    <span className="text-primary">create_task</span>
                    <span className="text-muted-foreground">{"{"}</span>
                  </div>
                  <div className="pl-6 text-muted-foreground">
                    <div>"title": "Review Q4 planning doc",</div>
                    <div>"priority": "P1",</div>
                    <div>"scheduledDate": "2026-01-30",</div>
                    <div>"estimatedMins": 45</div>
                  </div>
                  <div className="text-muted-foreground">{"}"}</div>
                  <div className="flex items-start gap-2 mt-4 text-green-500">
                    <span>✓</span>
                    <span>Task created: tsk_a8x2k9m</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 border-t border-border/40 bg-muted/10">
        <div className="container px-4 mx-auto max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureItem
              icon={Bot}
              title="24+ MCP Tools"
              description="Full suite of tools for tasks, time blocks, subtasks, and user management."
            />
            <FeatureItem
              icon={Key}
              title="Granular Scopes"
              description="Control exactly what AI agents can access with fine-grained API key permissions."
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
              <h3 className="text-[15px] font-semibold mb-2">API Key Scopes</h3>
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
              <h3 className="text-[15px] font-semibold mb-2">Zero-Install Setup</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Configure MCP in Claude Desktop or Cursor with just your API key. 
                No npm install required - the MCP server runs on our infrastructure.
              </p>
            </div>
          </div>
        </div>
      </section>
    </FeatureLayout>
  );
}
