-- Create live stat tracking tables for full-stack integration
-- Run this migration in your Supabase SQL editor

-- 1. Live Game Sessions table
CREATE TABLE IF NOT EXISTS live_game_sessions (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    session_key TEXT UNIQUE NOT NULL,
    game_state JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Live Game Events table (real-time stat tracking)
CREATE TABLE IF NOT EXISTS live_game_events (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES live_game_sessions(id) ON DELETE CASCADE,
    player_id INTEGER REFERENCES players(id),
    event_type TEXT NOT NULL,
    event_value INTEGER,
    quarter INTEGER NOT NULL,
    game_time INTEGER NOT NULL, -- seconds from start of quarter
    is_opponent_event BOOLEAN DEFAULT false,
    opponent_jersey TEXT, -- for opponent events without player_id
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Live Game Lineups table
CREATE TABLE IF NOT EXISTS live_game_lineups (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES live_game_sessions(id) ON DELETE CASCADE,
    lineup_name TEXT,
    player_ids INTEGER[] NOT NULL,
    start_time INTEGER NOT NULL, -- seconds from start of game
    end_time INTEGER, -- NULL if still active
    plus_minus INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Live Game Substitutions table
CREATE TABLE IF NOT EXISTS live_game_substitutions (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES live_game_sessions(id) ON DELETE CASCADE,
    player_in_id INTEGER NOT NULL REFERENCES players(id),
    player_out_id INTEGER NOT NULL REFERENCES players(id),
    quarter INTEGER NOT NULL,
    game_time INTEGER NOT NULL,
    lineup_id INTEGER REFERENCES live_game_lineups(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Live Game Settings table
CREATE TABLE IF NOT EXISTS live_game_settings (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES live_game_sessions(id) ON DELETE CASCADE,
    quarter_duration INTEGER DEFAULT 600, -- seconds
    total_quarters INTEGER DEFAULT 4,
    timeout_count INTEGER DEFAULT 4,
    shot_clock INTEGER DEFAULT 30,
    auto_pause_on_timeout BOOLEAN DEFAULT true,
    auto_pause_on_quarter_end BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Live Game Timeouts table
CREATE TABLE IF NOT EXISTS live_game_timeouts (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES live_game_sessions(id) ON DELETE CASCADE,
    team TEXT NOT NULL CHECK (team IN ('home', 'away')),
    quarter INTEGER NOT NULL,
    game_time INTEGER NOT NULL,
    duration INTEGER DEFAULT 60, -- seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Live Game Sync Status table (for offline sync)
CREATE TABLE IF NOT EXISTS live_game_sync_status (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES live_game_sessions(id) ON DELETE CASCADE,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'failed')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_game_sessions_event_id ON live_game_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_live_game_sessions_session_key ON live_game_sessions(session_key);
CREATE INDEX IF NOT EXISTS idx_live_game_sessions_is_active ON live_game_sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_live_game_events_session_id ON live_game_events(session_id);
CREATE INDEX IF NOT EXISTS idx_live_game_events_player_id ON live_game_events(player_id);
CREATE INDEX IF NOT EXISTS idx_live_game_events_event_type ON live_game_events(event_type);
CREATE INDEX IF NOT EXISTS idx_live_game_events_quarter ON live_game_events(quarter);

CREATE INDEX IF NOT EXISTS idx_live_game_lineups_session_id ON live_game_lineups(session_id);
CREATE INDEX IF NOT EXISTS idx_live_game_substitutions_session_id ON live_game_substitutions(session_id);

-- Create RLS policies for security
ALTER TABLE live_game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_game_lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_game_substitutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_game_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_game_timeouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_game_sync_status ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be enhanced based on your auth requirements)
CREATE POLICY "Users can view their own live game sessions" ON live_game_sessions
    FOR SELECT USING (created_by = auth.uid()::integer OR EXISTS (
        SELECT 1 FROM event_coaches ec 
        WHERE ec."eventId" = live_game_sessions.event_id 
        AND ec."coachUsername" = (SELECT username FROM users WHERE id = auth.uid()::integer)
    ));

CREATE POLICY "Users can insert their own live game sessions" ON live_game_sessions
    FOR INSERT WITH CHECK (created_by = auth.uid()::integer);

CREATE POLICY "Users can update their own live game sessions" ON live_game_sessions
    FOR UPDATE USING (created_by = auth.uid()::integer);

-- Similar policies for other tables
CREATE POLICY "Users can view events in their sessions" ON live_game_events
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM live_game_sessions lgs 
        WHERE lgs.id = live_game_events.session_id 
        AND (lgs.created_by = auth.uid()::integer OR EXISTS (
            SELECT 1 FROM event_coaches ec 
            WHERE ec."eventId" = lgs.event_id 
            AND ec."coachUsername" = (SELECT username FROM users WHERE id = auth.uid()::integer)
        ))
    ));

CREATE POLICY "Users can insert events in their sessions" ON live_game_events
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM live_game_sessions lgs 
        WHERE lgs.id = live_game_events.session_id 
        AND lgs.created_by = auth.uid()::integer
    ));

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

CREATE TRIGGER update_live_game_settings_updated_at 
    BEFORE UPDATE ON live_game_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_live_game_sync_status_updated_at 
    BEFORE UPDATE ON live_game_sync_status 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
