-- Assign Foreign Key to Auth.Users Table
-- This script shows how to manually assign the foreign key constraint to auth.users

-- =====================================================
-- STEP 1: CHECK AUTH.USERS TABLE STRUCTURE
-- =====================================================

-- Check what columns exist in auth.users and their constraints
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- Check unique constraints on auth.users
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
-- STEP 2: REMOVE EXISTING FOREIGN KEY
-- =====================================================

-- Remove the existing foreign key constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assigneeId_fkey;

-- =====================================================
-- STEP 3: ADD FOREIGN KEY TO AUTH.USERS
-- =====================================================

-- Option A: If you want to reference auth.users.email (most common)
-- Uncomment the following line if auth.users.email has a unique constraint:
-- ALTER TABLE tasks ADD CONSTRAINT tasks_assigneeId_fkey 
-- FOREIGN KEY ("assigneeId") REFERENCES auth.users (email) 
-- ON UPDATE CASCADE ON DELETE SET NULL;

-- Option B: If you want to reference auth.users.id (UUID)
-- Uncomment the following line if you want to use UUIDs:
-- ALTER TABLE tasks ADD CONSTRAINT tasks_assigneeId_fkey 
-- FOREIGN KEY ("assigneeId") REFERENCES auth.users (id) 
-- ON UPDATE CASCADE ON DELETE SET NULL;

-- =====================================================
-- STEP 4: VERIFY THE NEW CONSTRAINT
-- =====================================================

-- Check that the new foreign key constraint is in place
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
-- STEP 5: TEST THE NEW CONSTRAINT
-- =====================================================

-- Test inserting a task with a valid auth.users reference
-- Replace 'your-email@example.com' with an actual email from auth.users
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
    'Testing with auth.users foreign key', 
    1, 
    'TODO', 
    'andrew@lkrmsports.com', 
    'andrew@lkrmsports.com',
    'andrew@lkrmsports.com'  -- This should match an email in auth.users
) RETURNING *;

-- =====================================================
-- STEP 6: CLEANUP TEST DATA
-- =====================================================

-- Remove the test task
DELETE FROM tasks WHERE name = 'Test Task - With Auth Users FK';

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================

/*
IMPORTANT CONSIDERATIONS:

1. AUTH.USERS EMAIL CONSTRAINT:
   - auth.users.email might not have a unique constraint
   - You may need to create one first: ALTER TABLE auth.users ADD CONSTRAINT users_email_unique UNIQUE (email);

2. DATA TYPE COMPATIBILITY:
   - If assigneeId is text and auth.users.email is text, that's fine
   - If assigneeId is text and auth.users.id is UUID, you'll need to change assigneeId to UUID type

3. EXISTING DATA:
   - Make sure all existing assigneeId values in tasks table match values in auth.users
   - You may need to update existing data before adding the constraint

4. PERFORMANCE:
   - Foreign key constraints can impact performance
   - Consider if you really need referential integrity for assigneeId

RECOMMENDED APPROACH:
- Remove the foreign key entirely (use fix_assignee_foreign_key.sql)
- Store assigneeId as a simple text field
- Validate assigneeId in your application code instead of database constraints
*/
