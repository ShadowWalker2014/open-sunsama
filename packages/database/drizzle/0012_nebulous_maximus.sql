ALTER TABLE "calendars" ADD COLUMN "watch_channel_id" varchar(255);--> statement-breakpoint
ALTER TABLE "calendars" ADD COLUMN "watch_resource_id" varchar(255);--> statement-breakpoint
ALTER TABLE "calendars" ADD COLUMN "watch_expires_at" timestamp;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendars_watch_channel_idx" ON "calendars" USING btree ("watch_channel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendars_watch_expires_idx" ON "calendars" USING btree ("watch_expires_at");