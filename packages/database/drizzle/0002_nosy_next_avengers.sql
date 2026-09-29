ALTER TABLE "calendar_events" ADD COLUMN IF NOT EXISTS "attendees" jsonb;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD COLUMN IF NOT EXISTS "conference_url" varchar(1000);
--> statement-breakpoint
UPDATE "calendars" SET "sync_token" = NULL;
--> statement-breakpoint
UPDATE "calendar_accounts" SET "sync_token" = NULL;
