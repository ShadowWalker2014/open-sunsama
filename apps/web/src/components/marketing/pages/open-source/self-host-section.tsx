/**
 * "Own it": the one-command install in a terminal (install, update, back up),
 * the four containers it starts, what you need, and the honest note about the
 * ready-made desktop apps.
 */

import { ArrowRight, Info } from "lucide-react";
import { Reveal } from "@/components/landing/motion";
import { SmartLink } from "@/components/marketing/rich-text";
import { SectionHeading } from "@/components/marketing/section-heading";
import { CARD, CONTAINER, FOCUS_RING, SECTION } from "@/components/marketing/tokens";
import { openSource } from "@/content/marketing/pages/open-source-task-manager";
import type { CustomSection } from "@/content/marketing/types";
import { cn } from "@/lib/utils";
import { TerminalCard } from "./terminal-card";

const SERVICE_DOT: Record<string, string> = {
  web: "bg-[#F59E0B]",
  api: "bg-[#F97316]",
  postgres: "bg-[#6366F1]",
  redis: "bg-[#F43F5E]",
};

export function SelfHostSection({ section }: { section: CustomSection }) {
  const { tabs, services, needs, note } = openSource.selfHost;
  const longest = Math.max(...tabs.map((tab) => tab.lines.length));

  return (
    <section id={section.id} className={SECTION} aria-labelledby={`${section.id}-heading`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full overflow-hidden" aria-hidden>
        <div className="absolute left-[-12%] top-[18%] h-[420px] w-[560px] rounded-full bg-[radial-gradient(closest-side,hsl(var(--primary)/0.09),transparent)] blur-2xl" />
      </div>
      <div className={cn(CONTAINER, "grid gap-12 lg:grid-cols-2 lg:gap-14")}>
        <div className="min-w-0">
          <SectionHeading id={`${section.id}-heading`} eyebrow={section.eyebrow} heading={section.heading} lead={section.lead} align="left" />

          <Reveal delay={80} className="mt-8">
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">What runs</p>
            <ul className={cn(CARD, "mt-3 divide-y divide-border/60 dark:divide-white/[0.06]")}>
              {services.map((service) => (
                <li key={service.name} className="flex items-center gap-3 px-4 py-3">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", SERVICE_DOT[service.name])} aria-hidden />
                  <span className="w-[76px] shrink-0 font-jetbrains text-[13px] font-semibold text-foreground">{service.name}</span>
                  <span className="min-w-0 flex-1 text-[13.5px] leading-snug text-muted-foreground">{service.detail}</span>
                  <span className="hidden shrink-0 font-jetbrains text-[11.5px] text-muted-foreground/80 sm:block">{service.port}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[13px] text-muted-foreground">
              <span>You need</span>
              {needs.map((need) => (
                <span key={need} className="rounded-md border border-border/70 bg-background/70 px-2 py-0.5 font-medium text-foreground/80 dark:border-white/[0.08]">
                  {need}
                </span>
              ))}
            </p>
          </Reveal>
        </div>

        <Reveal delay={140} y={24} className="min-w-0 lg:pt-9">
          <TerminalCard tabs={tabs} minLines={longest + 1} />
          <div className="mt-4 flex gap-2.5 rounded-xl border border-border/70 bg-muted/40 px-4 py-3 text-[13px] leading-relaxed text-muted-foreground dark:border-white/[0.07]">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>{note}</p>
          </div>
          <SmartLink
            href="/docs/self-hosting/docker"
            className={cn("mt-5 inline-flex items-center gap-1.5 rounded-sm text-[14px] font-medium text-foreground/80 hover:text-primary", FOCUS_RING)}
          >
            Read the Docker guide
            <ArrowRight className="h-3.5 w-3.5" />
          </SmartLink>
        </Reveal>
      </div>
    </section>
  );
}
