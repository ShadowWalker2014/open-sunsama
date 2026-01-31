import { FeatureLayout } from "@/components/layout/feature-layout";
import { Timer, FileText, BarChart3, ArrowRight } from "lucide-react";
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

export default function FocusModeFeaturePage() {
  useSEO(SEO_CONFIGS.features.focusMode);

  return (
    <FeatureLayout
      badge="Feature"
      title="Focus Mode"
      subtitle="Work on one task at a time with built-in timer, rich notes, and progress tracking."
    >
      {/* Visual Demo */}
      <section className="pb-12">
        <div className="container px-4 mx-auto max-w-4xl">
          <div className="rounded-xl border border-border/40 bg-card/50 p-1 shadow-lg">
            <div className="rounded-lg border border-border/40 bg-background overflow-hidden">
              {/* Mock focus mode */}
              <div className="p-6 md:p-8 text-center">
                <div className="mb-4">
                  <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                    P0
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Design System Audit</h3>
                <p className="text-xs text-muted-foreground mb-6">Est: 1h 30m</p>
                
                {/* Timer */}
                <div className="mb-6">
                  <div className="text-4xl font-mono font-semibold tracking-wider">
                    00:45:23
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Time elapsed</p>
                </div>

                {/* Progress */}
                <div className="max-w-xs mx-auto mb-6">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>50%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-1/2 bg-primary rounded-full" />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-center gap-2">
                  <div className="px-4 py-2 rounded-lg bg-muted text-xs font-medium">Pause</div>
                  <div className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium">Complete</div>
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
              icon={Timer}
              title="Timestamp Timer"
              description="Precise timing using timestamp-based tracking. Survives browser refreshes and device restarts."
            />
            <FeatureItem
              icon={FileText}
              title="Rich Notes"
              description="Tiptap-powered editor for formatting, lists, and attachments right in focus mode."
            />
            <FeatureItem
              icon={BarChart3}
              title="Time Tracking"
              description="Compare actual vs estimated time with visual cues when you're over budget."
            />
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="py-12 border-t border-border/40">
        <div className="container px-4 mx-auto max-w-3xl">
          <div className="space-y-8">
            <div>
              <h3 className="text-[15px] font-semibold mb-2">Actual vs Estimated</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Visual feedback shows amber when slightly over time, red when significantly over. 
                Helps you improve future estimates and understand where time goes.
              </p>
            </div>
            <div>
              <h3 className="text-[15px] font-semibold mb-2">Focus Features</h3>
              <ul className="space-y-2">
                {[
                  "Next Up queue for seamless task flow",
                  "Pomodoro intervals with customizable breaks",
                  "Distraction-free full-screen mode",
                  "Keyboard shortcuts for all actions"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ArrowRight className="h-3 w-3 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-[15px] font-semibold mb-2">Daily Shutdown</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                End your day with a summary of completed tasks, total focus time, 
                and tasks rolling over to tomorrow.
              </p>
            </div>
          </div>
        </div>
      </section>
    </FeatureLayout>
  );
}
