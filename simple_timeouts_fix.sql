-- Simple fix: Add timeouts to game_quarter_totals by recreating as table
-- This is the safest approach since we know it's currently a view

-- Step 1: Drop the existing view
DROP VIEW IF EXISTS game_quarter_totals CASCADE;

-- Step 2: Create game_quarter_totals as a table with all existing columns plus timeouts
CREATE TABLE game_quarter_totals (
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

-- Step 3: Add foreign key constraint to games table
ALTER TABLE game_quarter_totals 
ADD CONSTRAINT fk_game_quarter_totals_game 
FOREIGN KEY (gameId) REFERENCES games(id) ON DELETE CASCADE;

-- Step 4: Add indexes for performance
CREATE INDEX idx_game_quarter_totals_game_quarter 
ON game_quarter_totals(gameId, quarter);

-- Step 5: Add comments
COMMENT ON TABLE game_quarter_totals IS 'Quarter-by-quarter team statistics including timeouts';
COMMENT ON COLUMN game_quarter_totals.timeouts IS 'Number of timeouts taken in this quarter';

-- Step 6: Verify the table was created correctly
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'game_quarter_totals' 
ORDER BY ordinal_position;
