import { MarketingPageView } from "@/components/marketing";
import { TypicalDay } from "@/components/personas/typical-day";
import page, { day } from "@/content/marketing/for/adhd";
import type { CustomSection } from "@/content/marketing/types";

/**
 * /for/adhd, built from the marketing kit. The copy lives in
 * src/content/marketing/for/adhd.ts, which the build also prerenders for
 * crawlers (scripts/prerender-marketing.ts).
 */

const typical = page.sections.find((s): s is CustomSection => s.kind === "custom" && s.id === "typical-day")!;

export default function AdhdPage() {
  return (
    <MarketingPageView
      page={page}
      slots={{
        "typical-day": (
          <TypicalDay
            id={typical.id}
            eyebrow={typical.eyebrow}
            heading={typical.heading}
            lead={typical.lead}
            note="An example day, not a measurement or medical advice. Your day will look different, and that's fine."
            entries={day}
            links={[
              { label: "Focus mode", href: "/features/focus-mode" },
              { label: "Plan your day with Claude", href: "/blog/plan-your-day-with-claude" },
            ]}
          />
        ),
      }}
    />
  );
}
