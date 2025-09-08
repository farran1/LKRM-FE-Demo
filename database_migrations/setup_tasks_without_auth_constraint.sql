-- Setup Tasks Without Auth Constraint
-- This script sets up tasks to work with auth.users without requiring foreign key constraints
-- Since we can't modify auth.users table, we'll use application-level validation

-- =====================================================
-- STEP 1: VERIFY CURRENT TASKS TABLE STRUCTURE
-- =====================================================

-- Check current column types
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
-- STEP 2: TEST TASK CREATION WITHOUT FOREIGN KEY
-- =====================================================

-- Test inserting a task with assigneeId as a text field (no foreign key constraint)
INSERT INTO tasks (
    name, 
    description, 
    "priorityId", 
    status, 
    "createdBy", 
    "updatedBy",
    "assigneeId"
) VALUES (
    'Test Task - No FK Constraint', 
    'Testing without foreign key constraint', 
    1, 
    'TODO', 
    'andrew@lkrmsports.com', 
    'andrew@lkrmsports.com',
    'andrew@lkrmsports.com'  -- Can be any text value
) RETURNING *;

-- =====================================================
-- STEP 3: CLEANUP TEST DATA
-- =====================================================

-- Remove the test task
DELETE FROM tasks WHERE name = 'Test Task - No FK Constraint';

-- =====================================================
-- STEP 4: CREATE HELPER FUNCTIONS FOR VALIDATION
-- =====================================================

-- Create a function to check if an email exists in auth.users
-- This can be used in your application code for validation
CREATE OR REPLACE FUNCTION check_user_exists(user_email text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users WHERE email = user_email
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 5: TEST THE HELPER FUNCTION
-- =====================================================

-- Test the function with existing users
SELECT 
    'andrew@lkrmsports.com' as email,
    check_user_exists('andrew@lkrmsports.com') as exists;

SELECT 
    'andrew@nettaworks.com' as email,
    check_user_exists('andrew@nettaworks.com') as exists;

SELECT 
    'nonexistent@example.com' as email,
    check_user_exists('nonexistent@example.com') as exists;

-- =====================================================
-- STEP 6: CREATE A VIEW FOR TASKS WITH USER INFO
-- =====================================================

-- Create a view that joins tasks with auth.users for easy querying
CREATE OR REPLACE VIEW tasks_with_assignees AS
SELECT 
    t.*,
    au.email as assignee_email,
    au.created_at as assignee_created_at,
    au.raw_user_meta_data as assignee_metadata
FROM tasks t
LEFT JOIN auth.users au ON t."assigneeId" = au.email;

-- =====================================================
-- STEP 7: TEST THE VIEW
-- =====================================================

-- Test the view (should be empty initially)
SELECT * FROM tasks_with_assignees LIMIT 5;

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

/*
Now you can work with tasks like this:

1. CREATE TASKS (with application-level validation):
   -- In your application code, validate the email first:
   SELECT check_user_exists('andrew@lkrmsports.com'); -- Returns true/false
   
   -- Then create the task:
   INSERT INTO tasks (name, description, "priorityId", status, "createdBy", "updatedBy", "assigneeId")
   VALUES ('Coach Task', 'Task for coach', 1, 'TODO', 'andrew@lkrmsports.com', 'andrew@lkrmsports.com', 'andrew@lkrmsports.com');

2. QUERY TASKS WITH ASSIGNEE INFO:
   SELECT * FROM tasks_with_assignees WHERE assignee_email = 'andrew@lkrmsports.com';

3. GET ALL AVAILABLE COACHES:
   SELECT email, created_at FROM auth.users ORDER BY created_at;

4. VALIDATE ASSIGNEE BEFORE CREATING TASK:
   -- In your application code:
   if (check_user_exists(assigneeEmail)) {
       // Create the task
   } else {
       // Show error: "User not found"
   }
*/

-- =====================================================
-- FINAL VERIFICATION
-- =====================================================

-- Check that everything is set up correctly
SELECT 
    'Tasks table ready' as status,
    COUNT(*) as task_count
FROM tasks;

SELECT 
    'Available coaches' as status,
    COUNT(*) as coach_count
FROM auth.users;

SELECT 
    'Helper function ready' as status,
    check_user_exists('andrew@lkrmsports.com') as test_result;
