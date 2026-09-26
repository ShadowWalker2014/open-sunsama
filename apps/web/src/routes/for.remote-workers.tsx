import { MarketingPageView } from "@/components/marketing";
import { TypicalDay } from "@/components/personas/typical-day";
import page, { day } from "@/content/marketing/for/remote-workers";
import type { CustomSection } from "@/content/marketing/types";

/**
 * /for/remote-workers, built from the marketing kit. The copy lives in
 * src/content/marketing/for/remote-workers.ts, which the build also prerenders for
 * crawlers (scripts/prerender-marketing.ts).
 */

const typical = page.sections.find((s): s is CustomSection => s.kind === "custom" && s.id === "typical-day")!;

export default function RemoteWorkersPage() {
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
            note="An example day, not a measurement. Your meetings and hours will differ."
            entries={day}
            links={[
              { label: "Focus mode", href: "/features/focus-mode" },
              { label: "Calendar sync", href: "/features/calendar-sync" },
            ]}
          />
        ),
      }}
    />
  );
}
