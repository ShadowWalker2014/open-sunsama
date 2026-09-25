-- Baseline: the whole schema as of migration 0016_oauth_provider, squashed into one file.
-- Every statement is idempotent (IF NOT EXISTS / duplicate_object guards), so it is safe on a
-- database that already has these tables. Its journal timestamp equals the old 0016 entry, so a
-- database that already applied 0000-0016 treats it as done and never runs it.
CREATE TABLE IF NOT EXISTS "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"key_hash" varchar(255) NOT NULL,
	"key_prefix" varchar(12) NOT NULL,
	"scopes" text[],
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid,
	"user_id" uuid NOT NULL,
	"url" varchar(500) NOT NULL,
	"filename" varchar(255) NOT NULL,
	"content_type" varchar(100) NOT NULL,
	"size" integer NOT NULL,
	"s3_key" varchar(500) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "calendar_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(20) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"access_token_encrypted" text,
	"refresh_token_encrypted" text,
	"token_expires_at" timestamp,
	"caldav_password_encrypted" text,
	"caldav_url" varchar(500),
	"sync_token" varchar(500),
	"last_synced_at" timestamp,
	"sync_status" varchar(20) DEFAULT 'idle',
	"sync_error" text,
	"webhook_subscription_id" varchar(500),
	"webhook_expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"calendar_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"external_id" varchar(500) NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"location" varchar(500),
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"is_all_day" boolean DEFAULT false NOT NULL,
	"timezone" varchar(50),
	"recurrence_rule" varchar(500),
	"recurring_event_id" varchar(500),
	"status" varchar(20) DEFAULT 'confirmed',
	"response_status" varchar(20),
	"html_link" varchar(1000),
	"etag" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "calendars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"external_id" varchar(500) NOT NULL,
	"name" varchar(255) NOT NULL,
	"color" varchar(7),
	"is_enabled" boolean DEFAULT true NOT NULL,
	"is_default_for_events" boolean DEFAULT false NOT NULL,
	"is_default_for_tasks" boolean DEFAULT false NOT NULL,
	"is_read_only" boolean DEFAULT false NOT NULL,
	"sync_token" varchar(500),
	"watch_channel_id" varchar(255),
	"watch_resource_id" varchar(255),
	"watch_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "idea_boards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"icon" varchar(64) DEFAULT 'Lightbulb' NOT NULL,
	"color" varchar(7) DEFAULT '#6366F1' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "idea_columns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"board_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "idea_subtasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idea_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ideas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"board_id" uuid NOT NULL,
	"column_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"notes" text,
	"estimated_mins" integer,
	"priority" varchar(2) DEFAULT 'P2' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp,
	"promoted_task_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"task_reminders_enabled" boolean DEFAULT true NOT NULL,
	"reminder_timing" integer DEFAULT 15 NOT NULL,
	"email_notifications_enabled" boolean DEFAULT false NOT NULL,
	"daily_summary_enabled" boolean DEFAULT false NOT NULL,
	"push_notifications_enabled" boolean DEFAULT false NOT NULL,
	"rollover_destination" varchar(20) DEFAULT 'backlog' NOT NULL,
	"rollover_position" varchar(20) DEFAULT 'top' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "oauth_authorization_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code_hash" varchar(64) NOT NULL,
	"client_id" varchar(512) NOT NULL,
	"user_id" uuid NOT NULL,
	"redirect_uri" text NOT NULL,
	"code_challenge" varchar(128) NOT NULL,
	"scopes" text[] NOT NULL,
	"resource" varchar(1024),
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_authorization_codes_code_hash_unique" UNIQUE("code_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "oauth_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar(512) NOT NULL,
	"client_secret_hash" varchar(64),
	"client_name" varchar(255),
	"client_uri" varchar(1024),
	"logo_uri" varchar(1024),
	"jwks_uri" varchar(1024),
	"redirect_uris" text[] NOT NULL,
	"token_endpoint_auth_method" varchar(32) DEFAULT 'none' NOT NULL,
	"registration_type" varchar(8) NOT NULL,
	"metadata_fetched_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_clients_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "oauth_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"state" varchar(64) NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "oauth_states_state_unique" UNIQUE("state")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "oauth_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"client_id" varchar(512) NOT NULL,
	"access_token_hash" varchar(64) NOT NULL,
	"refresh_token_hash" varchar(64),
	"scopes" text[] NOT NULL,
	"resource" varchar(1024),
	"access_token_expires_at" timestamp NOT NULL,
	"refresh_token_expires_at" timestamp,
	"rotated_at" timestamp,
	"revoked_at" timestamp,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_tokens_access_token_hash_unique" UNIQUE("access_token_hash"),
	CONSTRAINT "oauth_tokens_refresh_token_hash_unique" UNIQUE("refresh_token_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh_key" text NOT NULL,
	"auth_key" text NOT NULL,
	"expiration_time" bigint,
	"user_agent" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "releases" (
	"id" text PRIMARY KEY NOT NULL,
	"version" text NOT NULL,
	"platform" text NOT NULL,
	"download_url" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_name" text NOT NULL,
	"sha256" text,
	"signature" text,
	"updater_url" text,
	"release_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rollover_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timezone" varchar(50) NOT NULL,
	"rollover_date" date NOT NULL,
	"users_processed" integer DEFAULT 0 NOT NULL,
	"tasks_rolled_over" integer DEFAULT 0 NOT NULL,
	"executed_at" timestamp DEFAULT now() NOT NULL,
	"duration_ms" integer,
	"status" varchar(20) DEFAULT 'completed' NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subtasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE IF NOT EXISTS "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"notes" text,
	"scheduled_date" date,
	"estimated_mins" integer,
	"actual_mins" integer DEFAULT 0,
	"priority" varchar(2) DEFAULT 'P2' NOT NULL,
	"completed_at" timestamp,
	"position" integer DEFAULT 0 NOT NULL,
	"subtasks_hidden" boolean DEFAULT false NOT NULL,
	"series_id" uuid,
	"series_instance_number" integer,
	"timer_started_at" timestamp,
	"timer_accumulated_seconds" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "time_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"task_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" varchar(1000),
	"date" date NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"duration_mins" integer NOT NULL,
	"color" varchar(7) DEFAULT '#3B82F6',
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(255),
	"avatar_url" varchar(500),
	"timezone" varchar(50) DEFAULT 'UTC',
	"password_reset_token" varchar(255),
	"password_reset_expires" timestamp,
	"preferences" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attachments" ADD CONSTRAINT "attachments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attachments" ADD CONSTRAINT "attachments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "calendar_accounts" ADD CONSTRAINT "calendar_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_calendar_id_calendars_id_fk" FOREIGN KEY ("calendar_id") REFERENCES "public"."calendars"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "calendars" ADD CONSTRAINT "calendars_account_id_calendar_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."calendar_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "calendars" ADD CONSTRAINT "calendars_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "idea_boards" ADD CONSTRAINT "idea_boards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "idea_columns" ADD CONSTRAINT "idea_columns_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "idea_columns" ADD CONSTRAINT "idea_columns_board_id_idea_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."idea_boards"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "idea_subtasks" ADD CONSTRAINT "idea_subtasks_idea_id_ideas_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."ideas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ideas" ADD CONSTRAINT "ideas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ideas" ADD CONSTRAINT "ideas_board_id_idea_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."idea_boards"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ideas" ADD CONSTRAINT "ideas_column_id_idea_columns_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."idea_columns"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ideas" ADD CONSTRAINT "ideas_promoted_task_id_tasks_id_fk" FOREIGN KEY ("promoted_task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "oauth_authorization_codes" ADD CONSTRAINT "oauth_authorization_codes_client_id_oauth_clients_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oauth_clients"("client_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "oauth_authorization_codes" ADD CONSTRAINT "oauth_authorization_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "oauth_states" ADD CONSTRAINT "oauth_states_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "oauth_tokens" ADD CONSTRAINT "oauth_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "oauth_tokens" ADD CONSTRAINT "oauth_tokens_client_id_oauth_clients_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oauth_clients"("client_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subtasks" ADD CONSTRAINT "subtasks_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_series" ADD CONSTRAINT "task_series_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_series_id_task_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."task_series"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "time_blocks" ADD CONSTRAINT "time_blocks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "time_blocks" ADD CONSTRAINT "time_blocks_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_keys_user_id_idx" ON "api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_keys_key_prefix_idx" ON "api_keys" USING btree ("key_prefix");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attachments_task_id_idx" ON "attachments" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attachments_user_id_idx" ON "attachments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendar_accounts_user_id_idx" ON "calendar_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendar_accounts_webhook_sub_idx" ON "calendar_accounts" USING btree ("webhook_subscription_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendar_events_user_time_idx" ON "calendar_events" USING btree ("user_id","start_time","end_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendar_events_calendar_external_idx" ON "calendar_events" USING btree ("calendar_id","external_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendar_events_calendar_idx" ON "calendar_events" USING btree ("calendar_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendars_user_idx" ON "calendars" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendars_account_idx" ON "calendars" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendars_account_external_idx" ON "calendars" USING btree ("account_id","external_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendars_watch_channel_idx" ON "calendars" USING btree ("watch_channel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendars_watch_expires_idx" ON "calendars" USING btree ("watch_expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idea_boards_user_idx" ON "idea_boards" USING btree ("user_id","position");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idea_columns_board_idx" ON "idea_columns" USING btree ("board_id","position");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idea_columns_user_idx" ON "idea_columns" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idea_subtasks_idea_id_idx" ON "idea_subtasks" USING btree ("idea_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ideas_column_idx" ON "ideas" USING btree ("column_id","position");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ideas_board_idx" ON "ideas" USING btree ("board_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ideas_user_idx" ON "ideas" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "oauth_codes_expires_at_idx" ON "oauth_authorization_codes" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "oauth_states_state_idx" ON "oauth_states" USING btree ("state");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "oauth_states_expires_at_idx" ON "oauth_states" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "oauth_tokens_user_id_idx" ON "oauth_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "oauth_tokens_family_id_idx" ON "oauth_tokens" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "push_subscriptions_user_id_idx" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "rollover_logs_tz_date_idx" ON "rollover_logs" USING btree ("timezone","rollover_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subtasks_task_id_idx" ON "subtasks" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_series_user_active_idx" ON "task_series" USING btree ("user_id") WHERE "task_series"."is_active" = true;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_series_generation_idx" ON "task_series" USING btree ("is_active","last_generated_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_user_scheduled_incomplete_idx" ON "tasks" USING btree ("user_id","scheduled_date") WHERE "tasks"."completed_at" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_series_idx" ON "tasks" USING btree ("series_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tasks_series_date_unique_idx" ON "tasks" USING btree ("series_id","scheduled_date") WHERE "tasks"."series_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_active_timer_idx" ON "tasks" USING btree ("user_id") WHERE "tasks"."timer_started_at" IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "time_blocks_user_date_idx" ON "time_blocks" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "time_blocks_task_id_idx" ON "time_blocks" USING btree ("task_id");