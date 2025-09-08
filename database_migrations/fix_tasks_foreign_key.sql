-- Fix Tasks Table Foreign Key Issues
-- This script removes the problematic foreign key constraint that references the users table

-- =====================================================
-- STEP 1: REMOVE PROBLEMATIC FOREIGN KEY
-- =====================================================

-- Drop the foreign key constraint that references the users table
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assigneeId_fkey;

-- =====================================================
-- STEP 2: VERIFY THE CHANGE
-- =====================================================

-- Check the current constraints on the tasks table
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
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
AND tc.table_name='tasks';

-- =====================================================
-- STEP 3: CHECK COLUMN TYPES
-- =====================================================

-- Verify that createdBy and updatedBy are character varying
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('createdBy', 'updatedBy', 'assigneeId')
ORDER BY column_name;

-- =====================================================
-- STEP 4: TEST TASK CREATION
-- =====================================================

-- Test inserting a task with the new format
INSERT INTO tasks (
    name, 
    description, 
    "priorityId", 
    status, 
    "createdBy", 
    "updatedBy"
) VALUES (
    'Test Task', 
    'Testing the new schema', 
    1, 
    'TODO', 
    'andrew@lkrmsports.com', 
    'andrew@lkrmsports.com'
) RETURNING *;

-- =====================================================
-- STEP 5: CLEANUP TEST DATA
-- =====================================================

-- Remove the test task
DELETE FROM tasks WHERE name = 'Test Task';

-- =====================================================
-- STEP 6: UPDATE DEFAULT VALUES (Optional)
-- =====================================================

-- Update the default values to be more meaningful
ALTER TABLE tasks ALTER COLUMN "createdBy" SET DEFAULT 'system@lkrmsports.com';
ALTER TABLE tasks ALTER COLUMN "updatedBy" SET DEFAULT 'system@lkrmsports.com';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Final verification
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('createdBy', 'updatedBy', 'assigneeId')
ORDER BY column_name;
