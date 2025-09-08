-- Critical Fields Check Script
-- This script checks only the specific fields that are causing issues
-- Run this in your Supabase SQL editor to see the exact field names

-- Check events table - critical fields
SELECT 
    'events' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN (
    'id', 'name', 'description', 'eventTypeId', 'event_type_id',
    'startTime', 'start_time', 'endTime', 'end_time',
    'location', 'venue', 'oppositionTeam', 'opposition_team',
    'isRepeat', 'is_repeat', 'occurence', 'occurrence',
    'isNotice', 'is_notice', 'notes', 'createdAt', 'created_at',
    'createdBy', 'user_id', 'updatedAt', 'updated_at', 'updatedBy'
)
ORDER BY column_name;

-- Check players table - critical fields
SELECT 
    'players' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'players' 
AND column_name IN (
    'id', 'name', 'positionId', 'position_id', 'jersey', 'jersey_number',
    'phoneNumber', 'phone_number', 'email', 'height', 'weight',
    'avatar', 'birthDate', 'birth_date', 'isActive', 'is_active',
    'createdAt', 'created_at', 'createdBy', 'user_id',
    'updatedAt', 'updated_at', 'updatedBy', 'userId',
    'firstName', 'first_name', 'lastName', 'last_name',
    'schoolYear', 'school_year', 'profileId', 'profile_id'
)
ORDER BY column_name;

-- Check tasks table - critical fields
SELECT 
    'tasks' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN (
    'id', 'name', 'description', 'dueDate', 'due_date',
    'priorityId', 'priority_id', 'status', 'eventId', 'event_id',
    'createdAt', 'created_at', 'createdBy', 'user_id',
    'updatedAt', 'updated_at', 'updatedBy'
)
ORDER BY column_name;

-- Check player_notes table - critical fields
SELECT 
    'player_notes' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'player_notes' 
AND column_name IN (
    'id', 'playerId', 'player_id', 'note', 'noteText', 'note_text',
    'isPublic', 'is_public', 'tags', 'createdAt', 'created_at',
    'createdBy', 'user_id', 'updatedAt', 'updated_at', 'updatedBy'
)
ORDER BY column_name;

-- Check player_goals table - critical fields
SELECT 
    'player_goals' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'player_goals' 
AND column_name IN (
    'id', 'playerId', 'player_id', 'goal', 'goalText', 'goal_text',
    'targetDate', 'target_date', 'isAchieved', 'is_achieved',
    'achievedAt', 'achieved_at', 'category', 'createdAt', 'created_at',
    'createdBy', 'user_id', 'updatedAt', 'updated_at', 'updatedBy'
)
ORDER BY column_name;

-- Check budgets table - critical fields
SELECT 
    'budgets' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'budgets' 
AND column_name IN (
    'id', 'name', 'amount', 'period', 'autoRepeat', 'auto_repeat',
    'description', 'categoryId', 'category_id', 'season',
    'createdAt', 'created_at', 'createdBy', 'user_id',
    'updatedAt', 'updated_at', 'updatedBy'
)
ORDER BY column_name;

-- Check expenses table - critical fields
SELECT 
    'expenses' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND column_name IN (
    'id', 'budgetId', 'budget_id', 'merchant', 'amount', 'category',
    'date', 'eventId', 'event_id', 'description', 'receiptUrl', 'receipt_url',
    'createdAt', 'created_at', 'createdBy', 'user_id',
    'updatedAt', 'updated_at', 'updatedBy'
)
ORDER BY column_name;

-- Summary of naming conventions for each table
SELECT 
    table_name,
    COUNT(CASE WHEN column_name ~ '[A-Z]' THEN 1 END) as camel_case_count,
    COUNT(CASE WHEN column_name ~ '_' THEN 1 END) as snake_case_count,
    COUNT(CASE WHEN column_name ~ '^[a-z]+$' THEN 1 END) as lowercase_count
FROM information_schema.columns 
WHERE table_name IN (
    'events', 'players', 'tasks', 'player_notes', 'player_goals',
    'budgets', 'expenses'
)
GROUP BY table_name
ORDER BY table_name;
