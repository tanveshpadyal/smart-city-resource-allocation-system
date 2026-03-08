-- Dispatch/load-balancing schema migration
-- Safe to re-run.

ALTER TABLE "Users"
ADD COLUMN IF NOT EXISTS "max_active_complaints" INTEGER NOT NULL DEFAULT 10;

ALTER TABLE "Users"
ADD COLUMN IF NOT EXISTS "last_assigned_at" TIMESTAMP WITH TIME ZONE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'enum_Requests_assignment_strategy'
  ) THEN
    CREATE TYPE "enum_Requests_assignment_strategy" AS ENUM ('AUTO', 'MANUAL', 'ESCALATED');
  END IF;
END $$;

ALTER TABLE "Requests"
ADD COLUMN IF NOT EXISTS "assignment_strategy" "enum_Requests_assignment_strategy" NOT NULL DEFAULT 'AUTO';

ALTER TABLE "Requests"
ADD COLUMN IF NOT EXISTS "assignment_score" DOUBLE PRECISION;

ALTER TABLE "Requests"
ADD COLUMN IF NOT EXISTS "assignment_reason" TEXT;

ALTER TABLE "Requests"
ADD COLUMN IF NOT EXISTS "location_bucket" VARCHAR(255);

ALTER TABLE "Requests"
ADD COLUMN IF NOT EXISTS "parent_complaint_id" UUID;

ALTER TABLE "Requests"
ADD COLUMN IF NOT EXISTS "reassignment_cooldown_until" TIMESTAMP WITH TIME ZONE;

CREATE TABLE IF NOT EXISTS "ContractorAreas" (
  "id" UUID PRIMARY KEY,
  "contractor_id" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "area_id" UUID NOT NULL REFERENCES "Locations"("id") ON DELETE CASCADE,
  "priority" INTEGER NOT NULL DEFAULT 100,
  "is_primary" BOOLEAN NOT NULL DEFAULT FALSE,
  "weight" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE ("contractor_id", "area_id")
);

CREATE INDEX IF NOT EXISTS "idx_requests_location_bucket" ON "Requests" ("location_bucket");
CREATE INDEX IF NOT EXISTS "idx_requests_parent_complaint_id" ON "Requests" ("parent_complaint_id");
CREATE INDEX IF NOT EXISTS "idx_requests_assignment_strategy" ON "Requests" ("assignment_strategy");
CREATE INDEX IF NOT EXISTS "idx_contractor_areas_area_id" ON "ContractorAreas" ("area_id");
CREATE INDEX IF NOT EXISTS "idx_contractor_areas_contractor_id" ON "ContractorAreas" ("contractor_id");
