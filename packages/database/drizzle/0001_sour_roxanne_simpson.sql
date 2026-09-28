ALTER TABLE "subtasks" ADD COLUMN "estimated_mins" integer;--> statement-breakpoint
ALTER TABLE "subtasks" ADD COLUMN "actual_mins" integer;--> statement-breakpoint
ALTER TABLE "subtasks" ADD COLUMN "timer_started_at" timestamp;--> statement-breakpoint
ALTER TABLE "subtasks" ADD COLUMN "timer_accumulated_seconds" integer DEFAULT 0 NOT NULL;