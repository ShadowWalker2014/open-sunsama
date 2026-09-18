/**
 * Seeds a realistic demo workspace for screenshots, videos, and live demos:
 * "Alex Rivera", Head of Product at a startup — roadmap work, 1:1s, reviews,
 * hiring, customer calls, a time-blocked day, a backlog, and an ideas board.
 *
 * Talks only to the public REST API, so it works against any environment:
 *   DEMO_API_URL=http://localhost:3001 DEMO_PASSWORD=... bun run seed-demo.ts
 *
 * Env:
 *   DEMO_API_URL   API base URL (default http://localhost:3001)
 *   DEMO_EMAIL     demo account email (default alex@example.com)
 *   DEMO_PASSWORD  demo account password (required)
 *   DEMO_TODAY     YYYY-MM-DD treated as "today" (default: today in DEMO_TZ)
 *   DEMO_TZ        IANA timezone for the account (default America/Los_Angeles)
 *   DEMO_RESET     "1" to delete the account's existing tasks, blocks, and boards first
 *
 * Prints the session token on the last line as `TOKEN=<jwt>` for automation.
 */

const API = (process.env.DEMO_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
const EMAIL = process.env.DEMO_EMAIL ?? "alex@example.com";
const PASSWORD = process.env.DEMO_PASSWORD;
const TZ = process.env.DEMO_TZ ?? "America/Los_Angeles";
const RESET = process.env.DEMO_RESET === "1";

if (!PASSWORD) {
  console.error("DEMO_PASSWORD is required");
  process.exit(1);
}

function todayIn(tz: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
}

const TODAY = process.env.DEMO_TODAY ?? todayIn(TZ);

/** Weekday offset from TODAY, skipping weekends (0 = today, -1 = previous workday). */
function workday(offset: number): string {
  const date = new Date(`${TODAY}T12:00:00Z`);
  const step = offset < 0 ? -1 : 1;
  let remaining = Math.abs(offset);
  while (remaining > 0) {
    date.setUTCDate(date.getUTCDate() + step);
    const day = date.getUTCDay();
    if (day !== 0 && day !== 6) remaining--;
  }
  return date.toISOString().slice(0, 10);
}

let token = "";

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const json = (await res.json().catch(() => ({}))) as { success?: boolean; data?: T; error?: unknown };
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status} ${JSON.stringify(json.error ?? json)}`);
  }
  return json.data as T;
}

async function signIn(): Promise<void> {
  try {
    const data = await api<{ token: string }>("POST", "/auth/register", {
      email: EMAIL,
      password: PASSWORD,
      name: "Alex Rivera",
    });
    token = data.token;
    console.log(`Created ${EMAIL}`);
  } catch (error) {
    // Only an existing account falls through to login; surface anything else.
    if (!String(error).includes("409")) throw error;
    const data = await api<{ token: string }>("POST", "/auth/login", { email: EMAIL, password: PASSWORD });
    token = data.token;
    console.log(`Signed in as ${EMAIL}`);
  }
}

async function reset(): Promise<void> {
  const tasks = await api<Array<{ id: string }>>("GET", "/tasks?limit=500");
  for (const task of tasks) await api("DELETE", `/tasks/${task.id}`);
  const blocks = await api<Array<{ id: string }>>("GET", `/time-blocks?from=${workday(-5)}&to=2099-12-31`);
  for (const block of blocks) await api("DELETE", `/time-blocks/${block.id}`);
  const boards = await api<Array<{ id: string }>>("GET", "/ideas/boards");
  for (const board of boards) await api("DELETE", `/ideas/boards/${board.id}`);
  console.log(`Reset: removed ${tasks.length} tasks, ${blocks.length} time blocks, ${boards.length} idea boards`);
}

type Priority = "P0" | "P1" | "P2" | "P3";

interface TaskSeed {
  key?: string;
  title: string;
  priority: Priority;
  mins?: number;
  notes?: string;
  done?: boolean;
  subtasks?: Array<[title: string, done?: boolean]>;
}

const DAYS: Array<{ day: number | null; tasks: TaskSeed[] }> = [
  {
    day: 0,
    tasks: [
      { key: "escalations", title: "Review overnight support escalations", priority: "P1", mins: 15, done: true },
      { key: "standup", title: "Daily standup notes", priority: "P3", mins: 10, done: true },
      {
        key: "roadmap",
        title: "Finalize Q4 roadmap for leadership review",
        priority: "P0",
        mins: 90,
        notes:
          "<p>Three themes: <strong>activation</strong>, <strong>team plans</strong>, <strong>AI assistant</strong>. Keep it to one page and lead with the revenue impact.</p>",
        subtasks: [
          ["Rank themes by revenue impact", true],
          ["Pressure-test estimates with eng leads", true],
          ["Draft the one-page narrative"],
          ["Send pre-read to leadership"],
        ],
      },
      {
        key: "priya",
        title: "1:1 with Priya: career growth plan",
        priority: "P1",
        mins: 30,
        subtasks: [["Review last quarter's goals"], ["Bring promo feedback from peers"]],
      },
      { key: "pr", title: "Review PR #482: onboarding checklist redesign", priority: "P1", mins: 45 },
      { key: "hiring", title: "Write hiring plan for 2 senior engineers", priority: "P2", mins: 60 },
      { key: "investor", title: "Reply to investor update thread", priority: "P2", mins: 20 },
      { key: "expenses", title: "Submit September expense report", priority: "P3", mins: 15 },
    ],
  },
  {
    day: 1,
    tasks: [
      { key: "acme", title: "Customer call: Acme onboarding feedback", priority: "P1", mins: 45 },
      {
        key: "blog",
        title: "Draft launch blog post for the AI assistant",
        priority: "P1",
        mins: 60,
        subtasks: [["Outline the three use cases"], ["Grab screenshots from staging"], ["Ask legal to review claims"]],
      },
      { key: "interview", title: "Interview: senior backend candidate", priority: "P2", mins: 60 },
      { title: "Update OKR scorecard", priority: "P2", mins: 30 },
    ],
  },
  {
    day: 2,
    tasks: [
      { key: "planning", title: "Quarterly planning workshop", priority: "P0", mins: 120 },
      { key: "pricing", title: "Pricing page experiment readout", priority: "P1", mins: 30 },
      { title: "Book the team offsite venue", priority: "P3", mins: 20 },
    ],
  },
  {
    day: 3,
    tasks: [
      { key: "retro", title: "Sprint retro and demo day", priority: "P1", mins: 60 },
      { key: "weekly", title: "Weekly review: plan next week", priority: "P2", mins: 30 },
      { title: "Clear inbox and Slack DMs", priority: "P3", mins: 30 },
    ],
  },
  {
    day: 4,
    tasks: [
      { key: "board", title: "Board deck: product section", priority: "P0", mins: 90 },
      { key: "design", title: "Design review: mobile calendar", priority: "P2", mins: 45 },
    ],
  },
  {
    day: null,
    tasks: [
      { title: "Set up a quarterly customer advisory board", priority: "P1", mins: 60 },
      { title: "Refactor billing webhooks (tech debt)", priority: "P2", mins: 120 },
      { title: "Plan the team offsite agenda", priority: "P2", mins: 45 },
      { title: "Renew SOC 2 vendor questionnaire", priority: "P2", mins: 30 },
      { title: "Research AI meeting note-takers", priority: "P3", mins: 30 },
      { title: "Read 'An Elegant Puzzle', chapter 3", priority: "P3", mins: 40 },
    ],
  },
];

// A time-blocked week; `task` links the block to a seeded task.
const BLOCKS: Array<{ day: number; start: string; end: string; title: string; color: string; task?: string }> = [
  { day: -1, start: "09:00", end: "09:15", title: "Daily standup", color: "#8B5CF6" },
  { day: -1, start: "09:30", end: "10:30", title: "Weekly planning", color: "#F59E0B" },
  { day: -1, start: "11:00", end: "12:00", title: "Roadmap: first draft", color: "#EF4444" },
  { day: -1, start: "12:00", end: "12:45", title: "Lunch", color: "#10B981" },
  { day: -1, start: "14:00", end: "14:30", title: "1:1 with Sam", color: "#3B82F6" },
  { day: -1, start: "15:00", end: "16:00", title: "Eng + product sync", color: "#8B5CF6" },
  { day: 0, start: "08:30", end: "08:45", title: "Review escalations", color: "#F59E0B", task: "escalations" },
  { day: 0, start: "09:00", end: "09:15", title: "Daily standup", color: "#8B5CF6", task: "standup" },
  { day: 0, start: "09:30", end: "11:00", title: "Deep work: Q4 roadmap", color: "#EF4444", task: "roadmap" },
  { day: 0, start: "11:15", end: "11:45", title: "1:1 with Priya", color: "#3B82F6", task: "priya" },
  { day: 0, start: "12:00", end: "12:45", title: "Lunch", color: "#10B981" },
  { day: 0, start: "13:00", end: "13:45", title: "PR review: onboarding redesign", color: "#3B82F6", task: "pr" },
  { day: 0, start: "14:00", end: "15:00", title: "Hiring plan", color: "#8B5CF6", task: "hiring" },
  { day: 0, start: "15:15", end: "15:35", title: "Investor update reply", color: "#F59E0B", task: "investor" },
  { day: 0, start: "16:00", end: "16:30", title: "Expenses + inbox", color: "#6B7280", task: "expenses" },
  { day: 1, start: "09:00", end: "09:15", title: "Daily standup", color: "#8B5CF6" },
  { day: 1, start: "10:00", end: "10:45", title: "Acme onboarding call", color: "#3B82F6", task: "acme" },
  { day: 1, start: "13:00", end: "14:00", title: "Launch blog draft", color: "#EF4444", task: "blog" },
  { day: 1, start: "15:00", end: "16:00", title: "Backend interview", color: "#8B5CF6", task: "interview" },
  { day: 2, start: "09:00", end: "09:15", title: "Daily standup", color: "#8B5CF6" },
  { day: 2, start: "10:00", end: "12:00", title: "Quarterly planning workshop", color: "#EF4444", task: "planning" },
  { day: 2, start: "12:00", end: "12:45", title: "Lunch", color: "#10B981" },
  { day: 2, start: "14:00", end: "14:30", title: "Pricing experiment readout", color: "#3B82F6", task: "pricing" },
  { day: 3, start: "09:00", end: "09:15", title: "Daily standup", color: "#8B5CF6" },
  { day: 3, start: "11:00", end: "12:00", title: "Sprint retro + demo day", color: "#3B82F6", task: "retro" },
  { day: 3, start: "15:00", end: "15:30", title: "Weekly review", color: "#F59E0B", task: "weekly" },
  { day: 4, start: "09:00", end: "09:15", title: "Daily standup", color: "#8B5CF6" },
  { day: 4, start: "10:00", end: "11:30", title: "Board deck: product", color: "#EF4444", task: "board" },
  { day: 4, start: "14:00", end: "14:45", title: "Mobile calendar design review", color: "#8B5CF6", task: "design" },
];

const IDEA_BOARDS: Array<{
  name: string;
  icon: string;
  color: string;
  columns: Array<{ name: string; ideas: Array<{ title: string; priority?: Priority; mins?: number }> }>;
}> = [
  {
    name: "Product bets",
    icon: "Lightbulb",
    color: "#F59E0B",
    columns: [
      {
        name: "Someday",
        ideas: [
          { title: "Voice capture on mobile" },
          { title: "Habit streaks for recurring tasks", priority: "P3" },
          { title: "Shared team boards" },
        ],
      },
      {
        name: "Exploring",
        ideas: [
          { title: "AI weekly review summary", priority: "P1", mins: 120 },
          { title: "Slack message → task capture", priority: "P2", mins: 90 },
        ],
      },
      {
        name: "Ready to build",
        ideas: [{ title: "Auto-schedule P0s into open calendar slots", priority: "P1", mins: 240 }],
      },
    ],
  },
  {
    name: "Personal growth",
    icon: "Sprout",
    color: "#10B981",
    columns: [
      {
        name: "Someday",
        ideas: [
          { title: "Write about async leadership" },
          { title: "Learn enough Rust to review PRs" },
          { title: "Give a talk at a product meetup" },
        ],
      },
    ],
  },
];

async function main() {
  console.log(`Seeding demo workspace at ${API} (today = ${TODAY})`);
  await signIn();

  await api("PATCH", "/auth/me", {
    name: "Alex Rivera",
    timezone: TZ,
    preferences: {
      themeMode: "light",
      colorTheme: "default",
      fontFamily: "geist",
      workStartHour: 8,
      workEndHour: 18,
    },
  });

  if (RESET) await reset();

  const taskIds = new Map<string, string>();
  let taskCount = 0;
  for (const group of DAYS) {
    const scheduledDate = group.day === null ? null : workday(group.day);
    for (const [position, seed] of group.tasks.entries()) {
      const task = await api<{ id: string }>("POST", "/tasks", {
        title: seed.title,
        priority: seed.priority,
        estimatedMins: seed.mins ?? null,
        notes: seed.notes ?? null,
        scheduledDate,
        position,
      });
      taskCount++;
      if (seed.key) taskIds.set(seed.key, task.id);
      for (const [index, [title, done]] of (seed.subtasks ?? []).entries()) {
        const subtask = await api<{ id: string }>("POST", `/tasks/${task.id}/subtasks`, { title, position: index });
        if (done) await api("PATCH", `/tasks/${task.id}/subtasks/${subtask.id}`, { completed: true });
      }
      if (seed.done) {
        await api("PATCH", `/tasks/${task.id}`, {
          completedAt: new Date(`${scheduledDate ?? TODAY}T16:00:00Z`).toISOString(),
          actualMins: seed.mins ?? null,
        });
      }
    }
  }

  for (const block of BLOCKS) {
    await api("POST", "/time-blocks", {
      title: block.title,
      date: workday(block.day),
      startTime: block.start,
      endTime: block.end,
      color: block.color,
      taskId: block.task ? taskIds.get(block.task) ?? null : null,
    });
  }

  let ideaCount = 0;
  for (const [boardPosition, seed] of IDEA_BOARDS.entries()) {
    const board = await api<{ id: string; columns: Array<{ id: string }> }>("POST", "/ideas/boards", {
      name: seed.name,
      icon: seed.icon,
      color: seed.color,
      position: boardPosition,
    });
    for (const [columnIndex, columnSeed] of seed.columns.entries()) {
      // Every new board comes with one default column; rename it instead of adding a duplicate.
      const columnId =
        columnIndex === 0 && board.columns[0]
          ? (await api<{ id: string }>("PATCH", `/ideas/columns/${board.columns[0].id}`, { name: columnSeed.name })).id
          : (await api<{ id: string }>("POST", "/ideas/columns", {
              boardId: board.id,
              name: columnSeed.name,
              position: columnIndex,
            })).id;
      for (const [position, idea] of columnSeed.ideas.entries()) {
        await api("POST", "/ideas", {
          boardId: board.id,
          columnId,
          title: idea.title,
          priority: idea.priority,
          estimatedMins: idea.mins ?? null,
          position,
        });
        ideaCount++;
      }
    }
  }

  console.log(`Seeded ${taskCount} tasks, ${BLOCKS.length} time blocks, ${ideaCount} ideas`);
  console.log(`TOKEN=${token}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
