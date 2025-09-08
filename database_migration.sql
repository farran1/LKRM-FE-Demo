-- Database Migration for LKRM Player Management System
-- This migration fixes the players table schema and creates proper notes/goals tables

-- Step 1: Create the school_year enum type
CREATE TYPE school_year_enum AS ENUM ('freshman', 'sophomore', 'junior', 'senior');

-- Step 2: Drop the existing players table if it exists (WARNING: This will delete all existing data)
DROP TABLE IF EXISTS players CASCADE;

-- Step 3: Create the new players table with proper schema
CREATE TABLE players (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    school_year school_year_enum NOT NULL,
    position_id BIGINT NOT NULL REFERENCES positions(id),
    jersey_number VARCHAR(10) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create indexes for better performance
CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_players_position_id ON players(position_id);
CREATE INDEX idx_players_school_year ON players(school_year);
CREATE INDEX idx_players_is_active ON players(is_active);
CREATE INDEX idx_players_name_search ON players(first_name, last_name);

-- Step 5: Create the player_notes table
CREATE TABLE player_notes (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Create the player_goals table
CREATE TABLE player_goals (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    goal_text TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Create indexes for notes and goals
CREATE INDEX idx_player_notes_player_id ON player_notes(player_id);
CREATE INDEX idx_player_goals_player_id ON player_goals(player_id);
CREATE INDEX idx_player_notes_user_id ON player_notes(user_id);
CREATE INDEX idx_player_goals_user_id ON player_goals(user_id);

-- Step 8: Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 9: Create trigger to automatically update updated_at
CREATE TRIGGER update_players_updated_at 
    BEFORE UPDATE ON players 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 10: Insert default positions if they don't exist
INSERT INTO positions (name, abbreviation) 
VALUES 
    ('Center', 'C'),
    ('Forward', 'F'),
    ('Guard', 'G')
ON CONFLICT (name) DO NOTHING;

-- Step 11: Grant permissions (adjust as needed for your setup)
GRANT ALL ON TABLE players TO authenticated;
GRANT ALL ON TABLE player_notes TO authenticated;
GRANT ALL ON TABLE player_goals TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 12: Enable Row Level Security (RLS) for multi-tenant security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_goals ENABLE ROW LEVEL SECURITY;

-- Step 13: Create RLS policies
CREATE POLICY "Users can view their own players" ON players
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own players" ON players
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own players" ON players
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own players" ON players
    FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for notes and goals
CREATE POLICY "Users can view notes for their players" ON player_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM players 
            WHERE players.id = player_notes.player_id 
            AND players.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert notes for their players" ON player_notes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM players 
            WHERE players.id = player_notes.player_id 
            AND players.user_id = auth.uid()
        )
    );

-- Similar policies for goals
CREATE POLICY "Users can view goals for their players" ON player_goals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM players 
            WHERE players.id = player_goals.player_id 
            AND players.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert goals for their players" ON player_goals
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM players 
            WHERE players.id = player_goals.player_id 
            AND players.user_id = auth.uid()
        )
    );

-- Step 14: Create a view for easy player data retrieval
CREATE VIEW player_details AS
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.school_year,
    p.position_id,
    pos.name as position_name,
    pos.abbreviation as position_abbreviation,
    p.jersey_number,
    p.user_id,
    p.is_active,
    p.created_at,
    p.updated_at,
    COUNT(DISTINCT pn.id) as notes_count,
    COUNT(DISTINCT pg.id) as goals_count
FROM players p
LEFT JOIN positions pos ON p.position_id = pos.id
LEFT JOIN player_notes pn ON p.id = pn.player_id
LEFT JOIN player_goals pg ON p.id = pg.player_id
GROUP BY p.id, pos.name, pos.abbreviation;

-- Grant access to the view
GRANT SELECT ON player_details TO authenticated;
