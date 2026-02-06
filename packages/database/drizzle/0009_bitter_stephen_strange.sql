ALTER TABLE "tasks" ADD COLUMN "timer_started_at" timestamp;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "timer_accumulated_seconds" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_active_timer_idx" ON "tasks" USING btree ("user_id") WHERE "tasks"."timer_started_at" IS NOT NULL;