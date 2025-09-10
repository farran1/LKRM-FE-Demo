-- Fix timeouts in game_quarter_totals
-- This handles the case where game_quarter_totals is a view

-- First, let's check if game_quarter_totals is a view or table
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'game_quarter_totals';

-- If it's a view, we need to find the underlying table(s)
-- Let's check what tables exist that might be related
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%quarter%' 
OR table_name LIKE '%game%'
ORDER BY table_name;

-- Check if there are any tables with timeout data
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE column_name LIKE '%timeout%' 
AND table_schema = 'public';

-- If game_quarter_totals is a view, we need to recreate it with timeouts
-- First, let's see the current view definition
SELECT pg_get_viewdef('game_quarter_totals'::regclass, true);

-- If we need to add timeouts to the underlying data source,
-- we might need to add it to a table like 'live_game_events' or similar
-- Let's check what tables have quarter data
SELECT DISTINCT table_name 
FROM information_schema.columns 
WHERE column_name = 'quarter' 
AND table_schema = 'public';
