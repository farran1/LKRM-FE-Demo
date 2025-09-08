-- Database Schema Check Script
-- This script will show all columns for all tables that are affected by the field name changes
-- Run this in your Supabase SQL editor to see the actual current structure

-- Check events table structure
SELECT 
    'events' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;

-- Check players table structure
SELECT 
    'players' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'players' 
ORDER BY ordinal_position;

-- Check tasks table structure
SELECT 
    'tasks' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;

-- Check player_notes table structure
SELECT 
    'player_notes' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'player_notes' 
ORDER BY ordinal_position;

-- Check player_goals table structure
SELECT 
    'player_goals' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'player_goals' 
ORDER BY ordinal_position;

-- Check budgets table structure
SELECT 
    'budgets' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'budgets' 
ORDER BY ordinal_position;

-- Check expenses table structure
SELECT 
    'expenses' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'expenses' 
ORDER BY ordinal_position;

-- Check event_types table structure
SELECT 
    'event_types' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'event_types' 
ORDER BY ordinal_position;

-- Check task_priorities table structure
SELECT 
    'task_priorities' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'task_priorities' 
ORDER BY ordinal_position;

-- Check positions table structure
SELECT 
    'positions' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'positions' 
ORDER BY ordinal_position;

-- Check profiles table structure
SELECT 
    'profiles' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Check users table structure
SELECT 
    'users' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Summary of all tables and their column counts
SELECT 
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name IN (
    'events', 'players', 'tasks', 'player_notes', 'player_goals',
    'budgets', 'expenses', 'event_types', 'task_priorities',
    'positions', 'profiles', 'users'
)
GROUP BY table_name
ORDER BY table_name;

-- Check for any tables with both camelCase and snake_case columns
SELECT 
    table_name,
    column_name,
    CASE 
        WHEN column_name ~ '[A-Z]' THEN 'camelCase'
        WHEN column_name ~ '_' THEN 'snake_case'
        ELSE 'other'
    END as naming_convention
FROM information_schema.columns 
WHERE table_name IN (
    'events', 'players', 'tasks', 'player_notes', 'player_goals',
    'budgets', 'expenses', 'event_types', 'task_priorities',
    'positions', 'profiles', 'users'
)
ORDER BY table_name, column_name;
