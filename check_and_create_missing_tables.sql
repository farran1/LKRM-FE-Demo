-- Simple Check and Create Missing Tables for Tasks
-- This script ensures all required tables exist before tasks can be created

-- First, let's see what tables currently exist
SELECT '=== CURRENT TABLES ===' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if task_priorities table exists and has data
SELECT '=== CHECKING TASK_PRIORITIES ===' as info;
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'task_priorities')
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as task_priorities_status;

-- Insert default task priorities if they don't exist
INSERT INTO task_priorities (name, weight, color) VALUES
    ('High', 1, '#ff4d4f'),
    ('Medium', 2, '#faad14'),
    ('Low', 3, '#52c41a')
ON CONFLICT (name) DO NOTHING;

SELECT 'Inserted/checked task priorities' as result;

-- Check if users table exists and has data
SELECT '=== CHECKING USERS ===' as info;
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as users_status;

-- Insert default users if none exist
INSERT INTO users (username, email, password, role, "isActive") VALUES
    ('default', 'default@example.com', 'default_password_hash', 'COACH', true),
    ('andrew', 'andrew@example.com', 'hashed_password', 'COACH', true),
    ('coach_john', 'john@example.com', 'hashed_password', 'COACH', true),
    ('assistant_coach', 'assistant@example.com', 'hashed_password', 'COACH', true)
ON CONFLICT (username) DO NOTHING;

SELECT 'Inserted/checked default users' as result;

-- Verify the users were created
SELECT '=== USERS IN DATABASE ===' as info;
SELECT id, username, email, role, "isActive", "createdAt"
FROM users
ORDER BY username;

-- Check if events table exists
SELECT '=== CHECKING EVENTS ===' as info;
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events')
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as events_status;

-- Create events table if it doesn't exist
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

SELECT 'Events table ready' as result;

-- Check if player_tasks table exists
SELECT '=== CHECKING PLAYER_TASKS ===' as info;
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'player_tasks')
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as player_tasks_status;

-- Create player_tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS player_tasks (
    "taskId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    status TEXT DEFAULT 'assigned',
    "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER DEFAULT 0,
    PRIMARY KEY ("taskId", "playerId")
);

SELECT 'Player_tasks table ready' as result;

-- Check if players table exists
SELECT '=== CHECKING PLAYERS ===' as info;
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'players')
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as players_status;

-- Create players table if it doesn't exist
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

SELECT 'Players table ready' as result;

-- Final verification
SELECT '=== FINAL VERIFICATION ===' as info;
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('tasks', 'task_priorities', 'users', 'events', 'player_tasks', 'players') 
        THEN '✓ REQUIRED'
        ELSE '⚠ OPTIONAL'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Show tasks table structure
SELECT '=== TASKS TABLE STRUCTURE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;

-- Check foreign key constraints
SELECT '=== FOREIGN KEY CONSTRAINTS ===' as info;
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'tasks' AND tc.constraint_type = 'FOREIGN KEY';

-- Final status check
SELECT '=== CONSTRAINT SATISFACTION ===' as info;
SELECT 
    'Users table has data' as check_name,
    CASE WHEN EXISTS (SELECT 1 FROM users) THEN '✓ YES' ELSE '⚠ NO' END as status
UNION ALL
SELECT 
    'Task priorities table has data' as check_name,
    CASE WHEN EXISTS (SELECT 1 FROM task_priorities) THEN '✓ YES' ELSE '⚠ NO' END as status
UNION ALL
SELECT 
    'Events table exists' as check_name,
    CASE WHEN EXISTS (SELECT 1 FROM events) THEN '✓ YES' ELSE '⚠ NO' END as status;

SELECT '=== SCRIPT COMPLETED ===' as info;
