import { ArrowRight, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/landing/motion";
import type { IconName } from "@/content/marketing/types";
import { ICONS } from "./icons";
import { RichText, SmartLink } from "./rich-text";
import { SectionHeading } from "./section-heading";
import { CONTAINER, SECTION, SUNRISE } from "./tokens";

export interface BenefitItem {
  icon: IconName | LucideIcon;
  title: string;
  body: string;
  href?: string;
  /** Tile color. Defaults to the sunrise palette, in order. */
  color?: string;
}

/** The home page's hairline feature grid. Three columns on desktop, one on phones. */
export function BenefitGrid({ items }: { items: BenefitItem[] }) {
  return (
    <div className="grid gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/70 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => {
        const Icon = typeof item.icon === "string" ? ICONS[item.icon] : item.icon;
        const color = item.color ?? SUNRISE[i % SUNRISE.length]!;
        const body = (
          <>
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:-translate-y-0.5"
              style={{ backgroundColor: `${color}1f`, color, boxShadow: `inset 0 0 0 1px ${color}33` }}
            >
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 sm:mt-4">
              <h3 className="flex items-center gap-1.5 text-[15.5px] font-semibold">
                {item.title}
                {item.href && (
                  <ArrowRight className="h-3.5 w-3.5 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                )}
              </h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
                {item.href ? item.body : <RichText text={item.body} />}
              </p>
            </div>
          </>
        );
        return (
          <Reveal key={item.title} delay={i * 50} className="h-full min-w-0 bg-background">
            {item.href ? (
              <SmartLink
                href={item.href}
                className="group relative flex h-full items-start gap-4 p-5 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:block sm:p-6"
              >
                {body}
              </SmartLink>
            ) : (
              <div className="group relative flex h-full items-start gap-4 p-5 sm:block sm:p-6">{body}</div>
            )}
          </Reveal>
        );
      })}
    </div>
  );
}

/** A section wrapping BenefitGrid. */
export function BenefitsSection({
  id,
  eyebrow,
  heading,
  lead,
  items,
}: {
  id: string;
  eyebrow?: string;
  heading: string;
  lead?: string;
  items: BenefitItem[];
}) {
  return (
    <section id={id} className={SECTION} aria-labelledby={`${id}-heading`}>
      <div className={CONTAINER}>
        <SectionHeading id={`${id}-heading`} eyebrow={eyebrow} heading={heading} lead={lead} />
        <div className="mt-12">
          <BenefitGrid items={items} />
        </div>
      </div>
    </section>
  );
}
