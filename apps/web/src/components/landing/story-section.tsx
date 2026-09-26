/**
 * Home page feature tour, told on scroll with real recordings. The pinned
 * layout lives in components/marketing/story-pinned.tsx, shared with the
 * marketing pages.
 */

import { Calendar, CheckCircle2, Command, Lightbulb, LayoutGrid, Timer } from "lucide-react";
import { StoryPinned, type PinnedStep } from "@/components/marketing/story-pinned";
import { Reveal } from "./motion";
import { ThemedShot, type ShotName } from "./product-shot";

interface Step {
  shot: ShotName;
  /** Real recording from blog-media.json; the screenshot shows until it plays. */
  clip?: string;
  icon: typeof LayoutGrid;
  eyebrow: string;
  title: string;
  body: string;
  href?: string;
  /** Zoom into the part of the screenshot this step is about. */
  zoom: { scale: number; origin: string };
}

const STEPS: Step[] = [
  {
    shot: "board",
    clip: "plan-day",
    icon: LayoutGrid,
    eyebrow: "Plan",
    title: "Plan today on a board.",
    body: "Drag tasks between days, set P0–P3 priorities, and add estimates and subtasks. Each day shows how much you've planned against the time you actually have.",
    href: "/features/kanban",
    zoom: { scale: 1, origin: "50% 0%" },
  },
  {
    shot: "calendar-week",
    clip: "time-block",
    icon: Calendar,
    eyebrow: "Time-block",
    title: "Give every task a time.",
    body: "Drop tasks onto the calendar to see what really fits. Blocks link back to their tasks, and your Google, Outlook, and iCloud calendars sync right in.",
    href: "/features/time-blocking",
    zoom: { scale: 1.08, origin: "45% 35%" },
  },
  {
    shot: "focus",
    clip: "focus",
    icon: Timer,
    eyebrow: "Focus",
    title: "Then do one thing at a time.",
    body: "Focus mode puts a single task and a timer on screen. Actual time is tracked against your estimate, so tomorrow's plan gets more honest.",
    href: "/features/focus-mode",
    zoom: { scale: 1.18, origin: "50% 12%" },
  },
  {
    shot: "command-palette",
    clip: "command-palette",
    icon: Command,
    eyebrow: "Navigate",
    title: "Find anything with ⌘K.",
    body: "Jump to any task, idea, or setting in a keystroke. Search spans tasks, ideas, and events, and every action has a shortcut.",
    href: "/features/command-palette",
    zoom: { scale: 1.12, origin: "50% 42%" },
  },
  {
    shot: "task-detail",
    clip: "shutdown",
    icon: CheckCircle2,
    eyebrow: "Shut down",
    title: "Close the day on purpose.",
    body: "Check off what you finished. Anything left rolls over to tomorrow, so nothing slips through and you can stop on time.",
    zoom: { scale: 1, origin: "50% 0%" },
  },
  {
    shot: "ideas",
    clip: "ideas",
    icon: Lightbulb,
    eyebrow: "Someday",
    title: "Park ideas without losing them.",
    body: "Trello-style boards for bets, side projects, and someday-maybes. When an idea's time comes, promote it to a real task in one click.",
    zoom: { scale: 1, origin: "50% 0%" },
  },
];

const PINNED: PinnedStep[] = STEPS.map((step) => ({
  key: step.shot,
  icon: step.icon,
  eyebrow: step.eyebrow,
  title: step.title,
  body: step.body,
  ...(step.clip ? { clip: step.clip } : {}),
  still: (
    <ThemedShot name={step.shot} alt={step.title} className="absolute inset-0 h-full object-cover object-top" />
  ),
  zoom: step.zoom,
  ...(step.href ? { link: { label: "Learn more", href: step.href } } : {}),
}));

export function StorySection() {
  return (
    <StoryPinned
      id="tour"
      steps={PINNED}
      className="py-24"
      header={
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-primary">How it works</p>
          <h2 className="mt-3 text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] md:text-[44px]">
            A calmer way to run your day.
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground">
            Sunsama-style daily planning: decide what matters, give it a time, and do it. Every clip below
            is a real recording of the app.
          </p>
        </Reveal>
      }
    />
  );
}
