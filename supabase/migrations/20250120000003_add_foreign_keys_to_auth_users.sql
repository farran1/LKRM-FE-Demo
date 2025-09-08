-- Add foreign key constraints to auth.users after public.users was deleted with CASCADE
-- This migration adds the foreign key constraints that were lost when public.users was deleted

-- Add foreign key constraint for createdBy
ALTER TABLE events 
ADD CONSTRAINT events_createdby_fkey 
FOREIGN KEY ("createdBy") REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add foreign key constraint for updatedBy  
ALTER TABLE events 
ADD CONSTRAINT events_updatedby_fkey 
FOREIGN KEY ("updatedBy") REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add comments to explain the columns
COMMENT ON COLUMN events."createdBy" IS 'References auth.users.id - the user who created this event';
COMMENT ON COLUMN events."updatedBy" IS 'References auth.users.id - the user who last updated this event';
