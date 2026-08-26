ALTER TABLE "ideas" ADD COLUMN "estimated_mins" integer;--> statement-breakpoint
ALTER TABLE "ideas" ADD COLUMN "priority" varchar(2) DEFAULT 'P2' NOT NULL;