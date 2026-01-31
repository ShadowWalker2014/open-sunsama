import { FeatureLayout } from "@/components/layout/feature-layout";
import { 
  Layout, 
  MousePointer2, 
  Layers, 
  Zap, 
  CheckSquare, 
  BarChart3,
  Clock,
  ArrowRight
} from "lucide-react";
import { BorderBeam } from "@/components/landing/border-beam";
import { cn } from "@/lib/utils";

export default function KanbanFeaturePage() {
  return (
    <FeatureLayout
      badge="Feature: Kanban"
      title="The ultimate board for daily planning"
      subtitle="Organize your day with a high-performance, minimalist Kanban board. Designed for speed, precision, and clarity."
    >
      {/* Visual Demo */}
      <section className="pb-32">
        <div className="container px-6 mx-auto max-w-6xl">
          <div className="relative glass p-4 rounded-[48px] border-2 shadow-3xl overflow-hidden animate-fade-up animate-delay-300">
             <div className="bg-background/80 rounded-[36px] overflow-hidden border shadow-inner aspect-[16/9] flex items-center justify-center relative">
                {/* Simulated Kanban UI */}
                <div className="flex gap-6 p-8 w-full h-full overflow-hidden">
                   {[
                     { day: "Monday", tasks: [
                       { title: "Review product specs", p: "P1", t: "30m" },
                       { title: "Design system audit", p: "P0", t: "1h", active: true },
                       { title: "Weekly sync", p: "P2", t: "45m" }
                     ]},
                     { day: "Tuesday", tasks: [
                       { title: "API Documentation", p: "P1", t: "2h" },
                       { title: "Bug triage", p: "P3", t: "15m" }
                     ]},
                     { day: "Wednesday", tasks: [
                        { title: "Frontend refactor", p: "P0", t: "4h" }
                     ]}
                   ].map((col, i) => (
                     <div key={i} className="flex-1 min-w-[280px] flex flex-col gap-4">
                        <div className="flex justify-between items-center px-2">
                           <span className="font-bold font-display">{col.day}</span>
                           <span className="text-xs font-jetbrains text-muted-foreground uppercase tracking-widest">3 Tasks</span>
                        </div>
                        <div className="flex-1 flex flex-col gap-3">
                           {col.tasks.map((task, j) => (
                             <div key={j} className={cn(
                               "glass-subtle p-4 rounded-2xl border flex flex-col gap-3 transition-all",
                               task.active ? "border-primary shadow-lg shadow-primary/10 -rotate-1" : "opacity-80"
                             )}>
                                <div className="flex justify-between items-start">
                                   <div className={cn(
                                     "px-2 py-0.5 rounded text-[10px] font-bold",
                                     task.p === "P0" ? "bg-red-500/20 text-red-500" : 
                                     task.p === "P1" ? "bg-orange-500/20 text-orange-500" : "bg-blue-500/20 text-blue-500"
                                   )}>{task.p}</div>
                                   <span className="text-[10px] font-jetbrains opacity-50">{task.t}</span>
                                </div>
                                <div className="font-medium text-sm leading-tight">{task.title}</div>
                             </div>
                           ))}
                           <div className="p-3 rounded-2xl border border-dashed border-muted-foreground/30 flex items-center justify-center text-xs text-muted-foreground hover:bg-muted/30 cursor-pointer">
                              + Add task
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
                {/* Drag handle overlay simulation */}
                <div className="absolute top-1/2 left-1/3 h-24 w-64 glass border-2 border-primary shadow-2xl rounded-2xl p-4 flex flex-col gap-2 z-20 rotate-3">
                   <div className="flex justify-between items-center">
                      <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary uppercase tracking-widest">Moving Task</div>
                      <MousePointer2 className="h-4 w-4 text-primary fill-primary" />
                   </div>
                   <div className="font-bold text-sm">Design system audit</div>
                </div>
             </div>
             <BorderBeam size={600} duration={12} className="opacity-40" />
          </div>
        </div>
      </section>

      {/* Tech Breakdown */}
      <section className="py-32 bg-card/10 border-y relative">
         <div className="container px-6 mx-auto max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
               <div className="space-y-6">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                     <Layers className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold font-display">Infinite Horizontal Scroll</h3>
                  <p className="text-muted-foreground leading-relaxed">
                     Built with <span className="text-foreground font-medium">@tanstack/react-virtual</span>, the Kanban board 
                     allows you to scroll infinitely through past and future days without 
                     any performance drop.
                  </p>
               </div>
               <div className="space-y-6">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                     <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold font-display">Optimistic Reordering</h3>
                  <p className="text-muted-foreground leading-relaxed">
                     Powered by <span className="text-foreground font-medium">@dnd-kit</span> and TanStack Query, 
                     every move is reflected instantly in the UI using optimistic state management, 
                     ensuring zero-latency interaction.
                  </p>
               </div>
               <div className="space-y-6">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                     <CheckSquare className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold font-display">Priority & Position</h3>
                  <p className="text-muted-foreground leading-relaxed">
                     Tasks use a sophisticated position-based sorting engine. Track priorities 
                     from <span className="text-foreground font-medium">P0 to P3</span> and 
                     automatically sort your day based on what matters most.
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
                     <div className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 font-jetbrains text-xs tracking-widest uppercase inline-block">
                        Precision
                     </div>
                     <h2 className="text-4xl md:text-5xl font-bold font-display tracking-tight">Smart Collision Strategy</h2>
                     <p className="text-lg text-muted-foreground leading-relaxed">
                        Our custom D&D engine uses a hybrid collision strategy. It prioritizes 
                        precise item-level reordering (`closestCenter`) while falling back 
                        to column-level detection for intuitive moves across different days.
                     </p>
                     <ul className="space-y-4">
                        {[
                          "Pointer, Keyboard, and Touch sensors supported",
                          "200ms delay for safe mobile dragging",
                          "Visual drop indicators for exact placement"
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
                     <div className="aspect-[4/3] rounded-3xl bg-background border flex flex-col">
                        <div className="p-4 border-b bg-muted/20 flex justify-between">
                           <div className="h-3 w-24 bg-muted rounded-full" />
                           <div className="flex gap-2">
                              <div className="h-3 w-3 rounded-full bg-muted" />
                              <div className="h-3 w-3 rounded-full bg-muted" />
                           </div>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                           <div className="h-16 w-full bg-primary/5 border border-primary/20 border-dashed rounded-2xl animate-pulse" />
                           <div className="h-24 w-full bg-card border rounded-2xl shadow-lg border-primary translate-y-2 rotate-1" />
                           <div className="h-16 w-full bg-card border rounded-2xl opacity-50" />
                        </div>
                     </div>
                  </div>
               </div>

               {/* Detail 2 */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center lg:flex-row-reverse">
                  <div className="order-first lg:order-last space-y-8">
                     <div className="px-3 py-1 rounded-full bg-primary/10 text-primary font-jetbrains text-xs tracking-widest uppercase inline-block">
                        Insights
                     </div>
                     <h2 className="text-4xl md:text-5xl font-bold font-display tracking-tight">Daily Volume Metrics</h2>
                     <p className="text-lg text-muted-foreground leading-relaxed">
                        Every day header calculates your total estimated workload. See exactly 
                        how much time you've committed to and adjust your plan before 
                        you get overwhelmed.
                     </p>
                     <div className="grid grid-cols-2 gap-6">
                        <div className="glass p-6 rounded-3xl border">
                           <div className="text-sm font-jetbrains text-muted-foreground uppercase mb-2">Total Time</div>
                           <div className="text-3xl font-bold font-display">6h 15m</div>
                        </div>
                        <div className="glass p-6 rounded-3xl border">
                           <div className="text-sm font-jetbrains text-muted-foreground uppercase mb-2">Completion</div>
                           <div className="text-3xl font-bold font-display">82%</div>
                        </div>
                     </div>
                  </div>
                  <div className="glass p-8 rounded-[40px] border shadow-2xl bg-muted/10 relative overflow-hidden">
                     <div className="aspect-[4/3] rounded-3xl bg-background border p-8 flex flex-col gap-6">
                        <div className="flex justify-between items-end">
                           <div className="space-y-2">
                              <div className="text-2xl font-bold">Wednesday</div>
                              <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
                                 <div className="h-full w-[82%] bg-primary" />
                              </div>
                           </div>
                           <div className="text-right">
                              <div className="text-sm text-muted-foreground">Estimated</div>
                              <div className="font-bold text-xl">5h 45m</div>
                           </div>
                        </div>
                        <div className="flex-1 flex flex-col gap-3 opacity-40">
                           <div className="h-16 w-full bg-card border rounded-2xl" />
                           <div className="h-16 w-full bg-card border rounded-2xl" />
                           <div className="h-16 w-full bg-card border rounded-2xl" />
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>
    </FeatureLayout>
  );
}
