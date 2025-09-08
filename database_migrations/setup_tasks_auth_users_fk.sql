-- Setup Tasks Foreign Key to Auth.Users
-- This script sets up the proper foreign key constraint to link tasks.assigneeId to auth.users

-- =====================================================
-- STEP 1: CREATE UNIQUE CONSTRAINT ON AUTH.USERS.EMAIL
-- =====================================================

-- First, we need to ensure auth.users.email has a unique constraint
-- This is required for foreign key references
ALTER TABLE auth.users ADD CONSTRAINT users_email_unique UNIQUE (email);

-- =====================================================
-- STEP 2: ADD FOREIGN KEY CONSTRAINT
-- =====================================================

-- Add foreign key constraint linking tasks.assigneeId to auth.users.email
-- This allows you to assign tasks to coaches by their email address
ALTER TABLE tasks ADD CONSTRAINT tasks_assigneeId_fkey 
FOREIGN KEY ("assigneeId") REFERENCES auth.users (email) 
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

-- Test inserting a task with a valid auth.users email
INSERT INTO tasks (
    name, 
    description, 
    "priorityId", 
    status, 
    "createdBy", 
    "updatedBy",
    "assigneeId"
) VALUES (
    'Test Task - With Auth Users FK', 
    'Testing with auth.users foreign key constraint', 
    1, 
    'TODO', 
    'andrew@lkrmsports.com', 
    'andrew@lkrmsports.com',
    'andrew@lkrmsports.com'  -- This should match an email in auth.users
) RETURNING *;

-- =====================================================
-- STEP 5: CLEANUP TEST DATA
-- =====================================================

-- Remove the test task
DELETE FROM tasks WHERE name = 'Test Task - With Auth Users FK';

-- =====================================================
-- STEP 6: VERIFY AUTH.USERS UNIQUE CONSTRAINT
-- =====================================================

-- Check that the unique constraint was created
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
AND tc.table_name = 'users'
ORDER BY tc.constraint_name;

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

/*
Now you can assign tasks to coaches like this:

-- Assign task to andrew@lkrmsports.com
INSERT INTO tasks (name, description, "priorityId", status, "createdBy", "updatedBy", "assigneeId")
VALUES ('Coach Task', 'Task for coach', 1, 'TODO', 'andrew@lkrmsports.com', 'andrew@lkrmsports.com', 'andrew@lkrmsports.com');

-- Assign task to andrew@nettaworks.com  
INSERT INTO tasks (name, description, "priorityId", status, "createdBy", "updatedBy", "assigneeId")
VALUES ('Another Task', 'Task for another coach', 2, 'TODO', 'andrew@lkrmsports.com', 'andrew@lkrmsports.com', 'andrew@nettaworks.com');

-- Query tasks with coach information
SELECT 
    t.*,
    au.email as coach_email,
    au.created_at as coach_created_at
FROM tasks t
LEFT JOIN auth.users au ON t."assigneeId" = au.email;
*/
