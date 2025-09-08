-- Fix RLS Policies for Live Stat Tracker
-- This migration simplifies the RLS policies to allow basic access

-- Drop existing complex policies
DROP POLICY IF EXISTS "Users can view their own live game sessions" ON live_game_sessions;
DROP POLICY IF EXISTS "Users can insert their own live game sessions" ON live_game_sessions;
DROP POLICY IF EXISTS "Users can update their own live game sessions" ON live_game_sessions;
DROP POLICY IF EXISTS "Users can view events in their sessions" ON live_game_events;
DROP POLICY IF EXISTS "Users can insert events in their sessions" ON live_game_events;

-- Create simplified policies that allow all operations
CREATE POLICY "Allow all operations on live_game_sessions" ON live_game_sessions
    FOR ALL USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations on live_game_events" ON live_game_events
    FOR ALL USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations on live_game_sync_status" ON live_game_sync_status
    FOR ALL USING (true)
    WITH CHECK (true);

-- Comment explaining the simplified approach
COMMENT ON POLICY "Allow all operations on live_game_sessions" ON live_game_sessions IS 'Temporary policy to allow basic access. Can be restricted later for production.';
COMMENT ON POLICY "Allow all operations on live_game_events" ON live_game_events IS 'Temporary policy to allow basic access. Can be restricted later for production.';
COMMENT ON POLICY "Allow all operations on live_game_sync_status" ON live_game_sync_status IS 'Temporary policy to allow basic access. Can be restricted later for production.';
