-- Migrate events.createdBy from public.users integer IDs to auth.users UUIDs
-- This migration assumes that public.users.id = 1 corresponds to the main LKRM user

-- Step 1: Add a temporary column to store the UUID values
ALTER TABLE events ADD COLUMN "createdBy_uuid" uuid;

-- Step 2: Map the integer IDs to UUIDs
-- Map public.users.id = 1 to the main LKRM user UUID
UPDATE events 
SET "createdBy_uuid" = '618e4250-9f37-41aa-bae3-2dc1086ef2e3'::uuid
WHERE "createdBy" = 1;

-- Step 3: Drop the old integer column
ALTER TABLE events DROP COLUMN "createdBy";

-- Step 4: Rename the UUID column to the original name
ALTER TABLE events RENAME COLUMN "createdBy_uuid" TO "createdBy";

-- Step 5: Make the column NOT NULL (since all existing records should have been updated)
ALTER TABLE events ALTER COLUMN "createdBy" SET NOT NULL;

-- Step 6: Add a foreign key constraint to auth.users
ALTER TABLE events 
ADD CONSTRAINT events_createdby_fkey 
FOREIGN KEY ("createdBy") REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 7: Add comment to explain the column
COMMENT ON COLUMN events."createdBy" IS 'References auth.users.id - the user who created this event';

-- Step 8: Do the same for updatedBy column
ALTER TABLE events ADD COLUMN "updatedBy_uuid" uuid;

UPDATE events 
SET "updatedBy_uuid" = '618e4250-9f37-41aa-bae3-2dc1086ef2e3'::uuid
WHERE "updatedBy" = 1;

ALTER TABLE events DROP COLUMN "updatedBy";
ALTER TABLE events RENAME COLUMN "updatedBy_uuid" TO "updatedBy";
ALTER TABLE events ALTER COLUMN "updatedBy" SET NOT NULL;

ALTER TABLE events 
ADD CONSTRAINT events_updatedby_fkey 
FOREIGN KEY ("updatedBy") REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN events."updatedBy" IS 'References auth.users.id - the user who last updated this event';
