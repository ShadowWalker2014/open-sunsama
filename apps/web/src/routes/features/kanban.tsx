import { FeatureLayout } from "@/components/layout/feature-layout";
import { Layers, Zap, CheckSquare, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function KanbanFeaturePage() {
  return (
    <FeatureLayout
      badge="Feature"
      title="Visual Kanban Board"
      subtitle="Organize your day with a high-performance, minimalist Kanban board designed for speed and clarity."
    >
      {/* Visual Demo */}
      <section className="pb-12">
        <div className="container px-4 mx-auto max-w-4xl">
          <div className="rounded-xl border border-border/40 bg-card/50 p-1 shadow-lg">
            <div className="rounded-lg border border-border/40 bg-background overflow-hidden">
              {/* Mock kanban */}
              <div className="p-4 md:p-6 flex gap-4 overflow-x-auto">
                {[
                  { day: "Mon", tasks: [
                    { title: "Review specs", p: "P1" },
                    { title: "Design audit", p: "P0", active: true },
                    { title: "Team sync", p: "P2" }
                  ]},
                  { day: "Tue", tasks: [
                    { title: "API docs", p: "P1" },
                    { title: "Bug fixes", p: "P3" }
                  ]},
                  { day: "Wed", tasks: [
                    { title: "Refactor", p: "P0" }
                  ]}
                ].map((col, i) => (
                  <div key={i} className="flex-shrink-0 w-48 space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-xs font-semibold">{col.day}</span>
                      <span className="text-[10px] text-muted-foreground">{col.tasks.length}</span>
                    </div>
                    <div className="space-y-2">
                      {col.tasks.map((task, j) => (
                        <div key={j} className={cn(
                          "p-3 rounded-lg border bg-card/50 space-y-2",
                          task.active && "border-primary/30 shadow-sm"
                        )}>
                          <span className={cn(
                            "text-[10px] font-medium px-1.5 py-0.5 rounded",
                            task.p === "P0" ? "bg-red-500/10 text-red-500" :
                            task.p === "P1" ? "bg-orange-500/10 text-orange-500" :
                            task.p === "P2" ? "bg-blue-500/10 text-blue-500" :
                            "bg-slate-500/10 text-slate-500"
                          )}>{task.p}</span>
                          <p className="text-xs font-medium">{task.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
              icon={Layers}
              title="Infinite Scroll"
              description="Built with @tanstack/react-virtual for seamless scrolling through past and future days."
            />
            <FeatureItem
              icon={Zap}
              title="Optimistic Updates"
              description="Powered by @dnd-kit with instant UI feedback using TanStack Query."
            />
            <FeatureItem
              icon={CheckSquare}
              title="Priority System"
              description="Track priorities from P0 to P3 and sort your day based on what matters."
            />
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="py-12 border-t border-border/40">
        <div className="container px-4 mx-auto max-w-3xl">
          <div className="space-y-8">
            <div>
              <h3 className="text-[15px] font-semibold mb-2">Smart Collision Detection</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Custom D&D engine using hybrid collision strategy - precise item-level reordering 
                with closestCenter and column-level detection for moves across days.
              </p>
            </div>
            <div>
              <h3 className="text-[15px] font-semibold mb-2">Multi-Input Support</h3>
              <ul className="space-y-2">
                {[
                  "Pointer, keyboard, and touch sensors",
                  "200ms delay for safe mobile dragging",
                  "Visual drop indicators for exact placement"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ArrowRight className="h-3 w-3 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-[15px] font-semibold mb-2">Daily Metrics</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every day header shows total estimated workload. See how much time you've 
                committed and adjust before getting overwhelmed.
              </p>
            </div>
          </div>
        </div>
      </section>
    </FeatureLayout>
  );
}
