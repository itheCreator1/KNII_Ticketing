-- Migration 017: Remove reporter_desk column from tickets table
-- The desk field is no longer needed in the ticket workflow

-- Drop the reporter_desk column and its CHECK constraint
ALTER TABLE tickets DROP COLUMN IF EXISTS reporter_desk;
