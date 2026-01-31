CREATE TABLE IF NOT EXISTS "releases" (
	"id" text PRIMARY KEY NOT NULL,
	"version" text NOT NULL,
	"platform" text NOT NULL,
	"download_url" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_name" text NOT NULL,
	"sha256" text,
	"release_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
