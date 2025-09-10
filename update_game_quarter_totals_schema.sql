-- Update game_quarter_totals table to include timeouts
-- This migration adds the missing timeouts column to track timeouts per quarter

-- Add timeouts column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'game_quarter_totals' 
        AND column_name = 'timeouts'
    ) THEN
        ALTER TABLE game_quarter_totals 
        ADD COLUMN timeouts INTEGER DEFAULT 0;
        
        -- Add comment to document the column
        COMMENT ON COLUMN game_quarter_totals.timeouts IS 'Number of timeouts taken in this quarter';
        
        RAISE NOTICE 'Added timeouts column to game_quarter_totals table';
    ELSE
        RAISE NOTICE 'timeouts column already exists in game_quarter_totals table';
    END IF;
END $$;

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'game_quarter_totals' 
ORDER BY ordinal_position;
