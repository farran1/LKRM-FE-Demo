-- Fix Aggregate Function for Live Stat Tracker
-- This migration fixes the column name mismatch in the aggregate function

-- Drop the existing function
DROP FUNCTION IF EXISTS aggregate_live_events_to_game_stats(INTEGER);

-- Recreate the function with correct column names (snake_case)
CREATE OR REPLACE FUNCTION aggregate_live_events_to_game_stats(session_id_param INTEGER)
RETURNS VOID AS $$
BEGIN
    -- This function will aggregate live events into the existing game_stats table
    -- ensuring compatibility with your current stats dashboard
    INSERT INTO game_stats (
        game_id, player_id, points, field_goals_made, field_goals_attempted,
        three_points_made, three_points_attempted, free_throws_made, free_throws_attempted,
        rebounds, offensive_rebounds, defensive_rebounds, assists, steals, blocks,
        turnovers, fouls, minutes_played, plus_minus, quarter, period, timestamp,
        created_at, updated_at
    )
    SELECT 
        lge.game_id,
        lge.player_id,
        COALESCE(SUM(CASE WHEN lge.event_type = 'points' THEN lge.event_value ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN lge.event_type = 'field_goal_made' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN lge.event_type IN ('field_goal_made', 'field_goal_missed') THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN lge.event_type = 'three_point_made' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN lge.event_type IN ('three_point_made', 'three_point_missed') THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN lge.event_type = 'free_throw_made' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN lge.event_type IN ('free_throw_made', 'free_throw_missed') THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN lge.event_type = 'rebound' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN lge.event_type = 'offensive_rebound' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN lge.event_type = 'defensive_rebound' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN lge.event_type = 'assist' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN lge.event_type = 'steal' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN lge.event_type = 'block' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN lge.event_type = 'turnover' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN lge.event_type = 'foul' THEN 1 ELSE 0 END), 0),
        0, -- minutes_played (calculated separately)
        COALESCE(SUM(CASE WHEN lge.event_type = 'points' THEN lge.event_value ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN lge.event_type = 'opponent_points' THEN lge.event_value ELSE 0 END), 0), -- plus_minus
        lge.quarter,
        'Q' || lge.quarter::text,
        NOW(),
        NOW(),
        NOW()
    FROM live_game_events lge
    WHERE lge.session_id = session_id_param 
    AND lge.player_id IS NOT NULL 
    AND lge.is_opponent_event = false
    AND lge.game_id IS NOT NULL -- Only process events that have a valid game_id
    GROUP BY lge.game_id, lge.player_id, lge.quarter
    ON CONFLICT (game_id, player_id, quarter) DO UPDATE SET
        points = EXCLUDED.points,
        field_goals_made = EXCLUDED.field_goals_made,
        field_goals_attempted = EXCLUDED.field_goals_attempted,
        three_points_made = EXCLUDED.three_points_made,
        three_points_attempted = EXCLUDED.three_points_attempted,
        free_throws_made = EXCLUDED.free_throws_made,
        free_throws_attempted = EXCLUDED.free_throws_attempted,
        rebounds = EXCLUDED.rebounds,
        offensive_rebounds = EXCLUDED.offensive_rebounds,
        defensive_rebounds = EXCLUDED.defensive_rebounds,
        assists = EXCLUDED.assists,
        steals = EXCLUDED.steals,
        blocks = EXCLUDED.blocks,
        turnovers = EXCLUDED.turnovers,
        fouls = EXCLUDED.fouls,
        plus_minus = EXCLUDED.plus_minus,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Fix the get_team_totals function to use correct session key parameter
DROP FUNCTION IF EXISTS get_team_totals_from_live_events(TEXT);
DROP FUNCTION IF EXISTS get_team_totals_from_live_events(INTEGER);

CREATE OR REPLACE FUNCTION get_team_totals_from_live_events(session_key_param TEXT)
RETURNS TABLE (
    game_id INTEGER,
    quarter INTEGER,
    home_score INTEGER,
    away_score INTEGER,
    home_rebounds INTEGER,
    away_rebounds INTEGER,
    home_assists INTEGER,
    away_assists INTEGER,
    home_steals INTEGER,
    away_steals INTEGER,
    home_blocks INTEGER,
    away_blocks INTEGER,
    home_turnovers INTEGER,
    away_turnovers INTEGER,
    home_fouls INTEGER,
    away_fouls INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lge.game_id,
        lge.quarter,
        COALESCE(SUM(CASE WHEN lge.is_opponent_event = false AND lge.event_type = 'points' THEN lge.event_value ELSE 0 END), 0) as home_score,
        COALESCE(SUM(CASE WHEN lge.is_opponent_event = true AND lge.event_type = 'points' THEN lge.event_value ELSE 0 END), 0) as away_score,
        COALESCE(SUM(CASE WHEN lge.is_opponent_event = false AND lge.event_type = 'rebound' THEN 1 ELSE 0 END), 0) as home_rebounds,
        COALESCE(SUM(CASE WHEN lge.is_opponent_event = true AND lge.event_type = 'rebound' THEN 1 ELSE 0 END), 0) as away_rebounds,
        COALESCE(SUM(CASE WHEN lge.is_opponent_event = false AND lge.event_type = 'assist' THEN 1 ELSE 0 END), 0) as home_assists,
        COALESCE(SUM(CASE WHEN lge.is_opponent_event = true AND lge.event_type = 'assist' THEN 1 ELSE 0 END), 0) as away_assists,
        COALESCE(SUM(CASE WHEN lge.is_opponent_event = false AND lge.event_type = 'steal' THEN 1 ELSE 0 END), 0) as home_steals,
        COALESCE(SUM(CASE WHEN lge.is_opponent_event = true AND lge.event_type = 'steal' THEN 1 ELSE 0 END), 0) as away_steals,
        COALESCE(SUM(CASE WHEN lge.is_opponent_event = false AND lge.event_type = 'block' THEN 1 ELSE 0 END), 0) as home_blocks,
        COALESCE(SUM(CASE WHEN lge.is_opponent_event = true AND lge.event_type = 'block' THEN 1 ELSE 0 END), 0) as away_blocks,
        COALESCE(SUM(CASE WHEN lge.is_opponent_event = false AND lge.event_type = 'turnover' THEN 1 ELSE 0 END), 0) as home_turnovers,
        COALESCE(SUM(CASE WHEN lge.is_opponent_event = true AND lge.event_type = 'turnover' THEN 1 ELSE 0 END), 0) as away_turnovers,
        COALESCE(SUM(CASE WHEN lge.is_opponent_event = false AND lge.event_type = 'foul' THEN 1 ELSE 0 END), 0) as home_fouls,
        COALESCE(SUM(CASE WHEN lge.is_opponent_event = true AND lge.event_type = 'foul' THEN 1 ELSE 0 END), 0) as away_fouls
    FROM live_game_events lge
    JOIN live_game_sessions lgs ON lgs.id = lge.session_id
    WHERE lgs.session_key = session_key_param
    GROUP BY lge.game_id, lge.quarter
    ORDER BY lge.quarter;
END;
$$ LANGUAGE plpgsql;

-- Comment explaining the fixes
COMMENT ON FUNCTION aggregate_live_events_to_game_stats IS 'Fixed aggregate function with correct snake_case column names and proper conflict resolution.';
COMMENT ON FUNCTION get_team_totals_from_live_events IS 'Fixed team totals function to use session_key parameter instead of session_id.';
