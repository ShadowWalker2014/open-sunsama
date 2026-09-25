import { Reveal } from "@/components/landing/motion";
import { cn } from "@/lib/utils";
import { RichText } from "./rich-text";
import { SectionHeading } from "./section-heading";
import { CARD, CONTAINER, SECTION } from "./tokens";

/** Numbered how-to steps (how to start, how to switch). Order matters, so they're numbered. */
export function Steps({ steps }: { steps: Array<{ title: string; body: string }> }) {
  return (
    <ol className={cn("grid gap-4", steps.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2")}>
      {steps.map((step, i) => (
        <Reveal as="li" key={step.title} delay={i * 100} className={cn(CARD, "relative p-6 md:p-7")}>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] text-[14px] font-semibold text-white shadow-[0_6px_16px_-6px_hsl(var(--primary)/0.7)]">
            {i + 1}
          </span>
          <h3 className="mt-5 text-[17px] font-semibold tracking-[-0.01em]">{step.title}</h3>
          <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">
            <RichText text={step.body} />
          </p>
        </Reveal>
      ))}
    </ol>
  );
}

/** A section wrapping Steps. */
export function StepsSection({
  id,
  eyebrow,
  heading,
  lead,
  steps,
}: {
  id: string;
  eyebrow?: string;
  heading: string;
  lead?: string;
  steps: Array<{ title: string; body: string }>;
}) {
  return (
    <section id={id} className={SECTION} aria-labelledby={`${id}-heading`}>
      <div className={CONTAINER}>
        <SectionHeading id={`${id}-heading`} eyebrow={eyebrow} heading={heading} lead={lead} />
        <div className="mt-12">
          <Steps steps={steps} />
        </div>
      </div>
    </section>
  );
}
