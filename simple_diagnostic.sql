-- Simple Database Diagnostic Script
-- This will help us understand what's happening

-- Test 1: Basic connection and current database
SELECT current_database() as current_db;
SELECT current_user as current_user;
SELECT current_schema as current_schema;

-- Test 2: Can we see any tables at all?
SELECT 'Testing basic table access...' as message;
SELECT count(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Test 3: List all tables in public schema
SELECT 'Listing all tables in public schema:' as message;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Test 4: Try to access the tasks table directly
SELECT 'Testing direct access to tasks table:' as message;
SELECT count(*) as tasks_count FROM tasks;

-- Test 5: Check if we can see the tasks table structure
SELECT 'Testing tasks table structure access:' as message;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
LIMIT 5;

-- Test 6: Simple insert test (this should work if permissions are correct)
SELECT 'Testing basic insert capability...' as message;
INSERT INTO task_priorities (name, weight, color) VALUES
    ('Test Priority', 99, '#000000')
ON CONFLICT (name) DO NOTHING;

SELECT 'Test priority inserted successfully' as result;

-- Test 7: Verify the insert worked
SELECT 'Verifying insert worked:' as message;
SELECT name, weight, color 
FROM task_priorities 
WHERE name = 'Test Priority';

-- Test 8: Clean up test data
SELECT 'Cleaning up test data...' as message;
DELETE FROM task_priorities WHERE name = 'Test Priority';

SELECT 'Test priority removed successfully' as result;

SELECT '=== DIAGNOSTIC COMPLETED ===' as final_message;
