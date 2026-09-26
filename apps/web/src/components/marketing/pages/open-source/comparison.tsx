/**
 * The kit's comparison table, with a sources line that links each project's
 * code (followed) and website (nofollow), plus the date the facts were checked.
 */

import { Reveal } from "@/components/landing/motion";
import { ComparisonTable } from "@/components/marketing/comparison-table";
import { SectionHeading } from "@/components/marketing/section-heading";
import { CONTAINER, SECTION } from "@/components/marketing/tokens";
import { openSource } from "@/content/marketing/pages/open-source-task-manager";
import type { ComparisonSection } from "@/content/marketing/types";

const LINK =
  "rounded-sm underline decoration-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function OpenSourceComparison({ section }: { section: ComparisonSection }) {
  return (
    <section id={section.id} className={SECTION} aria-labelledby={`${section.id}-heading`}>
      <div className={CONTAINER}>
        <SectionHeading id={`${section.id}-heading`} eyebrow={section.eyebrow} heading={section.heading} lead={section.lead} />
        <Reveal delay={100} className="mt-12 sm:[&_tr>*:first-child]:w-[17%] [&_table]:min-w-[820px]">
          <ComparisonTable caption={section.heading} columns={section.columns} rows={section.rows} />
          <p className="mt-1.5 max-w-3xl text-[12.5px] leading-relaxed text-muted-foreground sm:mt-0">
            Facts come from each project's license file, README, docs and GitHub releases, checked {openSource.checked}:{" "}
            {openSource.sources.map((source, i) => (
              <span key={source.name}>
                {source.name} (
                <a href={source.repo} target="_blank" rel="noopener" className={LINK}>
                  code
                </a>
                ,{" "}
                <a href={source.site} target="_blank" rel="nofollow noopener noreferrer" className={LINK}>
                  site
                </a>
                ){i < openSource.sources.length - 2 ? ", " : i === openSource.sources.length - 2 ? " and " : "."}
              </span>
            ))}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
