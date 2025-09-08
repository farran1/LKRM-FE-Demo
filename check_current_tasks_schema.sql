-- Check Current Tasks Table Schema
-- Run this BEFORE applying the migration to see what we're working with

-- Check the current table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;

-- Check if the table exists and its current constraints
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'tasks';

-- Check the actual data types and constraints
SELECT 
    c.relname as table_name,
    a.attname as column_name,
    pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
    a.attnotnull as is_not_null,
    a.attnum as ordinal_position
FROM pg_catalog.pg_attribute a
JOIN pg_catalog.pg_class c ON a.attrelid = c.oid
WHERE c.relname = 'tasks' 
    AND a.attnum > 0 
    AND NOT a.attisdropped
ORDER BY a.attnum;

-- Check if there are any sequences or defaults
SELECT 
    column_name,
    column_default,
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name = 'tasks' 
    AND column_default IS NOT NULL;
