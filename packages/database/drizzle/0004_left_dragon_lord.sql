ALTER TABLE "oauth_states" ADD COLUMN IF NOT EXISTS "account_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "oauth_states" ADD CONSTRAINT "oauth_states_account_id_calendar_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."calendar_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
