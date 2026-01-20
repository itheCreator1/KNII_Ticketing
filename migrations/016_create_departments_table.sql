-- Migration: 016_create_departments_table.sql
-- Description: Transform departments from hardcoded constants to database-driven system
-- Adds departments table, migrates CHECK constraints to foreign keys with CASCADE/RESTRICT

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add index on active status for efficient filtering
CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(active);

-- Seed system department only (regular departments seeded via seed-hospital-data.js script)
INSERT INTO departments (name, description, is_system, active) VALUES
  ('Internal', 'System department for admin-only tickets', true, true)
ON CONFLICT (name) DO NOTHING;

-- Drop old CHECK constraints (replaced by foreign keys)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_department_check;
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_reporter_department_check;

-- Add foreign key constraint to users table
-- ON DELETE RESTRICT: Prevents deletion of departments with assigned users
-- ON UPDATE CASCADE: Automatically updates user.department when department.name changes
ALTER TABLE users ADD CONSTRAINT users_department_fk
  FOREIGN KEY (department) REFERENCES departments(name)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add foreign key constraint to tickets table
-- ON DELETE RESTRICT: Prevents deletion of departments with existing tickets
-- ON UPDATE CASCADE: Automatically updates ticket.reporter_department when department.name changes
ALTER TABLE tickets ADD CONSTRAINT tickets_reporter_department_fk
  FOREIGN KEY (reporter_department) REFERENCES departments(name)
  ON DELETE RESTRICT ON UPDATE CASCADE;
