/**
 * Tests for recurring task generation: the ON CONFLICT clause that must match
 * the partial unique index, and which occurrence the minute check generates.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import { parseISO, format } from "date-fns";
import {
  createDbClient,
  eq,
  users,
  taskSeries,
  tasks,
  type DbClient,
} from "@open-sunsama/database";
import { insertSeriesInstance } from "../task-generator.js";
import { findDueOccurrence, type RecurrencePattern } from "../utils.js";

describe("insertSeriesInstance", () => {
  it("repeats the partial index predicate in ON CONFLICT", () => {
    const db = drizzle.mock() as unknown as DbClient;
    const { sql } = insertSeriesInstance(db, {
      userId: "00000000-0000-0000-0000-000000000001",
      title: "Standup",
      scheduledDate: "2026-09-24",
      seriesId: "00000000-0000-0000-0000-000000000002",
    }).toSQL();

    expect(sql).toContain(
      'on conflict ("series_id","scheduled_date") where "tasks"."series_id" IS NOT NULL do nothing'
    );
  });
});

describe("findDueOccurrence", () => {
  const daily: RecurrencePattern = {
    recurrenceType: "daily",
    frequency: 1,
    daysOfWeek: null,
    dayOfMonth: null,
    weekOfMonth: null,
    dayOfWeekMonthly: null,
  };
  const due = (last: string, series: RecurrencePattern, today: string) => {
    const result = findDueOccurrence(last, series, parseISO(today));
    return result ? format(result, "yyyy-MM-dd") : null;
  };

  it("returns today when the next occurrence is today", () => {
    expect(due("2026-09-23", daily, "2026-09-24")).toBe("2026-09-24");
  });

  it("returns null when the next occurrence is in the future", () => {
    expect(due("2026-09-24", daily, "2026-09-24")).toBeNull();
  });

  it("skips missed occurrences instead of backfilling them", () => {
    expect(due("2026-02-11", daily, "2026-09-24")).toBe("2026-09-24");
  });

  it("returns null when a skipped-ahead weekly series isn't due today", () => {
    // Mondays only; 2026-09-24 is a Thursday
    const weekly = { ...daily, recurrenceType: "weekly", daysOfWeek: [1] };
    expect(due("2026-07-06", weekly, "2026-09-24")).toBeNull();
    expect(due("2026-07-06", weekly, "2026-09-28")).toBe("2026-09-28");
  });

  it("skips weekends for weekday series", () => {
    const weekdays = { ...daily, recurrenceType: "weekdays" };
    expect(due("2026-02-11", weekdays, "2026-09-26")).toBeNull(); // Saturday
    expect(due("2026-02-11", weekdays, "2026-09-28")).toBe("2026-09-28");
  });

  it("returns null for a pattern that never advances", () => {
    expect(due("2026-09-01", { ...daily, frequency: 0 }, "2026-09-24")).toBeNull();
  });
});

// Runs against a migrated database when TEST_DATABASE_URL is set.
const testDbUrl = process.env.TEST_DATABASE_URL;

describe.skipIf(!testDbUrl)("insertSeriesInstance against Postgres", () => {
  let db: DbClient;
  let userId: string;
  let seriesId: string;

  beforeAll(async () => {
    db = createDbClient(testDbUrl);
    const [user] = await db
      .insert(users)
      .values({
        email: `recurring-test-${Date.now()}@example.com`,
        passwordHash: "x",
      })
      .returning();
    userId = user!.id;
    const [series] = await db
      .insert(taskSeries)
      .values({
        userId,
        title: "Standup",
        recurrenceType: "daily",
        timezone: "UTC",
        startDate: "2026-09-23",
      })
      .returning();
    seriesId = series!.id;
  });

  afterAll(async () => {
    if (userId) await db.delete(users).where(eq(users.id, userId));
    await db.$client.end();
  });

  it("inserts once and turns a duplicate into a no-op", async () => {
    const values = {
      userId,
      title: "Standup",
      scheduledDate: "2026-09-24",
      seriesId,
      seriesInstanceNumber: 2,
    };

    const first = await insertSeriesInstance(db, values);
    const second = await insertSeriesInstance(db, values);

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(0);
    const rows = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(eq(tasks.seriesId, seriesId));
    expect(rows).toHaveLength(1);
  });
});
