-- Migration Script: Update User Tracking Columns to Support Emails/Names
-- This script converts createdBy and updatedBy columns from integer to character varying
-- to support storing user emails, names, or JSON data from auth.users table

-- =====================================================
-- BACKUP EXISTING DATA (Optional but Recommended)
-- =====================================================

-- Create backup tables to preserve existing integer user IDs
-- Uncomment these lines if you want to backup the data first

-- CREATE TABLE tasks_backup AS SELECT * FROM tasks;
-- CREATE TABLE events_backup AS SELECT * FROM events;
-- CREATE TABLE budget_categories_backup AS SELECT * FROM budget_categories;
-- CREATE TABLE budgets_backup AS SELECT * FROM budgets;
-- CREATE TABLE player_notes_backup AS SELECT * FROM player_notes;
-- CREATE TABLE player_goals_backup AS SELECT * FROM player_goals;

-- =====================================================
-- UPDATE TASKS TABLE
-- =====================================================

-- Step 1: Add temporary columns
ALTER TABLE tasks 
ADD COLUMN createdBy_temp character varying,
ADD COLUMN updatedBy_temp character varying;

-- Step 2: Convert existing integer IDs to placeholder values
-- You can customize these placeholder values as needed
UPDATE tasks 
SET 
    createdBy_temp = CASE 
        WHEN createdBy = 1 THEN 'legacy@user.com'
        WHEN createdBy = 2 THEN 'legacy@user.com'
        ELSE 'legacy@user.com'
    END,
    updatedBy_temp = CASE 
        WHEN updatedBy = 1 THEN 'legacy@user.com'
        WHEN updatedBy = 2 THEN 'legacy@user.com'
        ELSE 'legacy@user.com'
    END;

-- Step 3: Drop old columns and rename new ones
ALTER TABLE tasks DROP COLUMN createdBy;
ALTER TABLE tasks DROP COLUMN updatedBy;
ALTER TABLE tasks RENAME COLUMN createdBy_temp TO createdBy;
ALTER TABLE tasks RENAME COLUMN updatedBy_temp TO updatedBy;

-- Step 4: Set NOT NULL constraints
ALTER TABLE tasks ALTER COLUMN createdBy SET NOT NULL;
ALTER TABLE tasks ALTER COLUMN updatedBy SET NOT NULL;

-- =====================================================
-- UPDATE EVENTS TABLE
-- =====================================================

-- Step 1: Add temporary columns
ALTER TABLE events 
ADD COLUMN createdBy_temp character varying,
ADD COLUMN updatedBy_temp character varying;

-- Step 2: Convert existing integer IDs to placeholder values
UPDATE events 
SET 
    createdBy_temp = CASE 
        WHEN createdBy = 1 THEN 'legacy@user.com'
        WHEN createdBy = 2 THEN 'legacy@user.com'
        ELSE 'legacy@user.com'
    END,
    updatedBy_temp = CASE 
        WHEN updatedBy = 1 THEN 'legacy@user.com'
        WHEN updatedBy = 2 THEN 'legacy@user.com'
        ELSE 'legacy@user.com'
    END;

-- Step 3: Drop old columns and rename new ones
ALTER TABLE events DROP COLUMN createdBy;
ALTER TABLE events DROP COLUMN updatedBy;
ALTER TABLE events RENAME COLUMN createdBy_temp TO createdBy;
ALTER TABLE events RENAME COLUMN updatedBy_temp TO updatedBy;

-- Step 4: Set NOT NULL constraints
ALTER TABLE events ALTER COLUMN createdBy SET NOT NULL;
ALTER TABLE events ALTER COLUMN updatedBy SET NOT NULL;

-- =====================================================
-- UPDATE BUDGET_CATEGORIES TABLE
-- =====================================================

-- Step 1: Add temporary columns
ALTER TABLE budget_categories 
ADD COLUMN createdBy_temp character varying,
ADD COLUMN updatedBy_temp character varying;

-- Step 2: Convert existing integer IDs to placeholder values
UPDATE budget_categories 
SET 
    createdBy_temp = CASE 
        WHEN createdBy = 1 THEN 'legacy@user.com'
        WHEN createdBy = 2 THEN 'legacy@user.com'
        ELSE 'legacy@user.com'
    END,
    updatedBy_temp = CASE 
        WHEN updatedBy = 1 THEN 'legacy@user.com'
        WHEN updatedBy = 2 THEN 'legacy@user.com'
        ELSE 'legacy@user.com'
    END;

-- Step 3: Drop old columns and rename new ones
ALTER TABLE budget_categories DROP COLUMN createdBy;
ALTER TABLE budget_categories DROP COLUMN updatedBy;
ALTER TABLE budget_categories RENAME COLUMN createdBy_temp TO createdBy;
ALTER TABLE budget_categories RENAME COLUMN updatedBy_temp TO updatedBy;

-- Step 4: Set NOT NULL constraints
ALTER TABLE budget_categories ALTER COLUMN createdBy SET NOT NULL;
ALTER TABLE budget_categories ALTER COLUMN updatedBy SET NOT NULL;

-- =====================================================
-- UPDATE BUDGETS TABLE
-- =====================================================

-- Step 1: Add temporary columns
ALTER TABLE budgets 
ADD COLUMN createdBy_temp character varying,
ADD COLUMN updatedBy_temp character varying;

-- Step 2: Convert existing integer IDs to placeholder values
UPDATE budgets 
SET 
    createdBy_temp = CASE 
        WHEN createdBy = 1 THEN 'legacy@user.com'
        WHEN createdBy = 2 THEN 'legacy@user.com'
        ELSE 'legacy@user.com'
    END,
    updatedBy_temp = CASE 
        WHEN updatedBy = 1 THEN 'legacy@user.com'
        WHEN updatedBy = 2 THEN 'legacy@user.com'
        ELSE 'legacy@user.com'
    END;

-- Step 3: Drop old columns and rename new ones
ALTER TABLE budgets DROP COLUMN createdBy;
ALTER TABLE budgets DROP COLUMN updatedBy;
ALTER TABLE budgets RENAME COLUMN createdBy_temp TO createdBy;
ALTER TABLE budgets RENAME COLUMN updatedBy_temp TO updatedBy;

-- Step 4: Set NOT NULL constraints
ALTER TABLE budgets ALTER COLUMN createdBy SET NOT NULL;
ALTER TABLE budgets ALTER COLUMN updatedBy SET NOT NULL;

-- =====================================================
-- UPDATE PLAYER_NOTES TABLE
-- =====================================================

-- Step 1: Add temporary columns
ALTER TABLE player_notes 
ADD COLUMN createdBy_temp character varying,
ADD COLUMN updatedBy_temp character varying;

-- Step 2: Convert existing integer IDs to placeholder values
UPDATE player_notes 
SET 
    createdBy_temp = CASE 
        WHEN createdBy = 1 THEN 'legacy@user.com'
        WHEN createdBy = 2 THEN 'legacy@user.com'
        ELSE 'legacy@user.com'
    END,
    updatedBy_temp = CASE 
        WHEN updatedBy = 1 THEN 'legacy@user.com'
        WHEN updatedBy = 2 THEN 'legacy@user.com'
        ELSE 'legacy@user.com'
    END;

-- Step 3: Drop old columns and rename new ones
ALTER TABLE player_notes DROP COLUMN createdBy;
ALTER TABLE player_notes DROP COLUMN updatedBy;
ALTER TABLE player_notes RENAME COLUMN createdBy_temp TO createdBy;
ALTER TABLE player_notes RENAME COLUMN updatedBy_temp TO updatedBy;

-- Step 4: Set NOT NULL constraints
ALTER TABLE player_notes ALTER COLUMN createdBy SET NOT NULL;
ALTER TABLE player_notes ALTER COLUMN updatedBy SET NOT NULL;

-- =====================================================
-- UPDATE PLAYER_GOALS TABLE
-- =====================================================

-- Step 1: Add temporary columns
ALTER TABLE player_goals 
ADD COLUMN createdBy_temp character varying,
ADD COLUMN updatedBy_temp character varying;

-- Step 2: Convert existing integer IDs to placeholder values
UPDATE player_goals 
SET 
    createdBy_temp = CASE 
        WHEN createdBy = 1 THEN 'legacy@user.com'
        WHEN createdBy = 2 THEN 'legacy@user.com'
        ELSE 'legacy@user.com'
    END,
    updatedBy_temp = CASE 
        WHEN updatedBy = 1 THEN 'legacy@user.com'
        WHEN updatedBy = 2 THEN 'legacy@user.com'
        ELSE 'legacy@user.com'
    END;

-- Step 3: Drop old columns and rename new ones
ALTER TABLE player_goals DROP COLUMN createdBy;
ALTER TABLE player_goals DROP COLUMN updatedBy;
ALTER TABLE player_goals RENAME COLUMN createdBy_temp TO createdBy;
ALTER TABLE player_goals RENAME COLUMN updatedBy_temp TO updatedBy;

-- Step 4: Set NOT NULL constraints
ALTER TABLE player_goals ALTER COLUMN createdBy SET NOT NULL;
ALTER TABLE player_goals ALTER COLUMN updatedBy SET NOT NULL;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify the changes
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE column_name IN ('createdBy', 'updatedBy') 
AND table_name IN ('tasks', 'events', 'budget_categories', 'budgets', 'player_notes', 'player_goals', 'expenses')
ORDER BY table_name, column_name;

-- Check sample data
SELECT 'tasks' as table_name, createdBy, updatedBy FROM tasks LIMIT 3
UNION ALL
SELECT 'events' as table_name, createdBy, updatedBy FROM events LIMIT 3
UNION ALL
SELECT 'expenses' as table_name, createdBy, updatedBy FROM expenses LIMIT 3;

-- =====================================================
-- CLEANUP (Optional)
-- =====================================================

-- If everything looks good, you can drop the backup tables
-- DROP TABLE IF EXISTS tasks_backup;
-- DROP TABLE IF EXISTS events_backup;
-- DROP TABLE IF EXISTS budget_categories_backup;
-- DROP TABLE IF EXISTS budgets_backup;
-- DROP TABLE IF EXISTS player_notes_backup;
-- DROP TABLE IF EXISTS player_goals_backup;
