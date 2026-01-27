-- Migration 021: Fix audit_logs foreign key constraint to allow user deletion
-- Audit logs are historical records and should persist even after user deletion
-- With this change, deleted users' audit logs will have actor_id set to NULL

-- Drop existing constraint (defaults to RESTRICT, preventing user deletion)
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_actor_id_fkey;

-- Re-add constraint with ON DELETE SET NULL behavior
-- This allows users to be deleted while preserving the audit trail
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_actor_id_fkey
  FOREIGN KEY (actor_id)
  REFERENCES users(id)
  ON DELETE SET NULL;

-- Add comment explaining the constraint behavior for future reference
COMMENT ON CONSTRAINT audit_logs_actor_id_fkey ON audit_logs IS
  'Sets actor_id to NULL when referenced user is deleted, preserving audit trail for compliance';
