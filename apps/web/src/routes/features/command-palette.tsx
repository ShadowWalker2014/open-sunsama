import { Calendar, Command, Monitor, MousePointer2, Timer, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/landing/motion";
import { CARD, CONTAINER, MarketingPageView, SECTION, SectionHeading } from "@/components/marketing";
import page, { SHORTCUT_GROUPS, type ShortcutGroup } from "@/content/marketing/features/command-palette";
import type { CustomSection } from "@/content/marketing/types";
import { cn } from "@/lib/utils";

const GROUP_ICONS: Record<string, LucideIcon> = {
  "Anywhere in the app": Command,
  "On the task under your cursor": MousePointer2,
  Calendar: Calendar,
  "Focus mode": Timer,
  "Desktop app": Monitor,
};

/** Spoken names, so screen readers don't read "⌘" as a symbol. */
const KEY_NAMES: Record<string, string> = {
  "⌘": "Command",
  "⇧": "Shift",
  "⌥": "Option",
  "⌫": "Delete",
  "→": "Right arrow",
  "←": "Left arrow",
  "↑": "Up arrow",
  "↓": "Down arrow",
  "?": "Question mark",
};

function Keys({ keys }: { keys: string[] }) {
  return (
    <span className="flex shrink-0 items-center gap-1" aria-label={keys.map((key) => KEY_NAMES[key] ?? key).join(" + ")}>
      {keys.map((key) => (
        <kbd
          key={key}
          aria-hidden
          className={cn(
            "inline-flex h-[26px] min-w-[26px] items-center justify-center rounded-md border border-border bg-background px-1.5 font-medium text-foreground shadow-[inset_0_-2px_0_hsl(var(--border))] dark:border-white/[0.12] dark:bg-white/[0.04]",
            KEY_NAMES[key] && key !== "?" ? "font-sans text-[14px]" : "font-mono text-[12px]"
          )}
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}

function GroupCard({ group, delay }: { group: ShortcutGroup; delay: number }) {
  const Icon = GROUP_ICONS[group.title] ?? Command;
  return (
    <Reveal delay={delay} className={cn(CARD, "overflow-hidden")}>
      <div className="flex items-start gap-3 border-b border-border/60 px-5 py-4">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold tracking-[-0.01em]">{group.title}</h3>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{group.note}</p>
        </div>
      </div>
      <dl className="divide-y divide-border/50 px-5">
        {group.items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4 py-2.5">
            <dt className="min-w-0 text-[14px] text-foreground/85">{item.label}</dt>
            <dd>
              <Keys keys={item.keys} />
            </dd>
          </div>
        ))}
      </dl>
    </Reveal>
  );
}

/** The full shortcut sheet: the "shortcuts" custom section of the content module. */
function ShortcutReference() {
  const section = page.sections.find((s): s is CustomSection => s.kind === "custom" && s.id === "shortcuts");
  const byTitle = (title: string) => SHORTCUT_GROUPS.find((g) => g.title === title);
  const columns = [
    ["Anywhere in the app", "Calendar", "Desktop app"],
    ["On the task under your cursor", "Focus mode"],
  ].map((titles) => titles.map(byTitle).filter((g): g is ShortcutGroup => Boolean(g)));

  return (
    <section id="shortcuts" className={SECTION} aria-labelledby="shortcuts-heading">
      <div className={CONTAINER}>
        <SectionHeading id="shortcuts-heading" eyebrow={section?.eyebrow} heading={section?.heading ?? ""} lead={section?.lead} />
        {/* Phones: one column in reading order. md and up: two balanced columns. */}
        <div className="mx-auto mt-12 flex max-w-5xl flex-col gap-4 md:hidden">
          {SHORTCUT_GROUPS.map((group, i) => (
            <GroupCard key={group.title} group={group} delay={i * 60} />
          ))}
        </div>
        <div className="mx-auto mt-12 hidden max-w-5xl grid-cols-2 gap-5 md:grid">
          {columns.map((groups, col) => (
            <div key={col} className="flex min-w-0 flex-col gap-5">
              {groups.map((group, i) => (
                <GroupCard key={group.title} group={group} delay={(col + i) * 80} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * /features/command-palette, built from the marketing kit. Copy and the
 * shortcut list live in src/content/marketing/features/command-palette.ts.
 */
export default function CommandPaletteFeaturePage() {
  return <MarketingPageView page={page} slots={{ shortcuts: <ShortcutReference /> }} />;
}
