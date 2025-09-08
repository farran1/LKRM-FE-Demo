-- Setup Tasks Foreign Key to Auth.Users (UUID Version)
-- This script sets up the foreign key constraint using UUIDs instead of emails

-- =====================================================
-- STEP 1: MODIFY ASSIGNEEID COLUMN TO UUID TYPE
-- =====================================================

-- First, we need to change assigneeId from text to UUID type
-- This is required to reference auth.users.id (which is UUID)

-- Add a temporary column
ALTER TABLE tasks ADD COLUMN "assigneeId_temp" uuid;

-- Update existing data (you'll need to map emails to UUIDs)
-- For now, we'll set them to NULL - you can update them manually
UPDATE tasks SET "assigneeId_temp" = NULL;

-- Drop the old column and rename the new one
ALTER TABLE tasks DROP COLUMN "assigneeId";
ALTER TABLE tasks RENAME COLUMN "assigneeId_temp" TO "assigneeId";

-- =====================================================
-- STEP 2: ADD FOREIGN KEY CONSTRAINT
-- =====================================================

-- Add foreign key constraint linking tasks.assigneeId to auth.users.id
-- This allows you to assign tasks to coaches by their UUID
ALTER TABLE tasks ADD CONSTRAINT tasks_assigneeId_fkey 
FOREIGN KEY ("assigneeId") REFERENCES auth.users (id) 
ON UPDATE CASCADE ON DELETE SET NULL;

-- =====================================================
-- STEP 3: VERIFY THE CONSTRAINT
-- =====================================================

-- Check that the foreign key constraint is properly set up
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_schema_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='tasks'
AND tc.constraint_name = 'tasks_assigneeId_fkey';

-- =====================================================
-- STEP 4: TEST THE CONSTRAINT
-- =====================================================

-- Test inserting a task with a valid auth.users UUID
-- Replace with actual UUID from your auth.users table
INSERT INTO tasks (
    name, 
    description, 
    "priorityId", 
    status, 
    "createdBy", 
    "updatedBy",
    "assigneeId"
) VALUES (
    'Test Task - With UUID FK', 
    'Testing with UUID foreign key constraint', 
    1, 
    'TODO', 
    'andrew@lkrmsports.com', 
    'andrew@lkrmsports.com',
    '618e4250-9f37-41aa-bae3-2dc1086ef2e3'  -- UUID from auth.users
) RETURNING *;

-- =====================================================
-- STEP 5: CLEANUP TEST DATA
-- =====================================================

-- Remove the test task
DELETE FROM tasks WHERE name = 'Test Task - With UUID FK';

-- =====================================================
-- STEP 6: CHECK COLUMN TYPE
-- =====================================================

-- Verify that assigneeId is now UUID type
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name = 'assigneeId';

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

/*
Now you can assign tasks to coaches like this:

-- Get the UUID for a coach
SELECT id, email FROM auth.users WHERE email = 'andrew@lkrmsports.com';

-- Assign task using UUID
INSERT INTO tasks (name, description, "priorityId", status, "createdBy", "updatedBy", "assigneeId")
VALUES ('Coach Task', 'Task for coach', 1, 'TODO', 'andrew@lkrmsports.com', 'andrew@lkrmsports.com', '618e4250-9f37-41aa-bae3-2dc1086ef2e3');

-- Query tasks with coach information
SELECT 
    t.*,
    au.email as coach_email,
    au.created_at as coach_created_at
FROM tasks t
LEFT JOIN auth.users au ON t."assigneeId" = au.id;
*/
