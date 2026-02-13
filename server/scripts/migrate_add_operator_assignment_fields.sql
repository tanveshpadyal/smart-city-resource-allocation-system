-- Adds operator assignment fields required by latest User model.
-- Safe to re-run.

ALTER TABLE "Users"
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE "Users"
ADD COLUMN IF NOT EXISTS "assignedAreas" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
