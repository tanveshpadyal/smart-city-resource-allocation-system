-- Adds authentication provider and password reset fields.
-- Safe to re-run.

ALTER TABLE "Users"
ADD COLUMN IF NOT EXISTS "auth_provider" VARCHAR(20) NOT NULL DEFAULT 'local';

ALTER TABLE "Users"
ADD COLUMN IF NOT EXISTS "google_id" VARCHAR(255);

ALTER TABLE "Users"
ADD COLUMN IF NOT EXISTS "reset_password_token_hash" TEXT;

ALTER TABLE "Users"
ADD COLUMN IF NOT EXISTS "reset_password_expires_at" TIMESTAMP WITH TIME ZONE;

CREATE UNIQUE INDEX IF NOT EXISTS "users_google_id_unique"
ON "Users" ("google_id")
WHERE "google_id" IS NOT NULL;
