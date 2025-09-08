-- Fix All Foreign Key Issues Related to Users Table
-- This script removes all foreign key constraints that reference the users table
-- since we're phasing out the public users table

-- =====================================================
-- STEP 1: IDENTIFY ALL FOREIGN KEYS TO USERS TABLE
-- =====================================================

-- Find all foreign key constraints that reference the users table
SELECT 
    tc.table_name,
    tc.constraint_name, 
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
AND ccu.table_name = 'users'
ORDER BY tc.table_name, tc.constraint_name;

-- =====================================================
-- STEP 2: REMOVE FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Remove foreign key constraints from tasks table
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assigneeId_fkey;

-- Remove foreign key constraints from events table (if any)
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_createdBy_fkey;
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_updatedBy_fkey;

-- Remove foreign key constraints from budget_categories table (if any)
ALTER TABLE budget_categories DROP CONSTRAINT IF EXISTS budget_categories_createdBy_fkey;
ALTER TABLE budget_categories DROP CONSTRAINT IF EXISTS budget_categories_updatedBy_fkey;

-- Remove foreign key constraints from budgets table (if any)
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_createdBy_fkey;
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_updatedBy_fkey;

-- Remove foreign key constraints from player_notes table (if any)
ALTER TABLE player_notes DROP CONSTRAINT IF EXISTS player_notes_createdBy_fkey;
ALTER TABLE player_notes DROP CONSTRAINT IF EXISTS player_notes_updatedBy_fkey;

-- Remove foreign key constraints from player_goals table (if any)
ALTER TABLE player_goals DROP CONSTRAINT IF EXISTS player_goals_createdBy_fkey;
ALTER TABLE player_goals DROP CONSTRAINT IF EXISTS player_goals_updatedBy_fkey;

-- Remove foreign key constraints from expenses table (if any)
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_createdBy_fkey;
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_updatedBy_fkey;

-- =====================================================
-- STEP 3: VERIFY ALL CONSTRAINTS ARE REMOVED
-- =====================================================

-- Check that no foreign keys reference the users table anymore
SELECT 
    tc.table_name,
    tc.constraint_name, 
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
AND ccu.table_name = 'users'
ORDER BY tc.table_name, tc.constraint_name;

-- =====================================================
-- STEP 4: CHECK COLUMN TYPES
-- =====================================================

-- Verify all user tracking columns are character varying
SELECT 
    table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE column_name IN ('createdBy', 'updatedBy', 'assigneeId')
AND table_name IN ('tasks', 'events', 'budget_categories', 'budgets', 'player_notes', 'player_goals', 'expenses')
ORDER BY table_name, column_name;

-- =====================================================
-- STEP 5: TEST DATA INSERTION
-- =====================================================

-- Test inserting data into tasks table
INSERT INTO tasks (
    name, 
    description, 
    "priorityId", 
    status, 
    "createdBy", 
    "updatedBy",
    "assigneeId"
) VALUES (
    'Test Task After Fix', 
    'Testing after removing foreign key constraints', 
    1, 
    'TODO', 
    'andrew@lkrmsports.com', 
    'andrew@lkrmsports.com',
    'andrew@lkrmsports.com'
) RETURNING *;

-- =====================================================
-- STEP 6: CLEANUP TEST DATA
-- =====================================================

-- Remove the test task
DELETE FROM tasks WHERE name = 'Test Task After Fix';

-- =====================================================
-- STEP 7: UPDATE DEFAULT VALUES (Optional)
-- =====================================================

-- Update default values for user tracking columns
ALTER TABLE tasks ALTER COLUMN "createdBy" SET DEFAULT 'system@lkrmsports.com';
ALTER TABLE tasks ALTER COLUMN "updatedBy" SET DEFAULT 'system@lkrmsports.com';

-- Update other tables if they exist
DO $$
BEGIN
    -- Update events table defaults if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN
        ALTER TABLE events ALTER COLUMN "createdBy" SET DEFAULT 'system@lkrmsports.com';
        ALTER TABLE events ALTER COLUMN "updatedBy" SET DEFAULT 'system@lkrmsports.com';
    END IF;
    
    -- Update budget_categories table defaults if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'budget_categories') THEN
        ALTER TABLE budget_categories ALTER COLUMN "createdBy" SET DEFAULT 'system@lkrmsports.com';
        ALTER TABLE budget_categories ALTER COLUMN "updatedBy" SET DEFAULT 'system@lkrmsports.com';
    END IF;
    
    -- Update budgets table defaults if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'budgets') THEN
        ALTER TABLE budgets ALTER COLUMN "createdBy" SET DEFAULT 'system@lkrmsports.com';
        ALTER TABLE budgets ALTER COLUMN "updatedBy" SET DEFAULT 'system@lkrmsports.com';
    END IF;
    
    -- Update player_notes table defaults if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'player_notes') THEN
        ALTER TABLE player_notes ALTER COLUMN "createdBy" SET DEFAULT 'system@lkrmsports.com';
        ALTER TABLE player_notes ALTER COLUMN "updatedBy" SET DEFAULT 'system@lkrmsports.com';
    END IF;
    
    -- Update player_goals table defaults if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'player_goals') THEN
        ALTER TABLE player_goals ALTER COLUMN "createdBy" SET DEFAULT 'system@lkrmsports.com';
        ALTER TABLE player_goals ALTER COLUMN "updatedBy" SET DEFAULT 'system@lkrmsports.com';
    END IF;
    
    -- Update expenses table defaults if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses') THEN
        ALTER TABLE expenses ALTER COLUMN "createdBy" SET DEFAULT 'system@lkrmsports.com';
        ALTER TABLE expenses ALTER COLUMN "updatedBy" SET DEFAULT 'system@lkrmsports.com';
    END IF;
END $$;

-- =====================================================
-- FINAL VERIFICATION
-- =====================================================

-- Final check of all user tracking columns
SELECT 
    table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE column_name IN ('createdBy', 'updatedBy', 'assigneeId')
AND table_name IN ('tasks', 'events', 'budget_categories', 'budgets', 'player_notes', 'player_goals', 'expenses')
ORDER BY table_name, column_name;
