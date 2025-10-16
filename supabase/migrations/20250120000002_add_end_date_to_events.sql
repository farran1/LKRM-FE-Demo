-- Add endDate column to events table for recurring events
ALTER TABLE events ADD COLUMN "endDate" timestamp without time zone DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN events."endDate" IS 'End date for recurring events when using "Ends On" option. NULL means no end date or "Never" option.';

-- Add index for performance when filtering by end date
CREATE INDEX idx_events_end_date ON events("endDate") WHERE "endDate" IS NOT NULL;
