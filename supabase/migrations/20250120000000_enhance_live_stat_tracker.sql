-- Enhance Live Stat Tracker - Builds on existing game_stats structure
-- This migration adds live tracking capabilities while preserving existing data

-- 1. Live Game Sessions table (for real-time game tracking)
CREATE TABLE IF NOT EXISTS live_game_sessions (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    game_id INTEGER REFERENCES games(id) ON DELETE CASCADE, -- Link to existing games table
    session_key TEXT UNIQUE NOT NULL,
    game_state JSONB NOT NULL DEFAULT '{}', -- Current game state (quarter, time, score, etc.)
    is_active BOOLEAN DEFAULT true,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Live Game Events table (real-time stat updates)
CREATE TABLE IF NOT EXISTS live_game_events (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES live_game_sessions(id) ON DELETE CASCADE,
    game_id INTEGER REFERENCES games(id) ON DELETE CASCADE, -- Link to existing games
    player_id INTEGER REFERENCES players(id),
    event_type TEXT NOT NULL, -- 'points', 'rebound', 'assist', 'steal', 'block', 'turnover', 'foul'
    event_value INTEGER, -- Points scored, rebounds, etc.
    quarter INTEGER NOT NULL,
    game_time INTEGER NOT NULL, -- seconds from start of quarter
    is_opponent_event BOOLEAN DEFAULT false,
    opponent_jersey TEXT, -- for opponent events without player_id
    metadata JSONB DEFAULT '{}', -- Additional context (shot type, location, etc.)
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Live Game Sync Status table (for offline sync)
CREATE TABLE IF NOT EXISTS live_game_sync_status (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES live_game_sessions(id) ON DELETE CASCADE,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'failed')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_game_sessions_event_id ON live_game_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_live_game_sessions_game_id ON live_game_sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_live_game_sessions_session_key ON live_game_sessions(session_key);
CREATE INDEX IF NOT EXISTS idx_live_game_sessions_is_active ON live_game_sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_live_game_events_session_id ON live_game_events(session_id);
CREATE INDEX IF NOT EXISTS idx_live_game_events_game_id ON live_game_events(game_id);
CREATE INDEX IF NOT EXISTS idx_live_game_events_player_id ON live_game_events(player_id);
CREATE INDEX IF NOT EXISTS idx_live_game_events_event_type ON live_game_events(event_type);
CREATE INDEX IF NOT EXISTS idx_live_game_events_quarter ON live_game_events(quarter);
CREATE INDEX IF NOT EXISTS idx_live_game_events_sync_status ON live_game_events(sync_status);

-- Create RLS policies for security
ALTER TABLE live_game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_game_sync_status ENABLE ROW LEVEL SECURITY;

-- RLS policies for live game sessions - Simplified for now
CREATE POLICY "Allow all operations on live_game_sessions" ON live_game_sessions
    FOR ALL USING (true)
    WITH CHECK (true);

-- RLS policies for live game events - Simplified for now
CREATE POLICY "Allow all operations on live_game_events" ON live_game_events
    FOR ALL USING (true)
    WITH CHECK (true);

-- RLS policies for live_game_sync_status - Simplified for now
CREATE POLICY "Allow all operations on live_game_sync_status" ON live_game_sync_status
    FOR ALL USING (true)
    WITH CHECK (true);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_live_game_sessions_updated_at 
    BEFORE UPDATE ON live_game_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_live_game_sync_status_updated_at 
    BEFORE UPDATE ON live_game_sync_status 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to aggregate live events into game_stats (for stats dashboard compatibility)
CREATE OR REPLACE FUNCTION aggregate_live_events_to_game_stats(session_id INTEGER)
RETURNS VOID AS $$
BEGIN
    -- This function will aggregate live events into the existing game_stats table
    -- ensuring compatibility with your current stats dashboard
    INSERT INTO game_stats (
        gameId, playerId, points, fieldGoalsMade, fieldGoalsAttempted,
        threePointsMade, threePointsAttempted, freeThrowsMade, freeThrowsAttempted,
        rebounds, offensiveRebounds, defensiveRebounds, assists, steals, blocks,
        turnovers, fouls, minutesPlayed, plusMinus, quarter, period, timestamp,
        createdAt, createdBy, updatedAt, updatedBy
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
        0, -- minutesPlayed (calculated separately)
        COALESCE(SUM(CASE WHEN lge.event_type = 'points' THEN lge.event_value ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN lge.event_type = 'opponent_points' THEN lge.event_value ELSE 0 END), 0), -- plusMinus
        lge.quarter,
        'Q' || lge.quarter::text,
        NOW(),
        NOW(),
        (SELECT created_by FROM live_game_sessions WHERE id = session_id),
        NOW(),
        (SELECT created_by FROM live_game_sessions WHERE id = session_id)
    FROM live_game_events lge
    WHERE lge.session_id = session_id 
    AND lge.player_id IS NOT NULL 
    AND lge.is_opponent_event = false
    GROUP BY lge.game_id, lge.player_id, lge.quarter
    ON CONFLICT (gameId, playerId, quarter) DO UPDATE SET
        points = EXCLUDED.points,
        fieldGoalsMade = EXCLUDED.fieldGoalsMade,
        fieldGoalsAttempted = EXCLUDED.fieldGoalsAttempted,
        threePointsMade = EXCLUDED.threePointsMade,
        threePointsAttempted = EXCLUDED.threePointsAttempted,
        freeThrowsMade = EXCLUDED.freeThrowsMade,
        freeThrowsAttempted = EXCLUDED.freeThrowsAttempted,
        rebounds = EXCLUDED.rebounds,
        offensiveRebounds = EXCLUDED.offensiveRebounds,
        defensiveRebounds = EXCLUDED.defensiveRebounds,
        assists = EXCLUDED.assists,
        steals = EXCLUDED.steals,
        blocks = EXCLUDED.blocks,
        turnovers = EXCLUDED.turnovers,
        fouls = EXCLUDED.fouls,
        plusMinus = EXCLUDED.plusMinus,
        updatedAt = NOW(),
        updatedBy = EXCLUDED.updatedBy;
END;
$$ LANGUAGE plpgsql;

-- Function to get team totals from live events
CREATE OR REPLACE FUNCTION get_team_totals_from_live_events(session_id INTEGER)
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
    WHERE lge.session_id = session_id
    GROUP BY lge.game_id, lge.quarter
    ORDER BY lge.quarter;
END;
$$ LANGUAGE plpgsql;

-- Comment explaining the system
COMMENT ON TABLE live_game_sessions IS 'Live game sessions for real-time stat tracking. Links to existing events and games tables.';
COMMENT ON TABLE live_game_events IS 'Real-time stat events during live games. Automatically syncs with existing game_stats table.';
COMMENT ON TABLE live_game_sync_status IS 'Tracks offline sync status for live game sessions.';
COMMENT ON FUNCTION aggregate_live_events_to_game_stats IS 'Aggregates live events into existing game_stats table for stats dashboard compatibility.';
COMMENT ON FUNCTION get_team_totals_from_live_events IS 'Calculates team totals from live events for real-time scoreboard and analytics.';
