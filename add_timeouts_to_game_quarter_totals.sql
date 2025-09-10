-- Add timeouts column to game_quarter_totals table
-- This migration adds a timeouts column to track timeouts taken per quarter

ALTER TABLE game_quarter_totals 
ADD COLUMN timeouts INTEGER DEFAULT 0;

-- Add a comment to document the column
COMMENT ON COLUMN game_quarter_totals.timeouts IS 'Number of timeouts taken in this quarter';

-- Optional: Update existing rows to have 0 timeouts (they already default to 0)
-- UPDATE game_quarter_totals SET timeouts = 0 WHERE timeouts IS NULL;
