-- Add timeouts support to live game events and quarter totals
-- Since game_quarter_totals is a view, we need to add timeouts to the underlying data

-- Step 1: Add timeouts column to live_game_events table (if it exists)
DO $$ 
BEGIN
    -- Check if live_game_events table exists and add timeouts column
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'live_game_events') THEN
        -- Add timeouts column to live_game_events
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'live_game_events' 
            AND column_name = 'timeouts'
        ) THEN
            ALTER TABLE live_game_events 
            ADD COLUMN timeouts INTEGER DEFAULT 0;
            RAISE NOTICE 'Added timeouts column to live_game_events table';
        ELSE
            RAISE NOTICE 'timeouts column already exists in live_game_events table';
        END IF;
    END IF;
END $$;

-- Step 2: Add timeouts column to live_game_sessions table (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'live_game_sessions') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'live_game_sessions' 
            AND column_name = 'timeouts'
        ) THEN
            ALTER TABLE live_game_sessions 
            ADD COLUMN timeouts INTEGER DEFAULT 0;
            RAISE NOTICE 'Added timeouts column to live_game_sessions table';
        ELSE
            RAISE NOTICE 'timeouts column already exists in live_game_sessions table';
        END IF;
    END IF;
END $$;

-- Step 3: Create or recreate game_quarter_totals as a table (not view) with timeouts
-- First, drop the existing view if it exists
DROP VIEW IF EXISTS game_quarter_totals;

-- Create game_quarter_totals as a table with timeouts
CREATE TABLE IF NOT EXISTS game_quarter_totals (
    id SERIAL PRIMARY KEY,
    gameId INTEGER NOT NULL,
    quarter INTEGER NOT NULL,
    points INTEGER DEFAULT 0,
    reb INTEGER DEFAULT 0,
    ast INTEGER DEFAULT 0,
    stl INTEGER DEFAULT 0,
    blk INTEGER DEFAULT 0,
    tov INTEGER DEFAULT 0,
    pf INTEGER DEFAULT 0,
    timeouts INTEGER DEFAULT 0,  -- NEW: Timeouts column
    last_updated TIMESTAMP DEFAULT NOW(),
    UNIQUE(gameId, quarter)
);

-- Add foreign key constraint if games table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'games') THEN
        ALTER TABLE game_quarter_totals 
        ADD CONSTRAINT fk_game_quarter_totals_game 
        FOREIGN KEY (gameId) REFERENCES games(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_quarter_totals_game_quarter 
ON game_quarter_totals(gameId, quarter);

-- Add comment
COMMENT ON TABLE game_quarter_totals IS 'Quarter-by-quarter team statistics including timeouts';
COMMENT ON COLUMN game_quarter_totals.timeouts IS 'Number of timeouts taken in this quarter';

-- Verify the new table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'game_quarter_totals' 
ORDER BY ordinal_position;
