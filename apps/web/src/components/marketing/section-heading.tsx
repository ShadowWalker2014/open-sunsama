import { Reveal } from "@/components/landing/motion";
import { cn } from "@/lib/utils";
import { RichText } from "./rich-text";
import { EYEBROW, H2, LEAD } from "./tokens";

/** Eyebrow, h2 and lead for a section. The h2 states what IS, not the topic. */
export function SectionHeading({
  id,
  eyebrow,
  heading,
  lead,
  align = "center",
  className,
}: {
  /** Used for aria-labelledby on the section. */
  id?: string;
  eyebrow?: string;
  heading: string;
  lead?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <Reveal className={cn(align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl", className)}>
      {eyebrow && <p className={EYEBROW}>{eyebrow}</p>}
      <h2 id={id} className={cn(H2, eyebrow && "mt-3")}>
        {heading}
      </h2>
      {lead && (
        <p className={cn(LEAD, "mt-4", align === "center" && "mx-auto max-w-2xl")}>
          <RichText text={lead} />
        </p>
      )}
    </Reveal>
  );
}
