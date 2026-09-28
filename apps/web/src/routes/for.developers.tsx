import { MarketingPageView } from "@/components/marketing";
import { CodeTabs } from "@/components/personas/code-tabs";
import { TypicalDay } from "@/components/personas/typical-day";
import page, { day, endpoints, snippets } from "@/content/marketing/for/developers";
import type { CustomSection } from "@/content/marketing/types";

/**
 * /for/developers, built from the marketing kit. The copy lives in
 * src/content/marketing/for/developers.ts, which the build also prerenders
 * for crawlers (scripts/prerender-marketing.ts).
 */

const custom = (id: string) => page.sections.find((s): s is CustomSection => s.kind === "custom" && s.id === id)!;
const build = custom("build");
const typical = custom("typical-day");

export default function DevelopersPage() {
  return (
    <MarketingPageView
      page={page}
      slots={{
        build: (
          <CodeTabs
            id={build.id}
            eyebrow={build.eyebrow}
            heading={build.heading}
            lead={build.lead}
            body={build.body?.slice(1, 2)}
            snippets={snippets}
            endpoints={endpoints}
            links={[
              { label: "Tasks API", href: "/docs/api/tasks" },
              { label: "Time blocks API", href: "/docs/api/time-blocks" },
              { label: "MCP tools", href: "/docs/mcp/overview" },
            ]}
          />
        ),
        "typical-day": (
          <TypicalDay
            id={typical.id}
            eyebrow={typical.eyebrow}
            heading={typical.heading}
            lead={typical.lead}
            note="An example day, not a measurement. Your tools and times will differ."
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
