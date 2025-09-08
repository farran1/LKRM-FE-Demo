-- Add daysOfWeek column to events table to store specific days for weekly repeats
ALTER TABLE events ADD COLUMN "daysOfWeek" integer[] DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN events."daysOfWeek" IS 'Array of integers (0-6) representing days of the week for weekly repeats. 0=Sunday, 1=Monday, etc.';
