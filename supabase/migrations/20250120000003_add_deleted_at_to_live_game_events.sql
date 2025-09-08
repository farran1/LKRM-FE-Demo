-- Add soft-delete support to live_game_events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns 
    WHERE table_name='live_game_events' 
      AND column_name='deleted_at'
  ) THEN
    ALTER TABLE live_game_events
    ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;
END $$;

-- Optional helper index for querying active events
CREATE INDEX IF NOT EXISTS idx_live_game_events_deleted_at
  ON live_game_events (deleted_at);

