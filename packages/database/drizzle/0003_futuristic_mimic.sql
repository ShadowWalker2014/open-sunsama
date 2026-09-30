CREATE TABLE IF NOT EXISTS "integration_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(32) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"label" varchar(255) NOT NULL,
	"credentials_encrypted" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task_external_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"account_id" uuid,
	"provider" varchar(32) NOT NULL,
	"external_id" varchar(255) NOT NULL,
	"external_url" text,
	"kind" varchar(32) DEFAULT 'task' NOT NULL,
	"role" varchar(16) DEFAULT 'reference' NOT NULL,
	"status" varchar(16) DEFAULT 'active' NOT NULL,
	"remote_updated_at" timestamp,
	"remote_meta" jsonb,
	"last_refreshed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "integration_accounts" ADD CONSTRAINT "integration_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_external_links" ADD CONSTRAINT "task_external_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_external_links" ADD CONSTRAINT "task_external_links_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_external_links" ADD CONSTRAINT "task_external_links_account_id_integration_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."integration_accounts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "integration_accounts_user_id_idx" ON "integration_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "integration_accounts_user_provider_account_idx" ON "integration_accounts" USING btree ("user_id","provider","provider_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "task_external_links_account_external_idx" ON "task_external_links" USING btree ("account_id","provider","external_id") WHERE "task_external_links"."account_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "task_external_links_single_source_idx" ON "task_external_links" USING btree ("task_id") WHERE "task_external_links"."role" = 'source';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_external_links_task_idx" ON "task_external_links" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_external_links_user_provider_idx" ON "task_external_links" USING btree ("user_id","provider","status");