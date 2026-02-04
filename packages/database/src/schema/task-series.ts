/**
 * Task Series schema for recurring tasks
 * A task series is a template that generates task instances on a schedule
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  date,
  boolean,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";

/**
 * Recurrence types supported
 */
export const RECURRENCE_TYPES = [
  "daily",
  "weekdays",
  "weekly",
  "monthly_date",
  "monthly_weekday",
  "yearly",
] as const;
export type RecurrenceType = (typeof RECURRENCE_TYPES)[number];

/**
 * Days of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export const DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5, 6] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

/**
 * Task Series - Template for recurring tasks
 *
 * When a user creates a recurring task:
 * 1. A task_series record is created with the recurrence pattern
 * 2. The PG Boss worker generates task instances based on this pattern
 * 3. Each generated task references back to this series via seriesId
 */
export const taskSeries = pgTable(
  "task_series",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Task template fields (inherited by generated instances)
    title: varchar("title", { length: 500 }).notNull(),
    notes: text("notes"),
    estimatedMins: integer("estimated_mins"),
    priority: varchar("priority", { length: 2 }).notNull().default("P2"),

    // Recurrence configuration
    recurrenceType: varchar("recurrence_type", { length: 20 })
      .notNull()
      .$type<RecurrenceType>(),

    /**
     * Days of week for weekly recurrence (array of 0-6)
     * Example: [1, 3, 5] = Monday, Wednesday, Friday
     * Stored as JSONB array
     */
    daysOfWeek: jsonb("days_of_week").$type<number[]>(),

    /**
     * Day of month for monthly_date recurrence (1-31)
     * If month doesn't have this day, uses last day of month
     */
    dayOfMonth: integer("day_of_month"),

    /**
     * Week of month for monthly_weekday recurrence (1-5)
     * 1 = first week, 2 = second, ..., 5 = last
     */
    weekOfMonth: integer("week_of_month"),

    /**
     * Day of week for monthly_weekday recurrence (0-6)
     * Combined with weekOfMonth: e.g., weekOfMonth=1, dayOfWeekMonthly=3 = "first Wednesday"
     */
    dayOfWeekMonthly: integer("day_of_week_monthly"),

    /**
     * Frequency multiplier (1 = every occurrence, 2 = every other, 3 = every third, etc.)
     * Example: recurrenceType=weekly + frequency=2 = every other week
     */
    frequency: integer("frequency").notNull().default(1),

    /**
     * Preferred time to create the task instance (HH:MM format, 24-hour)
     * Example: "09:00" for 9 AM
     */
    startTime: varchar("start_time", { length: 5 }),

    /**
     * User's timezone for scheduling (IANA timezone identifier)
     * Example: "America/Los_Angeles", "Europe/London"
     */
    timezone: varchar("timezone", { length: 100 }).notNull(),

    /**
     * Date when the series started (first instance scheduled for this date)
     * Format: YYYY-MM-DD
     */
    startDate: date("start_date").notNull(),

    /**
     * Optional end date for the series
     * Format: YYYY-MM-DD
     * If null, series continues indefinitely
     */
    endDate: date("end_date"),

    /**
     * Date of the last generated instance
     * Used to track progress and prevent duplicate generation
     * Format: YYYY-MM-DD
     */
    lastGeneratedDate: date("last_generated_date"),

    /**
     * Whether the series is active (generating new instances)
     */
    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    // Index for finding active series by user
    index("task_series_user_active_idx")
      .on(table.userId)
      .where(sql`${table.isActive} = true`),
    // Index for the recurring task worker to find series needing generation
    index("task_series_generation_idx").on(
      table.isActive,
      table.lastGeneratedDate
    ),
  ]
);

/**
 * Relations for task series
 */
export const taskSeriesRelations = relations(taskSeries, ({ one }) => ({
  user: one(users, {
    fields: [taskSeries.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
const baseInsertSchema = createInsertSchema(taskSeries, {
  title: z.string().min(1, "Title is required").max(500),
  notes: z.string().optional(),
  estimatedMins: z.number().int().positive().optional(),
  priority: z.enum(["P0", "P1", "P2", "P3"]).optional(),
  recurrenceType: z.enum(RECURRENCE_TYPES),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  weekOfMonth: z.number().int().min(1).max(5).optional(),
  dayOfWeekMonthly: z.number().int().min(0).max(6).optional(),
  frequency: z.number().int().min(1).max(12).optional(),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)")
    .optional(),
  timezone: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .optional(),
});

export const insertTaskSeriesSchema = baseInsertSchema.refine(
  (data) => {
    // Validate required fields based on recurrence type
    if (
      data.recurrenceType === "weekly" &&
      (!data.daysOfWeek || data.daysOfWeek.length === 0)
    ) {
      return false;
    }
    if (data.recurrenceType === "monthly_date" && !data.dayOfMonth) {
      return false;
    }
    if (
      data.recurrenceType === "monthly_weekday" &&
      (!data.weekOfMonth || data.dayOfWeekMonthly === undefined)
    ) {
      return false;
    }
    return true;
  },
  { message: "Required fields missing for recurrence type" }
);

export const selectTaskSeriesSchema = createSelectSchema(taskSeries);

export const updateTaskSeriesSchema = baseInsertSchema
  .partial()
  .omit({ userId: true });

// Type exports
export type TaskSeries = typeof taskSeries.$inferSelect;
export type NewTaskSeries = typeof taskSeries.$inferInsert;
export type UpdateTaskSeries = z.infer<typeof updateTaskSeriesSchema>;
