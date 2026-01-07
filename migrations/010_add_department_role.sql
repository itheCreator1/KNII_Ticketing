-- Migration 010: Add 'department' role to users table
-- Date: 2026-01-07
-- Description: Adds 'department' as a valid role for users to support department-level
--              access to the client portal. Department users can create and manage tickets
--              for their respective departments.

-- Drop existing CHECK constraint on role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new CHECK constraint including 'department' role
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'super_admin', 'department'));

-- Add comment for documentation
COMMENT ON COLUMN users.role IS 'User role: admin (general admin access), super_admin (full system access including user management), department (department portal access)';
