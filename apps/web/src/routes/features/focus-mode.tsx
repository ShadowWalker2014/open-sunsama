import { FeatureLayout } from "@/components/layout/feature-layout";
import { 
  Zap, 
  Timer, 
  FileText, 
  BarChart3, 
  CheckCircle2, 
  ChevronRight,
  ArrowRight,
  Clock,
  Layout
} from "lucide-react";
import { BorderBeam } from "@/components/landing/border-beam";
import { cn } from "@/lib/utils";

export default function FocusModeFeaturePage() {
  return (
    <FeatureLayout
      badge="Feature: Focus Mode"
      title="Eliminate distractions, achieve deep work"
      subtitle="A dedicated, minimalist environment for your most important tasks. Track time with precision and keep your notes right where you need them."
    >
      {/* Visual Demo */}
      <section className="pb-32">
        <div className="container px-6 mx-auto max-w-6xl">
          <div className="relative glass p-4 rounded-[48px] border-2 shadow-3xl overflow-hidden animate-fade-up animate-delay-300">
             <div className="bg-background/80 rounded-[36px] overflow-hidden border shadow-inner aspect-[16/9] flex flex-col items-center justify-center relative p-12">
                {/* Simulated Focus Mode UI */}
                <div className="max-w-2xl w-full space-y-12 animate-float">
                   <div className="flex flex-col items-center text-center gap-6">
                      <div className="flex items-center gap-3">
                         <div className="px-3 py-1 rounded-full bg-primary/10 text-primary font-jetbrains text-[10px] font-bold uppercase tracking-[0.2em]">Focus Session</div>
                         <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      </div>
                      <h2 className="text-4xl font-bold font-display tracking-tight text-balance">Architecting the Real-time Sync Engine</h2>
                      {/* Timer Display */}
                      <div className="flex items-center gap-4 text-7xl font-bold font-display tracking-tighter">
                         <span>00</span>
                         <span className="opacity-20">:</span>
                         <span>42</span>
                         <span className="opacity-20">:</span>
                         <span>18</span>
                      </div>
                   </div>

                   <div className="glass p-8 rounded-[32px] border-2 border-primary/20 space-y-6 bg-background/40">
                      <div className="flex items-center justify-between border-b pb-4">
                         <div className="flex items-center gap-3 text-sm font-medium">
                            <FileText className="h-4 w-4 text-primary" />
                            <span>Implementation Notes</span>
                         </div>
                         <div className="text-[10px] font-jetbrains text-muted-foreground uppercase">Markdown Supported</div>
                      </div>
                      <div className="space-y-4">
                         <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <span className="font-medium">Define WebSocket message protocols</span>
                         </div>
                         <div className="flex items-center gap-3 opacity-50">
                            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                            <span>Implement conflict resolution logic</span>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Floating Timer Control */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4">
                   <div className="h-16 w-16 rounded-full bg-red-500/10 border-2 border-red-500/20 flex items-center justify-center text-red-500 cursor-pointer hover:bg-red-500/20 transition-all">
                      <div className="h-4 w-4 bg-red-500 rounded-sm" />
                   </div>
                   <div className="h-20 w-48 rounded-full bg-primary flex items-center justify-center gap-3 text-white font-bold text-lg shadow-xl shadow-primary/30 cursor-pointer hover:scale-105 active:scale-95 transition-all">
                      <CheckCircle2 className="h-6 w-6" />
                      <span>Complete</span>
                   </div>
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
                     <Timer className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold font-display">Timestamp-Based Accuracy</h3>
                  <p className="text-muted-foreground leading-relaxed">
                     Unlike standard interval timers that drift, our system uses <span className="text-foreground font-medium">startedAt timestamps</span> to 
                     ensure second-perfect tracking even if you close the tab or refresh.
                  </p>
               </div>
               <div className="space-y-6">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                     <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold font-display">Rich-Text Focus Notes</h3>
                  <p className="text-muted-foreground leading-relaxed">
                     Stay organized with a built-in <span className="text-foreground font-medium">Tiptap editor</span>. 
                     Format your thoughts, add checklists, and attach files without ever 
                     leaving your focused workspace.
                  </p>
               </div>
               <div className="space-y-6">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                     <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold font-display">Actual vs. Estimated</h3>
                  <p className="text-muted-foreground leading-relaxed">
                     Get real-time feedback on your pace. The timer turns <span className="text-foreground font-medium">Amber</span> or 
                     <span className="text-foreground font-medium">Red</span> as you approach or exceed 
                     your estimated time, building better planning awareness.
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
                        Workflow
                     </div>
                     <h2 className="text-4xl md:text-5xl font-bold font-display tracking-tight">The "Next Up" Momentum</h2>
                     <p className="text-lg text-muted-foreground leading-relaxed">
                        When you complete a task, Open Sunsama automatically moves you to the 
                        next item in your daily queue. No decision fatigue, no context switching—just 
                        pure momentum from one task to the next.
                     </p>
                     <div className="glass p-6 rounded-3xl border flex items-center gap-6 bg-primary/5">
                        <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white">
                           <CheckCircle2 className="h-7 w-7" />
                        </div>
                        <div className="flex-1">
                           <div className="text-sm font-jetbrains text-primary uppercase font-bold mb-1">Up Next</div>
                           <div className="font-bold">Finalize v1.0 Launch Assets</div>
                        </div>
                        <ChevronRight className="h-6 w-6 text-primary opacity-50" />
                     </div>
                  </div>
                  <div className="glass p-8 rounded-[40px] border shadow-2xl bg-muted/10 relative overflow-hidden">
                     <div className="aspect-[4/3] rounded-3xl bg-background border flex flex-col items-center justify-center p-12 gap-8 text-center">
                        <div className="space-y-4">
                           <div className="h-24 w-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                              <CheckCircle2 className="h-12 w-12 text-green-500" />
                           </div>
                           <h4 className="text-2xl font-bold">Task Completed</h4>
                        </div>
                        <div className="flex items-center gap-4 text-muted-foreground animate-pulse">
                           <span>Navigating to next task</span>
                           <div className="flex gap-1">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce delay-100" />
                              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce delay-200" />
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Detail 2 */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center lg:flex-row-reverse">
                  <div className="order-first lg:order-last space-y-8">
                     <div className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 font-jetbrains text-xs tracking-widest uppercase inline-block">
                        Reflection
                     </div>
                     <h2 className="text-4xl md:text-5xl font-bold font-display tracking-tight">The Daily Shutdown</h2>
                     <p className="text-lg text-muted-foreground leading-relaxed">
                        End your day with clarity. When your queue is empty, we present a 
                        comprehensive summary of your accomplishments, focus volume, 
                        and time distribution.
                     </p>
                     <ul className="space-y-4">
                        {[
                          "Total active focus time tracked",
                          "Number of tasks and subtasks completed",
                          "Focus quality score based on estimates",
                          "One-click return to the main board"
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-3">
                             <div className="h-6 w-6 rounded-full bg-orange-500/10 flex items-center justify-center">
                                <ArrowRight className="h-3 w-3 text-orange-500" />
                             </div>
                             <span className="font-medium">{item}</span>
                          </li>
                        ))}
                     </ul>
                  </div>
                  <div className="glass p-8 rounded-[40px] border shadow-2xl bg-muted/10 relative overflow-hidden">
                     <div className="aspect-[4/3] rounded-3xl bg-background border p-8 space-y-8">
                        <div className="flex justify-between items-center">
                           <div className="font-bold text-xl">Daily Summary</div>
                           <div className="px-3 py-1 rounded-full bg-muted text-[10px] font-jetbrains uppercase">Jan 30, 2026</div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                           {[
                             { label: "Tasks", val: "12", icon: Layout },
                             { label: "Hours", val: "7.5h", icon: Clock },
                             { label: "Deep", val: "92%", icon: Zap },
                           ].map((s, i) => (
                             <div key={i} className="glass p-4 rounded-2xl border text-center space-y-2">
                                <s.icon className="h-4 w-4 mx-auto text-primary opacity-50" />
                                <div className="text-2xl font-bold font-display">{s.val}</div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</div>
                             </div>
                           ))}
                        </div>
                        <div className="space-y-3">
                           <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                              <div className="h-full w-[40%] bg-blue-500" />
                              <div className="h-full w-[35%] bg-primary" />
                              <div className="h-full w-[25%] bg-orange-500" />
                           </div>
                           <div className="flex justify-between text-[10px] font-medium opacity-50">
                              <span>Development</span>
                              <span>Planning</span>
                              <span>Review</span>
                           </div>
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
