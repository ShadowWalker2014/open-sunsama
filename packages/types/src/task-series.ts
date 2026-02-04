/**
 * Task Series (Recurring Tasks) type definitions for Open Sunsama
 * @module @open-sunsama/types/task-series
 */

/**
 * Recurrence types supported for recurring tasks.
 * - daily: Every day
 * - weekdays: Monday through Friday
 * - weekly: Specific day(s) of the week
 * - monthly_date: Same date each month (e.g., 15th)
 * - monthly_weekday: Same ordinal weekday each month (e.g., "first Wednesday")
 * - yearly: Same date each year
 */
export type RecurrenceType =
  | "daily"
  | "weekdays"
  | "weekly"
  | "monthly_date"
  | "monthly_weekday"
  | "yearly";

/**
 * Day of week values (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Week of month values for monthly_weekday recurrence
 * 1 = first week, 2 = second week, ..., 5 = last week
 */
export type WeekOfMonth = 1 | 2 | 3 | 4 | 5;

/**
 * Task Series - A template for generating recurring task instances.
 * When a user creates a recurring task, a TaskSeries is created with the
 * recurrence pattern. The system then generates Task instances based on this pattern.
 */
export interface TaskSeries {
  /** Unique identifier for the task series (UUID format) */
  id: string;

  /** ID of the user who owns this series */
  userId: string;

  /** Title/description of the task (inherited by generated instances) */
  title: string;

  /** Additional notes (inherited by generated instances) */
  notes: string | null;

  /** Estimated time to complete (inherited by generated instances) */
  estimatedMins: number | null;

  /** Priority level (inherited by generated instances) */
  priority: "P0" | "P1" | "P2" | "P3";

  /** Type of recurrence pattern */
  recurrenceType: RecurrenceType;

  /**
   * Days of week for weekly recurrence (array of 0-6).
   * Example: [1, 3, 5] = Monday, Wednesday, Friday
   */
  daysOfWeek: DayOfWeek[] | null;

  /**
   * Day of month for monthly_date recurrence (1-31).
   * If month doesn't have this day, uses last day of month.
   */
  dayOfMonth: number | null;

  /**
   * Week of month for monthly_weekday recurrence.
   * Combined with dayOfWeekMonthly.
   */
  weekOfMonth: WeekOfMonth | null;

  /**
   * Day of week for monthly_weekday recurrence (0-6).
   * Example: weekOfMonth=1, dayOfWeekMonthly=3 = "first Wednesday"
   */
  dayOfWeekMonthly: DayOfWeek | null;

  /**
   * Frequency multiplier.
   * 1 = every occurrence, 2 = every other, 3 = every third, etc.
   * Example: recurrenceType=weekly + frequency=2 = every other week
   */
  frequency: number;

  /**
   * Preferred time to create the task instance (HH:MM format, 24-hour).
   * Example: "09:00" for 9 AM
   */
  startTime: string | null;

  /** User's timezone for scheduling (IANA timezone identifier) */
  timezone: string;

  /**
   * Date when the series started (first instance scheduled for this date).
   * Format: YYYY-MM-DD
   */
  startDate: string;

  /**
   * Optional end date for the series.
   * Format: YYYY-MM-DD. If null, series continues indefinitely.
   */
  endDate: string | null;

  /**
   * Date of the last generated instance.
   * Format: YYYY-MM-DD
   */
  lastGeneratedDate: string | null;

  /** Whether the series is active (generating new instances) */
  isActive: boolean;

  /** Timestamp when the series was created */
  createdAt: Date;

  /** Timestamp when the series was last updated */
  updatedAt: Date;
}

/**
 * Input for creating a new task series.
 * Creates both the series template and the first task instance.
 */
export interface CreateTaskSeriesInput {
  /** Title/description of the task */
  title: string;

  /** Additional notes */
  notes?: string;

  /** Estimated time to complete in minutes */
  estimatedMins?: number;

  /** Priority level (P0=Critical, P1=High, P2=Medium, P3=Low) */
  priority?: "P0" | "P1" | "P2" | "P3";

  /** Type of recurrence pattern */
  recurrenceType: RecurrenceType;

  /**
   * Days of week for weekly recurrence.
   * Required when recurrenceType is 'weekly'.
   */
  daysOfWeek?: DayOfWeek[];

  /**
   * Day of month for monthly_date recurrence.
   * Required when recurrenceType is 'monthly_date'.
   */
  dayOfMonth?: number;

  /**
   * Week of month for monthly_weekday recurrence.
   * Required when recurrenceType is 'monthly_weekday'.
   */
  weekOfMonth?: WeekOfMonth;

  /**
   * Day of week for monthly_weekday recurrence.
   * Required when recurrenceType is 'monthly_weekday'.
   */
  dayOfWeekMonthly?: DayOfWeek;

  /**
   * Frequency multiplier (default: 1).
   * 1 = every occurrence, 2 = every other, etc.
   */
  frequency?: number;

  /**
   * Preferred time to create instances (HH:MM format, 24-hour).
   */
  startTime?: string;

  /**
   * Date to start the series.
   * Format: YYYY-MM-DD. Defaults to today.
   */
  startDate?: string;

  /**
   * Optional end date for the series.
   * Format: YYYY-MM-DD
   */
  endDate?: string;
}

/**
 * Input for updating an existing task series.
 * Only provided fields will be updated.
 */
export interface UpdateTaskSeriesInput {
  /** Updated title */
  title?: string;

  /** Updated notes (use null to clear) */
  notes?: string | null;

  /** Updated estimated time in minutes (use null to clear) */
  estimatedMins?: number | null;

  /** Updated priority level */
  priority?: "P0" | "P1" | "P2" | "P3";

  /** Updated recurrence type */
  recurrenceType?: RecurrenceType;

  /** Updated days of week */
  daysOfWeek?: DayOfWeek[];

  /** Updated day of month */
  dayOfMonth?: number | null;

  /** Updated week of month */
  weekOfMonth?: WeekOfMonth | null;

  /** Updated day of week (for monthly) */
  dayOfWeekMonthly?: DayOfWeek | null;

  /** Updated frequency */
  frequency?: number;

  /** Updated start time (use null to clear) */
  startTime?: string | null;

  /** Updated end date (use null to clear) */
  endDate?: string | null;

  /** Whether to stop generating new instances */
  isActive?: boolean;
}

/**
 * Response when creating a task series.
 * Includes both the series and the first generated task instance.
 */
export interface CreateTaskSeriesResponse {
  /** The created task series */
  series: TaskSeries;

  /** The first task instance created from this series */
  firstInstance: {
    id: string;
    title: string;
    scheduledDate: string;
    seriesInstanceNumber: number;
  };
}

/**
 * Task Series with computed display information.
 * Used for the Routines management page.
 */
export interface TaskSeriesWithMeta extends TaskSeries {
  /** Human-readable schedule description */
  scheduleDescription: string;

  /** Total number of instances generated */
  instanceCount: number;

  /** Number of completed instances */
  completedCount: number;

  /** Date of next scheduled instance (if applicable) */
  nextInstanceDate: string | null;
}

/**
 * Filter options for querying task series.
 */
export interface TaskSeriesFilterInput {
  /** Filter by active status */
  isActive?: boolean;

  /** Filter by recurrence type */
  recurrenceType?: RecurrenceType;

  /** Search by title (case-insensitive partial match) */
  titleSearch?: string;

  /** Page number for pagination (1-based) */
  page?: number;

  /** Number of items per page */
  limit?: number;
}

/**
 * Utility type for generating human-readable schedule descriptions.
 */
export interface ScheduleDescription {
  type: RecurrenceType;
  frequency: number;
  daysOfWeek?: DayOfWeek[];
  dayOfMonth?: number;
  weekOfMonth?: WeekOfMonth;
  dayOfWeekMonthly?: DayOfWeek;
  startTime?: string | null;
  estimatedMins?: number | null;
}
