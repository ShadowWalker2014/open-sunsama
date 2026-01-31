import { FeatureLayout } from "@/components/layout/feature-layout";
import { Calendar, RefreshCw, Shield } from "lucide-react";

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

export default function CalendarSyncFeaturePage() {
  return (
    <FeatureLayout
      badge="Feature"
      title="Calendar Sync"
      subtitle="Bidirectional sync with Google Calendar, Outlook, and iCloud. Your events and time blocks stay in perfect harmony."
    >
      {/* Visual Demo */}
      <section className="pb-12">
        <div className="container px-4 mx-auto max-w-4xl">
          <div className="rounded-xl border border-border/40 bg-card/50 p-1 shadow-lg">
            <div className="rounded-lg border border-border/40 bg-background overflow-hidden">
              {/* Mock calendar providers */}
              <div className="p-4 md:p-6">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { name: "Google", color: "bg-red-500", connected: true },
                    { name: "Outlook", color: "bg-blue-500", connected: true },
                    { name: "iCloud", color: "bg-slate-500", connected: false },
                  ].map((provider, i) => (
                    <div key={i} className="rounded-lg border border-border/40 bg-card/50 p-4 text-center">
                      <div className={`h-10 w-10 ${provider.color} rounded-lg mx-auto mb-3 flex items-center justify-center`}>
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-xs font-medium">{provider.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {provider.connected ? (
                          <span className="text-green-500">● Connected</span>
                        ) : (
                          <span>Not connected</span>
                        )}
                      </p>
                    </div>
                  ))}
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
              icon={RefreshCw}
              title="Bidirectional Sync"
              description="Changes sync both ways. Edit in Open Sunsama or your calendar app - updates reflect everywhere."
            />
            <FeatureItem
              icon={Calendar}
              title="Multiple Calendars"
              description="Connect multiple accounts and choose which calendars to sync. Full control over what appears."
            />
            <FeatureItem
              icon={Shield}
              title="Secure Authentication"
              description="OAuth 2.0 for Google and Outlook. App-specific passwords for iCloud. Tokens encrypted at rest."
            />
          </div>
        </div>
      </section>

      {/* Supported Providers */}
      <section className="py-12 border-t border-border/40">
        <div className="container px-4 mx-auto max-w-3xl">
          <h3 className="text-[15px] font-semibold mb-6 text-center">Supported Providers</h3>
          
          <div className="space-y-6">
            <div className="rounded-lg border border-border/40 bg-card/50 p-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-red-500 flex items-center justify-center shrink-0">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="text-[13px] font-semibold">Google Calendar</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    OAuth 2.0 authentication via Google accounts. Full read/write access to events 
                    using Google Calendar API v3.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg border border-border/40 bg-card/50 p-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="text-[13px] font-semibold">Microsoft Outlook</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    OAuth 2.0 authentication via Microsoft accounts. Syncs events through 
                    Microsoft Graph API.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg border border-border/40 bg-card/50 p-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-slate-500 flex items-center justify-center shrink-0">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="text-[13px] font-semibold">Apple iCloud</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    CalDAV protocol via app-specific password. Works with iCloud calendars 
                    using the tsdav library.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 border-t border-border/40">
        <div className="container px-4 mx-auto max-w-3xl">
          <h3 className="text-[15px] font-semibold mb-6">How It Works</h3>
          <div className="space-y-4">
            {[
              "Connect your calendar account in Settings",
              "Choose which calendars to sync",
              "Events automatically appear in your timeline",
              "Create time blocks that sync back to your calendar",
              "Updates flow both ways in real-time"
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-semibold text-primary">{i + 1}</span>
                </div>
                <p className="text-sm text-muted-foreground">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </FeatureLayout>
  );
}
