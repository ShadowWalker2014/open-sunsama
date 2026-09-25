import { Check, Minus, X } from "lucide-react";
import { Reveal } from "@/components/landing/motion";
import { markLabel, type ComparisonCell, type ComparisonRow, type Mark } from "@/content/marketing/types";
import { cn } from "@/lib/utils";
import { RichText } from "./rich-text";
import { SectionHeading } from "./section-heading";
import { CONTAINER, SECTION } from "./tokens";

function MarkIcon({ mark, primary }: { mark: Mark; primary: boolean }) {
  if (mark === "yes") {
    return (
      <span
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full",
          primary ? "bg-primary text-primary-foreground" : "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
        )}
        aria-hidden
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    );
  }
  if (mark === "partial") {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400" aria-hidden>
        <Minus className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    );
  }
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground/70" aria-hidden>
      <X className="h-3.5 w-3.5" strokeWidth={2.5} />
    </span>
  );
}

function Cell({ cell, primary }: { cell: ComparisonCell; primary: boolean }) {
  const mark = typeof cell === "string" ? cell : cell.mark;
  const text = typeof cell === "string" ? undefined : cell.text;
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      {mark && <MarkIcon mark={mark} primary={primary} />}
      {text ? (
        <span className={cn("text-[12.5px] leading-snug", primary ? "font-medium text-foreground" : "text-muted-foreground")}>
          {mark && <span className="sr-only">{markLabel[mark]}: </span>}
          {text}
        </span>
      ) : (
        mark && <span className="sr-only">{markLabel[mark]}</span>
      )}
    </div>
  );
}

/**
 * Feature-by-feature table, Open Sunsama in the first (highlighted) column.
 * Marks carry text for screen readers. On phones the table scrolls sideways
 * inside its own box, with the feature column pinned.
 */
export function ComparisonTable({
  caption,
  columns,
  rows,
  sources,
}: {
  /** Read by screen readers as the table's name. */
  caption: string;
  columns: string[];
  rows: ComparisonRow[];
  /** Where competitor facts come from, and when they were checked. */
  sources?: string;
}) {
  const wide = columns.length > 2;
  return (
    <div>
      <div
        role="region"
        aria-label={caption}
        tabIndex={0}
        className="overflow-x-auto rounded-2xl border border-border/70 bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/[0.08]"
      >
        <table className={cn("w-full border-collapse text-[14px]", wide && "min-w-[680px]")}>
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-border/70">
              <th
                scope="col"
                className="sticky left-0 z-10 w-[132px] min-w-[132px] bg-muted/60 px-4 py-3.5 text-left text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground backdrop-blur sm:w-[30%] sm:px-5"
              >
                Feature
              </th>
              {columns.map((column, i) => (
                <th
                  key={column}
                  scope="col"
                  className={cn(
                    "px-3 py-3.5 text-center text-[13px] font-semibold",
                    i === 0 ? "bg-primary/[0.08] text-primary" : "bg-muted/60 text-foreground/80"
                  )}
                >
                  {i === 0 ? (
                    <span className="inline-flex items-center gap-1.5">
                      <img src="/open-sunsama-logo.png" alt="" className="h-4 w-4 rounded" />
                      {column}
                    </span>
                  ) : (
                    column
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.feature} className="border-b border-border/50 last:border-0">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-background px-4 py-3.5 text-left text-[13.5px] font-medium leading-snug text-foreground/90 sm:w-[30%] sm:px-5"
                >
                  {row.feature}
                </th>
                {row.cells.map((cell, i) => (
                  <td key={`${row.feature}-${columns[i]}`} className={cn("px-3 py-3.5 align-middle", i === 0 && "bg-primary/[0.04]")}>
                    <Cell cell={cell} primary={i === 0} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-col gap-2 text-[12.5px] text-muted-foreground sm:flex-row sm:items-start sm:justify-between">
        {sources && (
          <p className="max-w-3xl leading-relaxed">
            <RichText text={sources} linkClassName="font-normal text-muted-foreground" />
          </p>
        )}
        {wide && <p className="shrink-0 sm:hidden">Scroll sideways to see every app →</p>}
      </div>
    </div>
  );
}

/** A section wrapping ComparisonTable. */
export function ComparisonSection({
  id,
  eyebrow,
  heading,
  lead,
  columns,
  rows,
  sources,
}: {
  id: string;
  eyebrow?: string;
  heading: string;
  lead?: string;
  columns: string[];
  rows: ComparisonRow[];
  sources: string;
}) {
  return (
    <section id={id} className={SECTION} aria-labelledby={`${id}-heading`}>
      <div className={cn(CONTAINER, "max-w-5xl")}>
        <SectionHeading id={`${id}-heading`} eyebrow={eyebrow} heading={heading} lead={lead} />
        <Reveal delay={100} className="mt-12">
          <ComparisonTable caption={heading} columns={columns} rows={rows} sources={sources} />
        </Reveal>
      </div>
    </section>
  );
}
