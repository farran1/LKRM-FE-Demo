-- Simple Email Conversion Script
-- This script converts createdBy/updatedBy columns to store simple email addresses
-- instead of JSON data (easier to read and query)

-- =====================================================
-- BACKUP EXISTING DATA
-- =====================================================

-- Create backup tables (uncomment if you want backups)
-- CREATE TABLE tasks_backup AS SELECT * FROM tasks;
-- CREATE TABLE events_backup AS SELECT * FROM events;
-- CREATE TABLE budget_categories_backup AS SELECT * FROM budget_categories;
-- CREATE TABLE budgets_backup AS SELECT * FROM budgets;
-- CREATE TABLE player_notes_backup AS SELECT * FROM player_notes;
-- CREATE TABLE player_goals_backup AS SELECT * FROM player_goals;

-- =====================================================
-- UPDATE TASKS TABLE
-- =====================================================

-- Add temporary columns
ALTER TABLE tasks 
ADD COLUMN createdBy_temp character varying,
ADD COLUMN updatedBy_temp character varying;

-- Convert to email format (customize these mappings)
UPDATE tasks 
SET 
    createdBy_temp = CASE 
        WHEN createdBy = 1 THEN 'andrew@lkrmsports.com'
        WHEN createdBy = 2 THEN 'coach@example.com'
        ELSE 'legacy@user.com'
    END,
    updatedBy_temp = CASE 
        WHEN updatedBy = 1 THEN 'andrew@lkrmsports.com'
        WHEN updatedBy = 2 THEN 'coach@example.com'
        ELSE 'legacy@user.com'
    END;

-- Replace old columns
ALTER TABLE tasks DROP COLUMN createdBy;
ALTER TABLE tasks DROP COLUMN updatedBy;
ALTER TABLE tasks RENAME COLUMN createdBy_temp TO createdBy;
ALTER TABLE tasks RENAME COLUMN updatedBy_temp TO updatedBy;
ALTER TABLE tasks ALTER COLUMN createdBy SET NOT NULL;
ALTER TABLE tasks ALTER COLUMN updatedBy SET NOT NULL;

-- =====================================================
-- UPDATE EVENTS TABLE
-- =====================================================

ALTER TABLE events 
ADD COLUMN createdBy_temp character varying,
ADD COLUMN updatedBy_temp character varying;

UPDATE events 
SET 
    createdBy_temp = CASE 
        WHEN createdBy = 1 THEN 'andrew@lkrmsports.com'
        WHEN createdBy = 2 THEN 'coach@example.com'
        ELSE 'legacy@user.com'
    END,
    updatedBy_temp = CASE 
        WHEN updatedBy = 1 THEN 'andrew@lkrmsports.com'
        WHEN updatedBy = 2 THEN 'coach@example.com'
        ELSE 'legacy@user.com'
    END;

ALTER TABLE events DROP COLUMN createdBy;
ALTER TABLE events DROP COLUMN updatedBy;
ALTER TABLE events RENAME COLUMN createdBy_temp TO createdBy;
ALTER TABLE events RENAME COLUMN updatedBy_temp TO updatedBy;
ALTER TABLE events ALTER COLUMN createdBy SET NOT NULL;
ALTER TABLE events ALTER COLUMN updatedBy SET NOT NULL;

-- =====================================================
-- UPDATE BUDGET_CATEGORIES TABLE
-- =====================================================

ALTER TABLE budget_categories 
ADD COLUMN createdBy_temp character varying,
ADD COLUMN updatedBy_temp character varying;

UPDATE budget_categories 
SET 
    createdBy_temp = CASE 
        WHEN createdBy = 1 THEN 'andrew@lkrmsports.com'
        WHEN createdBy = 2 THEN 'coach@example.com'
        ELSE 'legacy@user.com'
    END,
    updatedBy_temp = CASE 
        WHEN updatedBy = 1 THEN 'andrew@lkrmsports.com'
        WHEN updatedBy = 2 THEN 'coach@example.com'
        ELSE 'legacy@user.com'
    END;

ALTER TABLE budget_categories DROP COLUMN createdBy;
ALTER TABLE budget_categories DROP COLUMN updatedBy;
ALTER TABLE budget_categories RENAME COLUMN createdBy_temp TO createdBy;
ALTER TABLE budget_categories RENAME COLUMN updatedBy_temp TO updatedBy;
ALTER TABLE budget_categories ALTER COLUMN createdBy SET NOT NULL;
ALTER TABLE budget_categories ALTER COLUMN updatedBy SET NOT NULL;

-- =====================================================
-- UPDATE BUDGETS TABLE
-- =====================================================

ALTER TABLE budgets 
ADD COLUMN createdBy_temp character varying,
ADD COLUMN updatedBy_temp character varying;

UPDATE budgets 
SET 
    createdBy_temp = CASE 
        WHEN createdBy = 1 THEN 'andrew@lkrmsports.com'
        WHEN createdBy = 2 THEN 'coach@example.com'
        ELSE 'legacy@user.com'
    END,
    updatedBy_temp = CASE 
        WHEN updatedBy = 1 THEN 'andrew@lkrmsports.com'
        WHEN updatedBy = 2 THEN 'coach@example.com'
        ELSE 'legacy@user.com'
    END;

ALTER TABLE budgets DROP COLUMN createdBy;
ALTER TABLE budgets DROP COLUMN updatedBy;
ALTER TABLE budgets RENAME COLUMN createdBy_temp TO createdBy;
ALTER TABLE budgets RENAME COLUMN updatedBy_temp TO updatedBy;
ALTER TABLE budgets ALTER COLUMN createdBy SET NOT NULL;
ALTER TABLE budgets ALTER COLUMN updatedBy SET NOT NULL;

-- =====================================================
-- UPDATE PLAYER_NOTES TABLE
-- =====================================================

ALTER TABLE player_notes 
ADD COLUMN createdBy_temp character varying,
ADD COLUMN updatedBy_temp character varying;

UPDATE player_notes 
SET 
    createdBy_temp = CASE 
        WHEN createdBy = 1 THEN 'andrew@lkrmsports.com'
        WHEN createdBy = 2 THEN 'coach@example.com'
        ELSE 'legacy@user.com'
    END,
    updatedBy_temp = CASE 
        WHEN updatedBy = 1 THEN 'andrew@lkrmsports.com'
        WHEN updatedBy = 2 THEN 'coach@example.com'
        ELSE 'legacy@user.com'
    END;

ALTER TABLE player_notes DROP COLUMN createdBy;
ALTER TABLE player_notes DROP COLUMN updatedBy;
ALTER TABLE player_notes RENAME COLUMN createdBy_temp TO createdBy;
ALTER TABLE player_notes RENAME COLUMN updatedBy_temp TO updatedBy;
ALTER TABLE player_notes ALTER COLUMN createdBy SET NOT NULL;
ALTER TABLE player_notes ALTER COLUMN updatedBy SET NOT NULL;

-- =====================================================
-- UPDATE PLAYER_GOALS TABLE
-- =====================================================

ALTER TABLE player_goals 
ADD COLUMN createdBy_temp character varying,
ADD COLUMN updatedBy_temp character varying;

UPDATE player_goals 
SET 
    createdBy_temp = CASE 
        WHEN createdBy = 1 THEN 'andrew@lkrmsports.com'
        WHEN createdBy = 2 THEN 'coach@example.com'
        ELSE 'legacy@user.com'
    END,
    updatedBy_temp = CASE 
        WHEN updatedBy = 1 THEN 'andrew@lkrmsports.com'
        WHEN updatedBy = 2 THEN 'coach@example.com'
        ELSE 'legacy@user.com'
    END;

ALTER TABLE player_goals DROP COLUMN createdBy;
ALTER TABLE player_goals DROP COLUMN updatedBy;
ALTER TABLE player_goals RENAME COLUMN createdBy_temp TO createdBy;
ALTER TABLE player_goals RENAME COLUMN updatedBy_temp TO updatedBy;
ALTER TABLE player_goals ALTER COLUMN createdBy SET NOT NULL;
ALTER TABLE player_goals ALTER COLUMN updatedBy SET NOT NULL;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check the results
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE column_name IN ('createdBy', 'updatedBy') 
AND table_name IN ('tasks', 'events', 'budget_categories', 'budgets', 'player_notes', 'player_goals', 'expenses')
ORDER BY table_name, column_name;

-- Sample data check
SELECT 'tasks' as table_name, createdBy, updatedBy FROM tasks LIMIT 3
UNION ALL
SELECT 'events' as table_name, createdBy, updatedBy FROM events LIMIT 3
UNION ALL
SELECT 'expenses' as table_name, createdBy, updatedBy FROM expenses LIMIT 3;
