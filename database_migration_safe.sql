-- Safe Database Migration for LKRM Player Management System
-- This migration safely updates the existing database schema

-- Step 1: Check what tables exist and create school_year enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'school_year_enum') THEN
        CREATE TYPE school_year_enum AS ENUM ('freshman', 'sophomore', 'junior', 'senior');
        RAISE NOTICE 'Created school_year_enum type';
    ELSE
        RAISE NOTICE 'school_year_enum type already exists';
    END IF;
END $$;

-- Step 2: Create positions table if it doesn't exist
CREATE TABLE IF NOT EXISTS positions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    abbreviation VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Insert default positions if they don't exist
INSERT INTO positions (name, abbreviation) 
VALUES 
    ('Center', 'C'),
    ('Forward', 'F'),
    ('Guard', 'G')
ON CONFLICT (name) DO NOTHING;

-- Step 4: Check if players table exists and what its current structure is
DO $$
DECLARE
    table_exists BOOLEAN;
    column_exists BOOLEAN;
BEGIN
    -- Check if players table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'players'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'Players table exists, checking structure...';
        
        -- Check if first_name column exists
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'players' 
            AND column_name = 'first_name'
        ) INTO column_exists;
        
        IF NOT column_exists THEN
            RAISE NOTICE 'Adding new columns to existing players table...';
            
            -- Add new columns to existing table
            ALTER TABLE players ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
            ALTER TABLE players ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
            ALTER TABLE players ADD COLUMN IF NOT EXISTS school_year school_year_enum;
            ALTER TABLE players ADD COLUMN IF NOT EXISTS jersey_number VARCHAR(10);
            
            -- If there's an existing 'name' column, split it into first_name and last_name
            IF EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'players' 
                AND column_name = 'name'
            ) THEN
                -- Update existing records to split the name
                UPDATE players 
                SET 
                    first_name = COALESCE(SPLIT_PART(name, ' ', 1), ''),
                    last_name = COALESCE(SUBSTRING(name FROM POSITION(' ' IN name) + 1), ''),
                    school_year = 'freshman'::school_year_enum,
                    jersey_number = COALESCE(jersey::text, '0')
                WHERE first_name IS NULL OR last_name IS NULL;
                
                -- Make columns NOT NULL after populating them
                ALTER TABLE players ALTER COLUMN first_name SET NOT NULL;
                ALTER TABLE players ALTER COLUMN last_name SET NOT NULL;
                ALTER TABLE players ALTER COLUMN school_year SET NOT NULL;
                ALTER TABLE players ALTER COLUMN jersey_number SET NOT NULL;
                
                -- Drop old columns if they exist
                ALTER TABLE players DROP COLUMN IF EXISTS name;
                ALTER TABLE players DROP COLUMN IF EXISTS jersey;
                ALTER TABLE players DROP COLUMN IF EXISTS phone_number;
                ALTER TABLE players DROP COLUMN IF EXISTS height;
            END IF;
        ELSE
            RAISE NOTICE 'Players table already has the new structure';
        END IF;
    ELSE
        RAISE NOTICE 'Creating new players table...';
        
        -- Create the new players table
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
    END IF;
END $$;

-- Step 5: Create indexes for players table
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);
CREATE INDEX IF NOT EXISTS idx_players_position_id ON players(position_id);
CREATE INDEX IF NOT EXISTS idx_players_school_year ON players(school_year);
CREATE INDEX IF NOT EXISTS idx_players_is_active ON players(is_active);
CREATE INDEX IF NOT EXISTS idx_players_name_search ON players(first_name, last_name);

-- Step 6: Create player_notes table if it doesn't exist
CREATE TABLE IF NOT EXISTS player_notes (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Create player_goals table if it doesn't exist
CREATE TABLE IF NOT EXISTS player_goals (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    goal_text TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 8: Create indexes for notes and goals
CREATE INDEX IF NOT EXISTS idx_player_notes_player_id ON player_notes(player_id);
CREATE INDEX IF NOT EXISTS idx_player_goals_player_id ON player_goals(player_id);
CREATE INDEX IF NOT EXISTS idx_player_notes_user_id ON player_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_player_goals_user_id ON player_goals(user_id);

-- Step 9: Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 10: Create trigger to automatically update updated_at (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_players_updated_at'
    ) THEN
        CREATE TRIGGER update_players_updated_at 
            BEFORE UPDATE ON players 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created update_updated_at trigger';
    ELSE
        RAISE NOTICE 'update_updated_at trigger already exists';
    END IF;
END $$;

-- Step 11: Grant permissions (adjust as needed for your setup)
GRANT ALL ON TABLE players TO authenticated;
GRANT ALL ON TABLE player_notes TO authenticated;
GRANT ALL ON TABLE player_goals TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 12: Enable Row Level Security (RLS) for multi-tenant security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_goals ENABLE ROW LEVEL SECURITY;

-- Step 13: Drop existing RLS policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view their own players" ON players;
DROP POLICY IF EXISTS "Users can insert their own players" ON players;
DROP POLICY IF EXISTS "Users can update their own players" ON players;
DROP POLICY IF EXISTS "Users can delete their own players" ON players;

-- Create RLS policies
CREATE POLICY "Users can view their own players" ON players
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own players" ON players
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own players" ON players
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own players" ON players
    FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for notes and goals
DROP POLICY IF EXISTS "Users can view notes for their players" ON player_notes;
DROP POLICY IF EXISTS "Users can insert notes for their players" ON player_notes;

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
DROP POLICY IF EXISTS "Users can view goals for their players" ON player_goals;
DROP POLICY IF EXISTS "Users can insert goals for their players" ON player_goals;

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

-- Step 14: Drop existing view if it exists and recreate it
DROP VIEW IF EXISTS player_details;

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

-- Step 15: Final verification
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Please verify the setup by running the verification queries in DATABASE_SETUP.md';
END $$;
