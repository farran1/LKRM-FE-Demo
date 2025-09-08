-- COMPLETE FIX FOR 406 ERRORS - Remove RLS Policies
-- The issue: RLS policies still exist even though RLS is disabled on tables
-- This causes 406 errors for client-side requests using anon key

-- 1. Drop all RLS policies on live stat tracker tables
DROP POLICY IF EXISTS "Allow all operations on live_game_sessions" ON live_game_sessions;
DROP POLICY IF EXISTS "Allow all operations on live_game_events" ON live_game_events;
DROP POLICY IF EXISTS "Allow all operations on live_game_sync_status" ON live_game_sync_status;

-- 2. Ensure RLS is disabled (should already be done but double-check)
ALTER TABLE live_game_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE live_game_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE live_game_sync_status DISABLE ROW LEVEL SECURITY;

-- 3. Grant explicit permissions to anon role (the key used by client)
GRANT ALL ON live_game_sessions TO anon;
GRANT ALL ON live_game_events TO anon;
GRANT ALL ON live_game_sync_status TO anon;

-- 4. Also grant to authenticated users
GRANT ALL ON live_game_sessions TO authenticated;
GRANT ALL ON live_game_events TO authenticated;
GRANT ALL ON live_game_sync_status TO authenticated;

-- 5. Test the fix
SELECT 'RLS Status Check' as test;
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables 
WHERE tablename IN ('live_game_sessions', 'live_game_events', 'live_game_sync_status')
ORDER BY tablename;

-- 6. Test access
SELECT 'Access Test' as test;
SELECT COUNT(*) as total_sessions FROM live_game_sessions;
SELECT COUNT(*) as total_events FROM live_game_events;
SELECT COUNT(*) as total_sync_status FROM live_game_sync_status;
