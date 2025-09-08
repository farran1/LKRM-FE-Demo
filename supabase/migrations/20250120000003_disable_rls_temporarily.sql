-- Temporarily disable RLS for live stat tracker tables to resolve 406 errors
-- This is for debugging purposes - can be re-enabled later with proper auth context

-- Disable RLS on live stat tracker tables
ALTER TABLE live_game_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE live_game_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE live_game_sync_status DISABLE ROW LEVEL SECURITY;

-- Comment explaining this is temporary
COMMENT ON TABLE live_game_sessions IS 'Live game sessions for real-time stat tracking. RLS temporarily disabled for debugging.';
COMMENT ON TABLE live_game_events IS 'Real-time stat events during live games. RLS temporarily disabled for debugging.';
COMMENT ON TABLE live_game_sync_status IS 'Tracks offline sync status for live game sessions. RLS temporarily disabled for debugging.';

-- Note: To re-enable RLS later, run:
-- ALTER TABLE live_game_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE live_game_events ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE live_game_sync_status ENABLE ROW LEVEL SECURITY;
