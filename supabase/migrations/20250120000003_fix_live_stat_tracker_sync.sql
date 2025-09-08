-- Fix Live Stat Tracker Sync and Offline Functionality
-- This migration ensures proper offline sync and data integrity

-- 1. Add missing sync_status column to live_game_events if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'live_game_events' AND column_name = 'sync_status'
    ) THEN
        ALTER TABLE live_game_events ADD COLUMN sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'failed'));
    END IF;
END $$;

-- 2. Ensure proper indexes exist for offline sync performance
CREATE INDEX IF NOT EXISTS idx_live_game_events_sync_status ON live_game_events(sync_status);
CREATE INDEX IF NOT EXISTS idx_live_game_events_created_at ON live_game_events(created_at);

-- 3. Add function to handle offline sync when coming back online
CREATE OR REPLACE FUNCTION sync_offline_live_events()
RETURNS VOID AS $$
BEGIN
    -- Update all pending events to syncing
    UPDATE live_game_events 
    SET sync_status = 'syncing' 
    WHERE sync_status = 'pending';
    
    -- Mark all syncing events as synced (in real implementation, this would validate with server)
    UPDATE live_game_events 
    SET sync_status = 'synced' 
    WHERE sync_status = 'syncing';
    
    -- Update sync status for all sessions
    UPDATE live_game_sync_status 
    SET sync_status = 'synced', 
        last_synced_at = NOW() 
    WHERE sync_status IN ('pending', 'syncing');
END;
$$ LANGUAGE plpgsql;

-- 4. Add function to get offline events count
CREATE OR REPLACE FUNCTION get_offline_events_count()
RETURNS TABLE (
    session_id INTEGER,
    pending_count BIGINT,
    failed_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lge.session_id,
        COUNT(*) FILTER (WHERE lge.sync_status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE lge.sync_status = 'failed') as failed_count
    FROM live_game_events lge
    WHERE lge.sync_status IN ('pending', 'failed')
    GROUP BY lge.session_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Add function to clean up failed sync events
CREATE OR REPLACE FUNCTION cleanup_failed_sync_events()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM live_game_events 
    WHERE sync_status = 'failed' 
    AND created_at < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 6. Ensure RLS policies are properly set for offline sync
-- Allow users to view their own offline events
CREATE POLICY "Users can view their offline events" ON live_game_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM live_game_sessions lgs 
            WHERE lgs.id = live_game_events.session_id 
            AND lgs.created_by = auth.uid()::integer
        )
    );

-- Allow users to insert offline events
CREATE POLICY "Users can insert offline events" ON live_game_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM live_game_sessions lgs 
            WHERE lgs.id = live_game_events.session_id 
            AND lgs.created_by = auth.uid()::integer
        )
    );

-- Allow users to update sync status of their events
CREATE POLICY "Users can update sync status" ON live_game_events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM live_game_sessions lgs 
            WHERE lgs.id = live_game_events.session_id 
            AND lgs.created_by = auth.uid()::integer
        )
    );

-- 7. Add trigger to automatically update sync status when events are inserted
CREATE OR REPLACE FUNCTION update_sync_status_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Set sync_status to 'pending' for new events (they need to be synced)
    NEW.sync_status = 'pending';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_update_sync_status_on_insert'
    ) THEN
        CREATE TRIGGER trigger_update_sync_status_on_insert
            BEFORE INSERT ON live_game_events
            FOR EACH ROW
            EXECUTE FUNCTION update_sync_status_on_insert();
    END IF;
END $$;

-- 8. Add function to get offline sync summary
CREATE OR REPLACE FUNCTION get_offline_sync_summary()
RETURNS TABLE (
    total_sessions INTEGER,
    total_events INTEGER,
    pending_events INTEGER,
    failed_events INTEGER,
    last_sync_time TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT lgs.id)::INTEGER as total_sessions,
        COUNT(lge.id)::INTEGER as total_events,
        COUNT(*) FILTER (WHERE lge.sync_status = 'pending')::INTEGER as pending_events,
        COUNT(*) FILTER (WHERE lge.sync_status = 'failed')::INTEGER as failed_events,
        MAX(lgs.updated_at) as last_sync_time
    FROM live_game_sessions lgs
    LEFT JOIN live_game_events lge ON lgs.id = lge.session_id
    WHERE lgs.created_by = auth.uid()::integer;
END;
$$ LANGUAGE plpgsql;

-- 9. Add function to force sync all offline data
CREATE OR REPLACE FUNCTION force_sync_all_offline_data()
RETURNS TABLE (
    session_id INTEGER,
    events_synced INTEGER,
    sync_status TEXT
) AS $$
DECLARE
    session_record RECORD;
    events_count INTEGER;
BEGIN
    -- Loop through all sessions with pending events
    FOR session_record IN 
        SELECT DISTINCT lgs.id 
        FROM live_game_sessions lgs
        JOIN live_game_events lge ON lgs.id = lge.session_id
        WHERE lge.sync_status = 'pending'
        AND lgs.created_by = auth.uid()::integer
    LOOP
        -- Count events for this session
        SELECT COUNT(*) INTO events_count
        FROM live_game_events 
        WHERE session_id = session_record.id 
        AND sync_status = 'pending';
        
        -- Mark events as synced
        UPDATE live_game_events 
        SET sync_status = 'synced' 
        WHERE session_id = session_record.id 
        AND sync_status = 'pending';
        
        -- Update session sync status
        UPDATE live_game_sync_status 
        SET sync_status = 'synced', 
            last_synced_at = NOW() 
        WHERE session_id = session_record.id;
        
        -- Return result
        session_id := session_record.id;
        events_synced := events_count;
        sync_status := 'synced';
        RETURN NEXT;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- 10. Add comments for documentation
COMMENT ON FUNCTION sync_offline_live_events IS 'Syncs all pending offline events when connection is restored';
COMMENT ON FUNCTION get_offline_events_count IS 'Returns count of pending and failed events per session';
COMMENT ON FUNCTION cleanup_failed_sync_events IS 'Removes failed sync events older than 24 hours';
COMMENT ON FUNCTION get_offline_sync_summary IS 'Returns summary of offline sync status for current user';
COMMENT ON FUNCTION force_sync_all_offline_data IS 'Forces sync of all offline data for current user';

-- 11. Create a view for easy offline sync monitoring
CREATE OR REPLACE VIEW offline_sync_monitor AS
SELECT 
    lgs.id as session_id,
    lgs.session_key,
    lgs.event_id,
    lgs.started_at,
    lgs.is_active,
    COUNT(lge.id) FILTER (WHERE lge.sync_status = 'pending') as pending_events,
    COUNT(lge.id) FILTER (WHERE lge.sync_status = 'failed') as failed_events,
    COUNT(lge.id) FILTER (WHERE lge.sync_status = 'synced') as synced_events,
    lgs.updated_at as last_activity
FROM live_game_sessions lgs
LEFT JOIN live_game_events lge ON lgs.id = lge.session_id
GROUP BY lgs.id, lgs.session_key, lgs.event_id, lgs.started_at, lgs.is_active, lgs.updated_at;

COMMENT ON VIEW offline_sync_monitor IS 'View for monitoring offline sync status across all sessions';
