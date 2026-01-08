-- Migration: Add is_admin_created flag to tickets table
-- Purpose: Track admin-created tickets for visibility filtering
-- Date: 2026-01-08
-- Version: v2.3.0

-- Step 1: Add is_admin_created column as nullable first (safe operation)
ALTER TABLE tickets
ADD COLUMN is_admin_created BOOLEAN;

-- Step 2: Backfill existing tickets
-- Department-created tickets: is_admin_created = false (have reporter_id and not Internal dept)
UPDATE tickets
SET is_admin_created = false
WHERE reporter_id IS NOT NULL AND reporter_department != 'Internal';

-- Admin-created tickets: is_admin_created = true (Internal dept or legacy tickets with no reporter_id)
UPDATE tickets
SET is_admin_created = true
WHERE reporter_department = 'Internal' OR reporter_id IS NULL;

-- Step 3: Add NOT NULL constraint after backfill
ALTER TABLE tickets
ALTER COLUMN is_admin_created SET NOT NULL;

-- Step 4: Set default for new records
ALTER TABLE tickets
ALTER COLUMN is_admin_created SET DEFAULT false;

-- Step 5: Add index for performance (department user queries filter on this)
CREATE INDEX idx_tickets_is_admin_created ON tickets(is_admin_created);

-- Verification queries (run after migration):
-- SELECT is_admin_created, COUNT(*) FROM tickets GROUP BY is_admin_created;
-- SELECT id, reporter_department, is_admin_created, reporter_id FROM tickets LIMIT 20;
