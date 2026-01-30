-- Add actual_mins column to tasks table for tracking time spent in focus mode
ALTER TABLE "tasks" ADD COLUMN "actual_mins" integer DEFAULT 0;
