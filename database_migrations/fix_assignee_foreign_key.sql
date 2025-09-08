-- Fix Assignee Foreign Key Constraint
-- This script provides options to fix the tasks.assigneeId foreign key issue

-- =====================================================
-- OPTION 1: REMOVE FOREIGN KEY ENTIRELY (RECOMMENDED)
-- =====================================================

-- This is the safest option since we're phasing out the users table
-- and assigneeId can just be a text field storing usernames/emails

-- Drop the problematic foreign key constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assigneeId_fkey;

-- Verify the constraint is removed
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
AND tc.table_name='tasks'
AND tc.constraint_name = 'tasks_assigneeId_fkey';

-- =====================================================
-- OPTION 2: CHANGE TO REFERENCE AUTH.USERS (ALTERNATIVE)
-- =====================================================

-- Uncomment the following lines if you want to keep a foreign key constraint
-- that references the auth.users table instead

/*
-- First, check if auth.users has a unique constraint on email
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    tc.constraint_type
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
AND tc.table_schema = 'auth'
AND tc.table_name = 'users';

-- If auth.users has a unique constraint on email, you can add a foreign key like this:
-- ALTER TABLE tasks ADD CONSTRAINT tasks_assigneeId_fkey 
-- FOREIGN KEY ("assigneeId") REFERENCES auth.users (email) 
-- ON UPDATE CASCADE ON DELETE SET NULL;
*/

-- =====================================================
-- TEST THE FIX
-- =====================================================

-- Test inserting a task with assigneeId as a text field
INSERT INTO tasks (
    name, 
    description, 
    "priorityId", 
    status, 
    "createdBy", 
    "updatedBy",
    "assigneeId"
) VALUES (
    'Test Task - No Foreign Key', 
    'Testing without foreign key constraint', 
    1, 
    'TODO', 
    'andrew@lkrmsports.com', 
    'andrew@lkrmsports.com',
    'andrew@lkrmsports.com'
) RETURNING *;

-- =====================================================
-- CLEANUP TEST DATA
-- =====================================================

-- Remove the test task
DELETE FROM tasks WHERE name = 'Test Task - No Foreign Key';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check that the foreign key constraint is gone
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

-- Check the assigneeId column type
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name = 'assigneeId';
