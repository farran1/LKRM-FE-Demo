-- LIVE STAT TRACKER CLEANUP & FIX
-- Run this in your Supabase SQL editor to fix all issues

-- 1. Clean up multiple active sessions (keep only the most recent one per event)
UPDATE live_game_sessions 
SET is_active = false, ended_at = NOW()
WHERE id NOT IN (
    SELECT DISTINCT ON (event_id) id 
    FROM live_game_sessions 
    WHERE is_active = true 
    ORDER BY event_id, started_at DESC
);

-- 2. Fix the aggregate function with correct column names
DROP FUNCTION IF EXISTS aggregate_live_events_to_game_stats(INTEGER);

CREATE OR REPLACE FUNCTION aggregate_live_events_to_game_stats(session_id_param INTEGER)
RETURNS VOID AS $$
BEGIN
    -- Insert aggregated stats from live events into game_stats
    INSERT INTO game_stats (
        "gameId", "playerId", "userId", points, rebounds, assists, 
        steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus",
        "fieldGoalsMade", "fieldGoalsAttempted", 
        "threePointsMade", "threePointsAttempted",
        "freeThrowsMade", "freeThrowsAttempted",
        "offensiveRebounds", "defensiveRebounds",
        quarter, period, timestamp, 
        "createdAt", "createdBy", "updatedAt", "updatedBy"
    )
    SELECT 
        lge.game_id as "gameId",
        lge.player_id as "playerId",
        lgs.created_by as "userId",
        -- Points: points events
        SUM(CASE 
            WHEN lge.event_type = 'points' THEN COALESCE(lge.event_value, 0)
            ELSE 0 
        END) as points,
        -- Rebounds
        SUM(CASE WHEN lge.event_type = 'rebound' THEN 1 ELSE 0 END) as rebounds,
        -- Assists
        SUM(CASE WHEN lge.event_type = 'assist' THEN 1 ELSE 0 END) as assists,
        -- Steals
        SUM(CASE WHEN lge.event_type = 'steal' THEN 1 ELSE 0 END) as steals,
        -- Blocks
        SUM(CASE WHEN lge.event_type = 'block' THEN 1 ELSE 0 END) as blocks,
        -- Turnovers
        SUM(CASE WHEN lge.event_type = 'turnover' THEN 1 ELSE 0 END) as turnovers,
        -- Fouls
        SUM(CASE WHEN lge.event_type = 'foul' THEN 1 ELSE 0 END) as fouls,
        0 as "minutesPlayed",
        0 as "plusMinus",
        -- Field Goals - count 2pt shots
        SUM(CASE WHEN lge.event_type = 'points' AND lge.event_value = 2 THEN 1 ELSE 0 END) as "fieldGoalsMade",
        SUM(CASE WHEN lge.event_type = 'points' AND lge.event_value = 2 THEN 1 ELSE 0 END) as "fieldGoalsAttempted",
        -- Three Pointers - count 3pt shots
        SUM(CASE WHEN lge.event_type = 'points' AND lge.event_value = 3 THEN 1 ELSE 0 END) as "threePointsMade",
        SUM(CASE WHEN lge.event_type = 'points' AND lge.event_value = 3 THEN 1 ELSE 0 END) as "threePointsAttempted",
        -- Free Throws - count 1pt shots
        SUM(CASE WHEN lge.event_type = 'points' AND lge.event_value = 1 THEN 1 ELSE 0 END) as "freeThrowsMade",
        SUM(CASE WHEN lge.event_type = 'points' AND lge.event_value = 1 THEN 1 ELSE 0 END) as "freeThrowsAttempted",
        -- Offensive/Defensive Rebounds (assume all defensive for now)
        0 as "offensiveRebounds",
        SUM(CASE WHEN lge.event_type = 'rebound' THEN 1 ELSE 0 END) as "defensiveRebounds",
        lge.quarter,
        'Q' || lge.quarter as period,
        NOW() as timestamp,
        NOW() as "createdAt",
        lgs.created_by as "createdBy",
        NOW() as "updatedAt",
        lgs.created_by as "updatedBy"
    FROM live_game_events lge
    JOIN live_game_sessions lgs ON lge.session_id = lgs.id
    WHERE lge.session_id = session_id_param
    AND lge.player_id IS NOT NULL
    AND lge.is_opponent_event = false  -- Only count our team's events
    AND lge.game_id IS NOT NULL  -- Ensure we have a valid game_id
    GROUP BY lge.game_id, lge.player_id, lgs.created_by, lge.quarter;
    
    -- Mark events as processed
    UPDATE live_game_events 
    SET sync_status = 'synced'
    WHERE session_id = session_id_param;
    
END;
$$ LANGUAGE plpgsql;

-- 3. Add a function to get active session for an event (prevents duplicates)
CREATE OR REPLACE FUNCTION get_active_session_for_event(event_id_param INTEGER)
RETURNS TABLE(session_id INTEGER, session_key TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT id as session_id, live_game_sessions.session_key 
    FROM live_game_sessions
    WHERE event_id = event_id_param 
    AND is_active = true
    ORDER BY started_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 4. Clean up any orphaned sync status records
DELETE FROM live_game_sync_status 
WHERE session_id NOT IN (SELECT id FROM live_game_sessions);

-- Show current state after cleanup
SELECT 
    'Active Sessions After Cleanup' as status,
    COUNT(*) as count 
FROM live_game_sessions 
WHERE is_active = true;

SELECT 
    'Event 13 Active Sessions' as status,
    COUNT(*) as count 
FROM live_game_sessions 
WHERE event_id = 13 AND is_active = true;
