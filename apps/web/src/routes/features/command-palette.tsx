import { FeatureLayout } from "@/components/layout/feature-layout";
import { FeatureShot } from "@/components/landing/product-shot";
import { Command, Search, Keyboard, ArrowRight } from "lucide-react";
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

export default function CommandPaletteFeaturePage() {
  useSEO(SEO_CONFIGS.features.commandPalette);

  return (
    <FeatureLayout
      visual={<FeatureShot name="command-palette" alt="Command palette searching across tasks and ideas" />}
      badge="Feature"
      title="Command Palette"
      subtitle="Access everything with ⌘K. Search tasks, run commands, and navigate your workflow instantly."
    >
      {/* Features */}
      <section className="py-12 border-t border-border/40 bg-muted/10">
        <div className="container px-4 mx-auto max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureItem
              icon={Search}
              title="Task Search"
              description="Instantly find any task by title. Fuzzy matching with 100+ result support."
            />
            <FeatureItem
              icon={Command}
              title="Quick Commands"
              description="Add tasks, switch themes, navigate views - all without leaving your keyboard."
            />
            <FeatureItem
              icon={Keyboard}
              title="Context Actions"
              description="Task-specific commands appear when hovering. Complete, defer, or delete in one keystroke."
            />
          </div>
        </div>
      </section>

      {/* Available Commands */}
      <section className="py-12 border-t border-border/40">
        <div className="container px-4 mx-auto max-w-3xl">
          <h3 className="text-[15px] font-semibold mb-6 text-center">Available Commands</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">General</h4>
              <div className="space-y-2">
                {[
                  { key: "A", label: "Add new task" },
                  { key: "?", label: "Show keyboard shortcuts" },
                  { key: "⌘K", label: "Open command palette" },
                ].map((cmd, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{cmd.label}</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">{cmd.key}</kbd>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Navigation</h4>
              <div className="space-y-2">
                {[
                  { label: "Go to Tasks (Kanban)" },
                  { label: "Go to Calendar" },
                  { label: "Go to Settings" },
                  { label: "Switch theme (Light/Dark)" },
                ].map((cmd, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ArrowRight className="h-3 w-3 text-primary" />
                    {cmd.label}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Task Actions (on hover)</h4>
              <div className="space-y-2">
                {[
                  { key: "C", label: "Complete task" },
                  { key: "Z", label: "Move to backlog" },
                  { key: "⇧Z", label: "Defer to next week" },
                  { key: "X", label: "Add to calendar" },
                ].map((cmd, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{cmd.label}</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">{cmd.key}</kbd>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">More Task Actions</h4>
              <div className="space-y-2">
                {[
                  { key: "⌘D", label: "Duplicate task" },
                  { key: "⌘⌫", label: "Delete task" },
                  { key: "F", label: "Enter focus mode" },
                  { key: "E", label: "Edit time estimate" },
                ].map((cmd, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{cmd.label}</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">{cmd.key}</kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </FeatureLayout>
  );
}
