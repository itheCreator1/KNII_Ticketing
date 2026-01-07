-- Migration 011: Add workflow statuses to tickets table
-- Date: 2026-01-07
-- Description: Adds 'waiting_on_admin' and 'waiting_on_department' statuses to support
--              a bidirectional workflow between admins and department users. These statuses
--              enable clear communication about who needs to take action on a ticket.

-- Drop existing CHECK constraint on status
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;

-- Add new CHECK constraint including workflow statuses
ALTER TABLE tickets ADD CONSTRAINT tickets_status_check
  CHECK (status IN ('open', 'in_progress', 'closed', 'waiting_on_admin', 'waiting_on_department'));

-- Add comment for documentation
COMMENT ON COLUMN tickets.status IS 'Ticket status: open (newly created), in_progress (being worked on), closed (resolved), waiting_on_admin (department waiting for admin response), waiting_on_department (admin waiting for department response)';

-- Create index for improved query performance on workflow statuses
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
