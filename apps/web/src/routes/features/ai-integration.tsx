import { FeatureLayout } from "@/components/layout/feature-layout";
import { 
  Bot, 
  Command, 
  Terminal, 
  ShieldCheck, 
  Cpu, 
  MessageSquare,
  Sparkles,
  ArrowRight,
  Zap,
  Code
} from "lucide-react";
import { BorderBeam } from "@/components/landing/border-beam";
import { cn } from "@/lib/utils";

export default function AIIntegrationFeaturePage() {
  return (
    <FeatureLayout
      badge="Feature: AI & MCP"
      title="The daily planner built for the AI era"
      subtitle="Seamlessly integrate your workspace with AI agents like Claude and Cursor. Open Sunsama is the first productivity tool built on the Model Context Protocol (MCP)."
    >
      {/* Visual Demo */}
      <section className="pb-32">
        <div className="container px-6 mx-auto max-w-6xl">
          <div className="relative glass p-4 rounded-[48px] border-2 shadow-3xl overflow-hidden animate-fade-up animate-delay-300">
             <div className="bg-background/80 rounded-[36px] overflow-hidden border shadow-inner aspect-[16/9] flex relative">
                {/* Left Side: AI Interface */}
                <div className="w-1/2 border-r bg-muted/20 p-8 space-y-6">
                   <div className="flex items-center gap-3 mb-8">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                         <Bot className="h-6 w-6" />
                      </div>
                      <div className="font-bold font-display text-lg">AI Assistant</div>
                   </div>
                   <div className="glass p-4 rounded-2xl border bg-background/50 space-y-3">
                      <p className="text-sm">"Can you look at my schedule for today and find a 2-hour block for deep work on the API design?"</p>
                   </div>
                   <div className="glass p-4 rounded-2xl border-2 border-primary/30 bg-primary/5 space-y-4 animate-pulse">
                      <div className="flex items-center gap-2">
                         <div className="h-2 w-2 rounded-full bg-primary" />
                         <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Calling MCP Tool</span>
                      </div>
                      <div className="font-jetbrains text-[12px] opacity-80">
                         list_time_blocks({"{ date: '2026-01-30' }"})
                      </div>
                   </div>
                   <div className="glass p-4 rounded-2xl border bg-background/50 space-y-3">
                      <p className="text-sm font-medium text-primary">"I've found a free slot from 2:00 PM to 4:00 PM. Should I schedule your 'API Design' task there?"</p>
                   </div>
                </div>
                {/* Right Side: Sunsama Interface */}
                <div className="flex-1 p-12 flex flex-col items-center justify-center gap-8 relative">
                   <div className="absolute top-8 right-8 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-green-500" />
                      <span className="text-[10px] font-jetbrains text-muted-foreground uppercase">MCP Server Active</span>
                   </div>
                   <div className="w-full space-y-4">
                      <div className="h-12 w-full glass border rounded-2xl opacity-40" />
                      <div className="h-24 w-full glass border-2 border-primary/40 bg-primary/5 rounded-2xl flex items-center justify-center relative overflow-hidden">
                         <div className="text-sm font-bold text-primary">API Design Session</div>
                         <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                         {/* Connection line simulation */}
                         <div className="absolute -left-12 top-1/2 w-12 h-px bg-primary/30 border-dashed border-b" />
                      </div>
                      <div className="h-12 w-full glass border rounded-2xl opacity-40" />
                   </div>
                   <div className="text-center space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Action performed via</div>
                      <div className="font-jetbrains text-xs font-bold uppercase tracking-widest text-primary">Cursor AI Agent</div>
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
                     <Cpu className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold font-display">Model Context Protocol</h3>
                  <p className="text-muted-foreground leading-relaxed">
                     Open Sunsama is built on <span className="text-foreground font-medium">MCP</span>, an open standard that allows 
                     AI agents to securely read and write to your productivity data with 
                     zero friction.
                  </p>
               </div>
               <div className="space-y-6">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                     <Terminal className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold font-display">Zero-Install Setup</h3>
                  <p className="text-muted-foreground leading-relaxed">
                     Integrate in seconds using <span className="text-foreground font-medium">npx -y @open-sunsama/mcp</span>. 
                     No complex server hosting required—the AI talks directly to our 
                     cloud API through your local client.
                  </p>
               </div>
               <div className="space-y-6">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                     <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold font-display">Granular Scopes</h3>
                  <p className="text-muted-foreground leading-relaxed">
                     Security is paramount. Provision API keys with specific permissions 
                     like <span className="text-foreground font-medium">tasks:read</span> or 
                     <span className="text-foreground font-medium">time-blocks:write</span> to maintain 
                     absolute control over what your AI can access.
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
                        Productivity
                     </div>
                     <h2 className="text-4xl md:text-5xl font-bold font-display tracking-tight">AI-Assisted Scheduling</h2>
                     <p className="text-lg text-muted-foreground leading-relaxed">
                        Let your AI agent handle the logistics of your day. It can scan your 
                        backlog, identify priorities based on your goals, and automatically 
                        create time blocks in your calendar.
                     </p>
                     <div className="space-y-4">
                        <div className="glass p-4 rounded-2xl border flex items-center gap-4">
                           <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center"><Bot className="h-5 w-5 opacity-40" /></div>
                           <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full w-[60%] bg-primary" />
                           </div>
                           <span className="text-xs font-jetbrains opacity-50">75% done</span>
                        </div>
                        <div className="glass p-4 rounded-2xl border flex items-center gap-4 opacity-40">
                           <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center"><Sparkles className="h-5 w-5" /></div>
                           <div className="flex-1 h-2 bg-muted rounded-full" />
                        </div>
                     </div>
                  </div>
                  <div className="glass p-8 rounded-[40px] border shadow-2xl bg-muted/10 relative overflow-hidden">
                     <div className="aspect-[4/3] rounded-3xl bg-background border p-8 flex flex-col gap-4">
                        <div className="flex items-center gap-2 mb-4">
                           <Code className="h-4 w-4 text-primary" />
                           <span className="text-xs font-jetbrains font-bold uppercase tracking-widest">MCP Tool Definitions</span>
                        </div>
                        {[
                          "create_task(title, priority, notes)",
                          "list_subtasks(taskId)",
                          "create_time_block(taskId, startTime, endTime)",
                          "get_schedule_for_day(date)"
                        ].map((code, i) => (
                          <div key={i} className="p-3 rounded-xl bg-muted/50 font-jetbrains text-[11px] border border-border/50">
                             <span className="text-primary">export const</span> <span className="text-foreground">{code.split('(')[0]}</span> = ...
                          </div>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Detail 2 */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center lg:flex-row-reverse">
                  <div className="order-first lg:order-last space-y-8">
                     <div className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 font-jetbrains text-xs tracking-widest uppercase inline-block">
                        Interface
                     </div>
                     <h2 className="text-4xl md:text-5xl font-bold font-display tracking-tight">The Cmd + K Command Palette</h2>
                     <p className="text-lg text-muted-foreground leading-relaxed">
                        For humans, we provide a lightning-fast keyboard interface. 
                        Trigger commands, switch views, or search through thousands 
                        of tasks in milliseconds without ever touching your mouse.
                     </p>
                     <div className="flex flex-wrap gap-4">
                        {[
                          { key: "C", label: "Complete Task" },
                          { key: "F", label: "Enter Focus Mode" },
                          { key: "A", label: "Quick Add Task" },
                          { key: "G C", label: "Go to Calendar" }
                        ].map((k, i) => (
                          <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border text-xs">
                             <kbd className="px-1.5 py-0.5 rounded border bg-background font-mono font-bold">{k.key}</kbd>
                             <span className="font-medium text-muted-foreground">{k.label}</span>
                          </div>
                        ))}
                     </div>
                  </div>
                  <div className="glass p-8 rounded-[40px] border shadow-2xl bg-muted/10 relative overflow-hidden">
                     <div className="aspect-[4/3] rounded-3xl bg-background border flex flex-col p-8 gap-6 justify-center">
                        <div className="w-full glass-subtle p-6 rounded-[32px] border shadow-2xl relative">
                           <div className="flex items-center gap-4 mb-6">
                              <Command className="h-8 w-8 text-primary" />
                              <div className="h-8 flex-1 bg-muted rounded-xl animate-pulse" />
                           </div>
                           <div className="space-y-3">
                              <div className="h-12 w-full bg-primary/10 border border-primary/20 rounded-xl" />
                              <div className="h-12 w-full bg-muted/50 rounded-xl" />
                              <div className="h-12 w-full bg-muted/50 rounded-xl" />
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
