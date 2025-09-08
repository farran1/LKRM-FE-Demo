-- Add repeatType column to events table
ALTER TABLE events ADD COLUMN "repeatType" text DEFAULT 'weekly';

-- Add constraint to ensure valid repeat types
ALTER TABLE events ADD CONSTRAINT events_repeat_type_check 
CHECK ("repeatType" IN ('daily', 'weekly', 'monthly', 'yearly'));

-- Update existing repeating events to have weekly as default
UPDATE events 
SET "repeatType" = 'weekly' 
WHERE "isRepeat" = true AND "repeatType" IS NULL;
