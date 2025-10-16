-- Make location field nullable for meetings
-- This allows meetings to be created without requiring HOME/AWAY location

-- First, we need to modify the location column to be nullable
ALTER TABLE events ALTER COLUMN location DROP NOT NULL;

-- Add a comment to explain the change
COMMENT ON COLUMN events.location IS 'Location for the event (HOME/AWAY). NULL for meetings and other non-location events.';

-- Update the Prisma schema enum to include NULL option
-- Note: This is a database-level change, the Prisma schema will need to be updated separately
