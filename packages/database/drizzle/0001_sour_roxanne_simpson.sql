ALTER TABLE "subtasks" ADD COLUMN IF NOT EXISTS "estimated_mins" integer;--> statement-breakpoint
ALTER TABLE "subtasks" ADD COLUMN IF NOT EXISTS "actual_mins" integer;--> statement-breakpoint
ALTER TABLE "subtasks" ADD COLUMN IF NOT EXISTS "timer_started_at" timestamp;--> statement-breakpoint
ALTER TABLE "subtasks" ADD COLUMN IF NOT EXISTS "timer_accumulated_seconds" integer DEFAULT 0 NOT NULL;