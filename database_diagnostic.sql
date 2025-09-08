-- Database Diagnostic Script for LKRM Player Management System
-- This script will check what currently exists and show you the current structure

-- Step 1: Check what tables exist
SELECT '=== EXISTING TABLES ===' as info;
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Step 2: Check the current players table structure
SELECT '=== PLAYERS TABLE STRUCTURE ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'players'
ORDER BY ordinal_position;

-- Step 3: Check if positions table exists and what's in it
SELECT '=== POSITIONS TABLE CHECK ===' as info;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'positions') 
        THEN 'EXISTS' 
        ELSE 'DOES NOT EXIST' 
    END as positions_table_status;

-- Step 4: Check if school_year_enum type exists
SELECT '=== SCHOOL YEAR ENUM CHECK ===' as info;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'school_year_enum') 
        THEN 'EXISTS' 
        ELSE 'DOES NOT EXIST' 
    END as school_year_enum_status;

-- Step 5: Check if there are any existing players data
SELECT '=== EXISTING PLAYERS DATA ===' as info;
SELECT COUNT(*) as total_players FROM players;

-- Step 6: Show sample data if any exists
SELECT '=== SAMPLE PLAYERS DATA ===' as info;
SELECT * FROM players LIMIT 3;

-- Step 7: Check for any existing constraints or indexes
SELECT '=== EXISTING CONSTRAINTS ===' as info;
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public' 
AND tc.table_name = 'players';

-- Step 8: Check for existing indexes
SELECT '=== EXISTING INDEXES ===' as info;
SELECT 
    indexname, 
    tablename, 
    indexdef
FROM pg_indexes 
WHERE tablename = 'players' 
AND schemaname = 'public';
