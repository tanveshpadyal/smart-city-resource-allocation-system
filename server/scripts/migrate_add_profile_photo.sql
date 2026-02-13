-- Adds profile photo storage to users table.
-- Safe to re-run.

ALTER TABLE "Users"
ADD COLUMN IF NOT EXISTS "profile_photo" TEXT;
