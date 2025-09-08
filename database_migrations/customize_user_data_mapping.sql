-- Custom User Data Mapping Script
-- Use this script to map your existing integer user IDs to actual user emails/names
-- BEFORE running the main migration script

-- =====================================================
-- STEP 1: IDENTIFY YOUR EXISTING USERS
-- =====================================================

-- Check what user IDs exist in your tables
SELECT 'tasks' as table_name, createdBy as user_id, COUNT(*) as count 
FROM tasks 
GROUP BY createdBy
UNION ALL
SELECT 'tasks' as table_name, updatedBy as user_id, COUNT(*) as count 
FROM tasks 
GROUP BY updatedBy
UNION ALL
SELECT 'events' as table_name, createdBy as user_id, COUNT(*) as count 
FROM events 
GROUP BY createdBy
UNION ALL
SELECT 'events' as table_name, updatedBy as user_id, COUNT(*) as count 
FROM events 
GROUP BY updatedBy
UNION ALL
SELECT 'budget_categories' as table_name, createdBy as user_id, COUNT(*) as count 
FROM budget_categories 
GROUP BY createdBy
UNION ALL
SELECT 'budget_categories' as table_name, updatedBy as user_id, COUNT(*) as count 
FROM budget_categories 
GROUP BY updatedBy
UNION ALL
SELECT 'budgets' as table_name, createdBy as user_id, COUNT(*) as count 
FROM budgets 
GROUP BY createdBy
UNION ALL
SELECT 'budgets' as table_name, updatedBy as user_id, COUNT(*) as count 
FROM budgets 
GROUP BY updatedBy
UNION ALL
SELECT 'player_notes' as table_name, createdBy as user_id, COUNT(*) as count 
FROM player_notes 
GROUP BY createdBy
UNION ALL
SELECT 'player_notes' as table_name, updatedBy as user_id, COUNT(*) as count 
FROM player_notes 
GROUP BY updatedBy
UNION ALL
SELECT 'player_goals' as table_name, createdBy as user_id, COUNT(*) as count 
FROM player_goals 
GROUP BY createdBy
UNION ALL
SELECT 'player_goals' as table_name, updatedBy as user_id, COUNT(*) as count 
FROM player_goals 
GROUP BY updatedBy
ORDER BY table_name, user_id;

-- =====================================================
-- STEP 2: CREATE USER MAPPING TABLE
-- =====================================================

-- Create a temporary mapping table for your users
-- CUSTOMIZE THIS SECTION WITH YOUR ACTUAL USER DATA
CREATE TEMP TABLE user_mapping (
    old_id integer PRIMARY KEY,
    email text NOT NULL,
    name text NOT NULL
);

-- Insert your user mappings here
-- Replace these examples with your actual user data
INSERT INTO user_mapping (old_id, email, name) VALUES
    (1, 'andrew@lkrmsports.com', 'Andrew Farrell'),
    (2, 'coach@example.com', 'Coach User'),
    (3, 'assistant@example.com', 'Assistant Coach');
    -- Add more users as needed

-- =====================================================
-- STEP 3: VERIFY YOUR MAPPING
-- =====================================================

-- Check your mapping
SELECT * FROM user_mapping ORDER BY old_id;

-- =====================================================
-- STEP 4: CREATE CUSTOMIZED MIGRATION FUNCTIONS
-- =====================================================

-- Function to get user data for a given ID
CREATE OR REPLACE FUNCTION get_user_data(user_id integer)
RETURNS text AS $$
BEGIN
    RETURN (
        SELECT JSON.stringify(
            json_build_object(
                'id', user_id,
                'email', COALESCE(um.email, 'legacy@user.com'),
                'name', COALESCE(um.name, 'Legacy User')
            )
        )
        FROM user_mapping um
        WHERE um.old_id = user_id
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 5: TEST THE FUNCTION
-- =====================================================

-- Test the function with your user IDs
SELECT 
    old_id,
    get_user_data(old_id) as user_data_json
FROM user_mapping;

-- =====================================================
-- STEP 6: CUSTOMIZED UPDATE QUERIES
-- =====================================================

-- Use these queries in your main migration script instead of the simple CASE statements

-- For tasks table:
/*
UPDATE tasks 
SET 
    createdBy_temp = get_user_data(createdBy),
    updatedBy_temp = get_user_data(updatedBy);
*/

-- For events table:
/*
UPDATE events 
SET 
    createdBy_temp = get_user_data(createdBy),
    updatedBy_temp = get_user_data(updatedBy);
*/

-- For budget_categories table:
/*
UPDATE budget_categories 
SET 
    createdBy_temp = get_user_data(createdBy),
    updatedBy_temp = get_user_data(updatedBy);
*/

-- For budgets table:
/*
UPDATE budgets 
SET 
    createdBy_temp = get_user_data(createdBy),
    updatedBy_temp = get_user_data(updatedBy);
*/

-- For player_notes table:
/*
UPDATE player_notes 
SET 
    createdBy_temp = get_user_data(createdBy),
    updatedBy_temp = get_user_data(updatedBy);
*/

-- For player_goals table:
/*
UPDATE player_goals 
SET 
    createdBy_temp = get_user_data(createdBy),
    updatedBy_temp = get_user_data(updatedBy);
*/

-- =====================================================
-- CLEANUP
-- =====================================================

-- Drop the temporary function and table when done
-- DROP FUNCTION IF EXISTS get_user_data(integer);
-- DROP TABLE IF EXISTS user_mapping;
