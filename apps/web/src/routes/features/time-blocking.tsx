import { FeatureLayout } from "@/components/layout/feature-layout";
import { Clock, Calendar, RefreshCw, ArrowRight } from "lucide-react";

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

export default function TimeBlockingFeaturePage() {
  return (
    <FeatureLayout
      badge="Feature"
      title="Time Blocking"
      subtitle="Drag tasks onto your timeline to create focused work sessions and a realistic daily plan."
    >
      {/* Visual Demo */}
      <section className="pb-12">
        <div className="container px-4 mx-auto max-w-4xl">
          <div className="rounded-xl border border-border/40 bg-card/50 p-1 shadow-lg">
            <div className="rounded-lg border border-border/40 bg-background overflow-hidden">
              {/* Mock timeline */}
              <div className="p-4 md:p-6">
                <div className="flex gap-4">
                  {/* Time labels */}
                  <div className="w-12 shrink-0 space-y-6 text-[10px] text-muted-foreground">
                    <div>9:00</div>
                    <div>10:00</div>
                    <div>11:00</div>
                    <div>12:00</div>
                  </div>
                  {/* Timeline */}
                  <div className="flex-1 space-y-2 relative">
                    <div className="h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 p-2 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span className="text-xs font-medium">Morning standup</span>
                    </div>
                    <div className="h-20 rounded-lg bg-primary/10 border border-primary/30 p-2 flex flex-col justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-xs font-medium">Deep work: API Design</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">1h 30m</span>
                    </div>
                    <div className="h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 p-2 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-orange-500" />
                      <span className="text-xs font-medium">Lunch</span>
                    </div>
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
              icon={Clock}
              title="Cascade Resize"
              description="Drag block edges to resize. Subsequent blocks automatically adjust to maintain your schedule."
            />
            <FeatureItem
              icon={Calendar}
              title="Calendar Sync"
              description="Bidirectional sync with Google, Outlook, and iCloud calendars via OAuth and CalDAV."
            />
            <FeatureItem
              icon={RefreshCw}
              title="Snap to Grid"
              description="5-minute precision snapping for exact time management and clean alignment."
            />
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="py-12 border-t border-border/40">
        <div className="container px-4 mx-auto max-w-3xl">
          <div className="space-y-8">
            <div>
              <h3 className="text-[15px] font-semibold mb-2">Bidirectional Calendar Sync</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Changes sync both ways - edit in Open Sunsama or your calendar app and 
                see updates reflected immediately. Supports Google Calendar, Microsoft Outlook, 
                and Apple iCloud.
              </p>
            </div>
            <div>
              <h3 className="text-[15px] font-semibold mb-2">Time Block Features</h3>
              <ul className="space-y-2">
                {[
                  "Link any task to a time block",
                  "Visual color coding for different categories",
                  "Unscheduled sidebar for quick drag-and-drop",
                  "Conflict detection and resolution"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ArrowRight className="h-3 w-3 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-[15px] font-semibold mb-2">Keyboard Navigation</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Full keyboard support for creating, moving, and resizing blocks. 
                Use arrow keys to navigate and Enter to confirm.
              </p>
            </div>
          </div>
        </div>
      </section>
    </FeatureLayout>
  );
}
