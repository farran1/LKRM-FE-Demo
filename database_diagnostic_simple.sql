-- Simple diagnostic script to check current database schema
-- Run this in your Supabase SQL editor to see what columns exist

-- Check what columns exist in the players table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'players'
ORDER BY ordinal_position;

-- Check if positions table exists and what's in it
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'positions') 
        THEN 'positions table exists'
        ELSE 'positions table does not exist'
    END as positions_status;

-- If positions table exists, show its contents
SELECT * FROM positions LIMIT 10;

-- Check current RLS policies on players table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'players';

-- Check if user_id column exists in players table
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'players' 
            AND column_name = 'user_id'
        ) 
        THEN 'user_id column exists'
        ELSE 'user_id column does not exist'
    END as user_id_status;

-- Check the data types of user_id and createdBy columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'players' 
AND column_name IN ('user_id', 'createdBy')
ORDER BY column_name;

-- Check if profiles table exists and what it contains
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
        THEN 'profiles table exists'
        ELSE 'profiles table does not exist'
    END as profiles_status;

-- If profiles table exists, show its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Test insert to see exact error (added updatedBy since it's required)
-- Replace the UUID with your actual user ID from the console logs
INSERT INTO players (name, "positionId", jersey, user_id, "updatedBy")
VALUES ('Test Player', 8, '99', '618e4250-9f37-41aa-bae3-2dc1086ef2e3'::uuid, 1);

-- Check the exact column names in players table (case sensitive)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'players'
ORDER BY ordinal_position;

-- TEMPORARY FIX: Disable RLS on players table to allow testing
-- (Run this to temporarily allow inserts)
ALTER TABLE players DISABLE ROW LEVEL SECURITY;

-- To re-enable RLS later (after migration), run:
-- ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Check events table structure
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') 
        THEN 'events table exists'
        ELSE 'events table does not exist'
    END as events_status;

-- If events table exists, show its columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'events'
ORDER BY ordinal_position;

-- Check event_types table structure
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_types') 
        THEN 'event_types table exists'
        ELSE 'event_types table does not exist'
    END as event_types_status;

-- If event_types table exists, show its contents
SELECT * FROM event_types LIMIT 10;

-- Check RLS policies on events table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'events';
