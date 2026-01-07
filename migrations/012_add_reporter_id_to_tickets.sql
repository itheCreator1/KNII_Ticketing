-- Migration 012: Add reporter_id foreign key to tickets table
-- Date: 2026-01-07
-- Description: Links tickets to department user accounts via reporter_id. This enables
--              ownership-based access control where department users can only view/manage
--              their own tickets. Existing tickets are auto-linked by department name match.
--              Tickets that don't match remain orphaned (reporter_id = NULL) and are only
--              visible to admins.

-- Add reporter_id column (nullable to support orphaned/anonymous tickets)
ALTER TABLE tickets ADD COLUMN reporter_id INTEGER;

-- Add foreign key constraint with SET NULL on delete (preserves tickets if user deleted)
ALTER TABLE tickets ADD CONSTRAINT fk_tickets_reporter_id
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL;

-- Create index for improved query performance on department ticket lookups
CREATE INDEX idx_tickets_reporter_id ON tickets(reporter_id);

-- Add comment for documentation
COMMENT ON COLUMN tickets.reporter_id IS 'Foreign key to users table. Links ticket to department user account. NULL for anonymous/public submissions or orphaned tickets.';

-- Auto-link existing tickets to department accounts by matching reporter_department
-- This is safe and idempotent - only updates tickets where reporter_id is NULL
DO $$
DECLARE
  linked_count INTEGER;
  orphaned_count INTEGER;
BEGIN
  -- Perform auto-linking based on department name match
  UPDATE tickets t
  SET reporter_id = u.id
  FROM users u
  WHERE u.role = 'department'
    AND u.email = CASE t.reporter_department
      WHEN 'IT Support' THEN 'it.support@knii.local'
      WHEN 'General Support' THEN 'general.support@knii.local'
      WHEN 'Human Resources' THEN 'hr@knii.local'
      WHEN 'Finance' THEN 'finance@knii.local'
      WHEN 'Facilities' THEN 'facilities@knii.local'
      ELSE NULL
    END
    AND t.reporter_id IS NULL;

  -- Count results for logging
  SELECT COUNT(*) INTO linked_count FROM tickets WHERE reporter_id IS NOT NULL;
  SELECT COUNT(*) INTO orphaned_count FROM tickets WHERE reporter_id IS NULL;

  -- Log results (visible in psql output)
  RAISE NOTICE 'Auto-linking complete:';
  RAISE NOTICE '  - Linked tickets: %', linked_count;
  RAISE NOTICE '  - Orphaned tickets: %', orphaned_count;
  RAISE NOTICE '  - Total tickets: %', (linked_count + orphaned_count);
END $$;
