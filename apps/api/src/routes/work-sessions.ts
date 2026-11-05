/**
 * Work sessions routes for Open Sunsama API
 * When tasks were actually worked on, from their timers, for the calendar.
 */
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  getDb,
  eq,
  and,
  lt,
  gt,
  isNotNull,
  tasks,
  users,
  workSessions,
} from "@open-sunsama/database";
import { dateSchema } from "@open-sunsama/utils";
import { auth, requireScopes, type AuthVariables } from "../middleware/auth.js";
import { localDayWindow } from "../lib/calendar-day-window.js";

const workSessionsRouter = new Hono<{ Variables: AuthVariables }>();
workSessionsRouter.use("*", auth);

const rangeQuerySchema = z
  .object({
    // ISO instants, or one YYYY-MM-DD day in the user's timezone.
    from: z.iso.datetime({ offset: true }).optional(),
    to: z.iso.datetime({ offset: true }).optional(),
    date: dateSchema.optional(),
  })
  .refine((q) => (q.date ? !q.from && !q.to : !!q.from && !!q.to), {
    error: "Pass either date, or both from and to",
  });

/**
 * GET /work-sessions?from=&to= or ?date=
 * Sessions that overlap the range, plus any timer running now (ending now).
 */
workSessionsRouter.get(
  "/",
  requireScopes("tasks:read"),
  zValidator("query", rangeQuerySchema),
  async (c) => {
    const userId = c.get("userId");
    const query = c.req.valid("query");
    const db = getDb();

    const [user] = await db
      .select({ timezone: users.timezone })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const day = query.date
      ? localDayWindow(query.date, query.date, user?.timezone || "UTC")
      : null;
    const from = day ? day.start : new Date(query.from!);
    const to = day ? day.end : new Date(query.to!);

    const finished = await db
      .select({
        id: workSessions.id,
        taskId: workSessions.taskId,
        taskTitle: tasks.title,
        startedAt: workSessions.startedAt,
        endedAt: workSessions.endedAt,
      })
      .from(workSessions)
      .innerJoin(tasks, eq(workSessions.taskId, tasks.id))
      .where(
        and(
          eq(workSessions.userId, userId),
          lt(workSessions.startedAt, to),
          gt(workSessions.endedAt, from)
        )
      );

    const now = new Date();
    const running = await db
      .select({
        taskId: tasks.id,
        taskTitle: tasks.title,
        startedAt: tasks.timerStartedAt,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          isNotNull(tasks.timerStartedAt),
          lt(tasks.timerStartedAt, to)
        )
      );

    // A running timer covers startedAt → now, so it only shows when the
    // range starts before now.
    const runningSessions =
      now > from
        ? running.map((r) => ({
            id: `running:${r.taskId}`,
            taskId: r.taskId,
            taskTitle: r.taskTitle,
            startedAt: r.startedAt!,
            endedAt: now,
            isRunning: true,
          }))
        : [];

    const sessions = [
      ...finished.map((s) => ({ ...s, isRunning: false })),
      ...runningSessions,
    ];

    return c.json({
      success: true,
      data: sessions,
      meta: { timezone: day?.timezone ?? user?.timezone ?? "UTC" },
    });
  }
);

export { workSessionsRouter };
