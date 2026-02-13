-- Adds SLA breach tracking to complaints table.
-- Safe to re-run.

ALTER TABLE "Requests"
ADD COLUMN IF NOT EXISTS "slaBreached" BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS "requests_sla_breached"
ON "Requests" ("slaBreached");
