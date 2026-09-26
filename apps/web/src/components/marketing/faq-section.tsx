import { JsonLd } from "@/components/seo";
import { Reveal } from "@/components/landing/motion";
import { JSON_LD_IDS } from "@/content/marketing/json-ld";
import { plainText, type MarketingFaq } from "@/content/marketing/types";
import { faqPageJsonLd } from "@/lib/structured-data";
import { cn } from "@/lib/utils";
import { RichText, SmartLink } from "./rich-text";
import { CONTAINER, EYEBROW, H2, SECTION } from "./tokens";

/**
 * Visible questions and answers (never hidden in an accordion) plus FAQPage
 * JSON-LD built from the same text, so what search engines read matches the
 * page. Answers are 1-3 plain sentences; a follow-up link sits after them.
 */
export function FaqSection({
  id = "faq",
  eyebrow = "FAQ",
  heading,
  lead,
  items,
  className,
}: {
  id?: string;
  eyebrow?: string;
  heading: string;
  /** Supports inline links, e.g. "Something missing? Read the [docs](/docs)." */
  lead?: string;
  items: MarketingFaq[];
  className?: string;
}) {
  return (
    <section id={id} className={cn(SECTION, className)} aria-labelledby={`${id}-heading`}>
      <JsonLd
        id={JSON_LD_IDS.faq}
        data={faqPageJsonLd(items.map(({ question, answer }) => ({ question, answer: plainText(answer) })))}
      />
      <div className={cn(CONTAINER, "grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16")}>
        <Reveal className="lg:sticky lg:top-24 lg:self-start">
          <p className={EYEBROW}>{eyebrow}</p>
          <h2 id={`${id}-heading`} className={cn(H2, "mt-3")}>
            {heading}
          </h2>
          {lead && (
            <p className="mt-4 max-w-sm text-[16px] leading-relaxed text-muted-foreground">
              <RichText text={lead} />
            </p>
          )}
        </Reveal>

        <dl className="divide-y divide-border/70 border-y border-border/70">
          {items.map((item) => (
            <Reveal key={item.question} className="py-6 md:py-7">
              <dt className="text-[17px] font-semibold leading-snug tracking-[-0.01em] md:text-[18px]">{item.question}</dt>
              <dd className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground md:text-[15.5px]">
                <RichText text={item.answer} />
                {item.link && (
                  <>
                    {" "}
                    <SmartLink
                      href={item.link.href}
                      className="whitespace-nowrap rounded-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {item.link.label} →
                    </SmartLink>
                  </>
                )}
              </dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
