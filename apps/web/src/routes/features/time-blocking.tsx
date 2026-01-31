import { FeatureLayout } from "@/components/layout/feature-layout";
import { 
  CalendarDays, 
  Clock, 
  RefreshCw, 
  ArrowDownCircle, 
  Link2,
  Calendar,
  Zap,
  ArrowRight
} from "lucide-react";
import { BorderBeam } from "@/components/landing/border-beam";
import { cn } from "@/lib/utils";

export default function TimeBlockingFeaturePage() {
  return (
    <FeatureLayout
      badge="Feature: Time Blocking"
      title="Turn your tasks into a realistic schedule"
      subtitle="The most effective way to manage your time. Commit to your tasks by dragging them onto your calendar timeline."
    >
      {/* Visual Demo */}
      <section className="pb-32">
        <div className="container px-6 mx-auto max-w-6xl">
          <div className="relative glass p-4 rounded-[48px] border-2 shadow-3xl overflow-hidden animate-fade-up animate-delay-300">
             <div className="bg-background/80 rounded-[36px] overflow-hidden border shadow-inner aspect-[16/9] flex relative">
                {/* Simulated Timeline UI */}
                <div className="w-20 border-r border-border flex flex-col pt-8 bg-muted/20">
                   {[9, 10, 11, 12, 1, 2, 3].map((h, i) => (
                     <div key={i} className="h-24 text-[10px] font-jetbrains text-muted-foreground flex justify-center">{h} AM</div>
                   ))}
                </div>
                <div className="flex-1 p-8 relative overflow-hidden">
                   {/* Grid lines */}
                   <div className="absolute inset-0 flex flex-col">
                      {[1, 2, 3, 4, 5, 6, 7].map((_, i) => (
                        <div key={i} className="h-24 border-b border-border/50" />
                      ))}
                   </div>
                   {/* Time Blocks */}
                   <div className="relative h-full">
                      <div className="absolute top-[10%] left-0 right-12 glass border-l-4 border-l-blue-500 rounded-xl p-4 h-32 flex flex-col gap-1 opacity-40">
                         <div className="text-[10px] font-bold text-blue-500 flex items-center gap-1">
                            <Calendar className="h-2.5 w-2.5" />
                            EXTERNAL SYNC
                         </div>
                         <div className="font-bold text-sm">Product Strategy Meeting</div>
                         <div className="text-[10px] opacity-50 font-jetbrains">9:00 AM - 10:30 AM</div>
                      </div>

                      <div className="absolute top-[40%] left-0 right-12 glass border-l-4 border-l-primary rounded-xl p-4 h-48 flex flex-col gap-1 shadow-2xl scale-105 z-10 border-2 border-primary/20">
                         <div className="text-[10px] font-bold text-primary flex items-center gap-1">
                            <Zap className="h-2.5 w-2.5" />
                            DEEP WORK
                         </div>
                         <div className="font-bold text-sm">Core API Implementation</div>
                         <div className="text-[10px] opacity-50 font-jetbrains">11:00 AM - 1:00 PM</div>
                         {/* Resize handle */}
                         <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary/40 rounded-full" />
                      </div>

                      <div className="absolute top-[75%] left-0 right-12 glass border-l-4 border-l-muted-foreground/30 rounded-xl p-4 h-24 flex flex-col gap-1 opacity-60">
                         <div className="font-bold text-sm">Review PRs</div>
                         <div className="text-[10px] opacity-50 font-jetbrains">1:30 PM - 2:30 PM</div>
                      </div>
                   </div>
                </div>
                {/* Floating Task being dragged */}
                <div className="absolute right-12 top-24 w-64 glass p-4 rounded-2xl border-2 border-primary/40 shadow-2xl rotate-2 animate-float">
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-primary uppercase">Scheduling</span>
                      <MousePointer2 className="h-4 w-4 text-primary fill-primary" />
                   </div>
                   <div className="font-bold text-sm text-balance">Update documentation for v1.0 release</div>
                </div>
             </div>
             <BorderBeam size={600} duration={12} className="opacity-40" />
          </div>
        </div>
      </section>

      {/* Feature Breakdown */}
      <section className="py-32 bg-card/10 border-y relative">
         <div className="container px-6 mx-auto max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
               <div className="space-y-6">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                     <ArrowDownCircle className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold font-display">Cascade Resizing</h3>
                  <p className="text-muted-foreground leading-relaxed">
                     When a block is extended, the specialized <span className="text-foreground font-medium">cascade logic</span> automatically 
                     shifts subsequent overlapping blocks down the schedule, preserving your 
                     carefully planned flow.
                  </p>
               </div>
               <div className="space-y-6">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                     <Link2 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold font-display">Deep Calendar Sync</h3>
                  <p className="text-muted-foreground leading-relaxed">
                     Bidirectional sync with <span className="text-foreground font-medium">Google Calendar</span>, 
                     <span className="text-foreground font-medium">Outlook</span>, and <span className="text-foreground font-medium">iCloud</span>. 
                     See your meetings and tasks in one unified view.
                  </p>
               </div>
               <div className="space-y-6">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                     <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold font-display">Snap-to-Grid Precision</h3>
                  <p className="text-muted-foreground leading-relaxed">
                     All scheduling movements are snapped to 15-minute intervals, helping you 
                     create a precise and readable daily plan with zero effort.
                  </p>
               </div>
            </div>
         </div>
      </section>

      {/* Detailed Features */}
      <section className="py-32">
         <div className="container px-6 mx-auto max-w-7xl">
            <div className="flex flex-col gap-24">
               {/* Detail 1 */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div className="space-y-8">
                     <div className="px-3 py-1 rounded-full bg-primary/10 text-primary font-jetbrains text-xs tracking-widest uppercase inline-block">
                        Integration
                     </div>
                     <h2 className="text-4xl md:text-5xl font-bold font-display tracking-tight">The "Unscheduled" Workflow</h2>
                     <p className="text-lg text-muted-foreground leading-relaxed">
                        Keep your task backlog separate from your schedule. When you're ready 
                        to work, simply drag a task from the sidebar onto the timeline to 
                        commit to a specific time slot.
                     </p>
                     <ul className="space-y-4">
                        {[
                          "Filter unscheduled tasks by priority or category",
                          "Auto-hide tasks once they are scheduled",
                          "Quick-schedule into next available free slot"
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-3">
                             <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <ArrowRight className="h-3 w-3 text-primary" />
                             </div>
                             <span className="font-medium">{item}</span>
                          </li>
                        ))}
                     </ul>
                  </div>
                  <div className="glass p-8 rounded-[40px] border shadow-2xl bg-muted/10 relative overflow-hidden">
                     <div className="aspect-[4/3] rounded-3xl bg-background border flex overflow-hidden">
                        <div className="w-1/3 border-r bg-muted/20 p-4 space-y-4">
                           <div className="h-4 w-20 bg-muted rounded-full" />
                           <div className="h-12 w-full bg-card border rounded-xl" />
                           <div className="h-12 w-full bg-card border rounded-xl border-primary shadow-lg scale-105 translate-x-2" />
                           <div className="h-12 w-full bg-card border rounded-xl" />
                        </div>
                        <div className="flex-1 p-4 space-y-4 relative">
                           <div className="absolute top-20 left-4 right-4 h-24 glass border-2 border-dashed border-primary/30 rounded-2xl flex items-center justify-center">
                              <span className="text-[10px] font-jetbrains text-primary font-bold">DROP HERE</span>
                           </div>
                           <div className="h-4 w-12 bg-muted rounded-full ml-auto" />
                        </div>
                     </div>
                  </div>
               </div>

               {/* Detail 2 */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center lg:flex-row-reverse">
                  <div className="order-first lg:order-last space-y-8">
                     <div className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 font-jetbrains text-xs tracking-widest uppercase inline-block">
                        Dynamic
                     </div>
                     <h2 className="text-4xl md:text-5xl font-bold font-display tracking-tight">Adaptive Scheduling</h2>
                     <p className="text-lg text-muted-foreground leading-relaxed">
                        Plans change. That's why our timeline is designed for flexibility. 
                        Resize, move, or defer time blocks instantly with real-time 
                        conflict detection and schedule adjustment.
                     </p>
                     <div className="space-y-4">
                        <div className="glass p-6 rounded-3xl border flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500">
                                 <RefreshCw className="h-5 w-5" />
                              </div>
                              <span className="font-bold">Auto-Reschedule</span>
                           </div>
                           <span className="text-xs font-jetbrains text-muted-foreground">Enabled</span>
                        </div>
                        <div className="glass p-6 rounded-3xl border flex items-center justify-between opacity-60">
                           <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
                                 <CalendarDays className="h-5 w-5" />
                              </div>
                              <span className="font-bold">Sync Frequency</span>
                           </div>
                           <span className="text-xs font-jetbrains text-muted-foreground">Real-time</span>
                        </div>
                     </div>
                  </div>
                  <div className="glass p-8 rounded-[40px] border shadow-2xl bg-muted/10 relative overflow-hidden">
                     <div className="aspect-[4/3] rounded-3xl bg-background border p-8 flex flex-col gap-6 relative">
                        {/* Conflict illustration */}
                        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-48 h-12 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center z-20 backdrop-blur-sm animate-pulse">
                           <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Overlap Detected</span>
                        </div>
                        <div className="h-16 w-full bg-blue-500/10 border-l-4 border-l-blue-500 rounded-xl" />
                        <div className="h-32 w-full bg-primary/10 border-l-4 border-l-primary rounded-xl translate-y-[-8px] z-10" />
                        <div className="h-16 w-full bg-muted/30 border-l-4 border-l-muted-foreground/30 rounded-xl" />
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>
    </FeatureLayout>
  );
}
