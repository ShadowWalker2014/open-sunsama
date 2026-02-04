CREATE TABLE IF NOT EXISTS "task_series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"notes" text,
	"estimated_mins" integer,
	"priority" varchar(2) DEFAULT 'P2' NOT NULL,
	"recurrence_type" varchar(20) NOT NULL,
	"days_of_week" jsonb,
	"day_of_month" integer,
	"week_of_month" integer,
	"day_of_week_monthly" integer,
	"frequency" integer DEFAULT 1 NOT NULL,
	"start_time" varchar(5),
	"timezone" varchar(100) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"last_generated_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "series_id" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "series_instance_number" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_series" ADD CONSTRAINT "task_series_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_series_user_active_idx" ON "task_series" USING btree ("user_id") WHERE "task_series"."is_active" = true;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_series_generation_idx" ON "task_series" USING btree ("is_active","last_generated_date");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_series_id_task_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."task_series"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_series_idx" ON "tasks" USING btree ("series_id");