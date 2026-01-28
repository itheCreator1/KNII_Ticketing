-- Migration 023: Convert departments.floor from CHECK constraint to foreign key
-- This allows floors to be managed dynamically and enables cascading updates

-- Remove the hardcoded CHECK constraint
ALTER TABLE departments
DROP CONSTRAINT departments_floor_check;

-- Add foreign key constraint referencing the floors table
ALTER TABLE departments
ADD CONSTRAINT fk_departments_floor
FOREIGN KEY (floor) REFERENCES floors(name)
ON UPDATE CASCADE
ON DELETE RESTRICT;
