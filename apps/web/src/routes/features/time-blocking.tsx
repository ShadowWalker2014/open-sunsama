import { FeatureLayout } from "@/components/layout/feature-layout";
import { FeatureShot } from "@/components/landing/product-shot";
import { Clock, Calendar, RefreshCw, ArrowRight } from "lucide-react";
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

export default function TimeBlockingFeaturePage() {
  useSEO(SEO_CONFIGS.features.timeBlocking);

  return (
    <FeatureLayout
      visual={<FeatureShot name="calendar-week" alt="Week calendar full of color-coded time blocks linked to tasks" />}
      badge="Feature"
      title="Time Blocking"
      subtitle="Drag tasks onto your timeline to create focused work sessions and a realistic daily plan."
    >
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
