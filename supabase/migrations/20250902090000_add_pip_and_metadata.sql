-- Add Points in Paint support and event metadata for live stat tracker

-- 1) Add points_in_paint column to game_stats if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='game_stats' AND column_name='points_in_paint'
  ) THEN
    ALTER TABLE game_stats ADD COLUMN points_in_paint INTEGER NOT NULL DEFAULT 0;
  END IF;
END$$;

-- 2) Add metadata column on live_game_events to capture per-event flags (e.g., pip)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='live_game_events' AND column_name='metadata'
  ) THEN
    ALTER TABLE live_game_events ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;
END$$;

-- 3) Update aggregate function to carry PIP into game_stats
-- Tries to replace both possible function names if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'aggregate_live_events_to_game_stats'
  ) THEN
    DROP FUNCTION IF EXISTS aggregate_live_events_to_game_stats(INTEGER);
  END IF;
END$$;

CREATE OR REPLACE FUNCTION aggregate_live_events_to_game_stats(session_id_param INTEGER)
RETURNS VOID AS $$
DECLARE
  game_record RECORD;
BEGIN
  -- Find the game for this live session
  SELECT g.* INTO game_record
  FROM games g
  JOIN live_game_sessions s ON s.game_id = g.id
  WHERE s.id = session_id_param
  LIMIT 1;

  IF game_record IS NULL THEN
    RAISE NOTICE 'No game found for session %', session_id_param;
    RETURN;
  END IF;

  -- Remove any pre-existing aggregates for this game (re-aggregate)
  DELETE FROM game_stats WHERE game_id = game_record.id;

  -- Aggregate per player from live events
  INSERT INTO game_stats (
    game_id, player_id, quarter,
    points, field_goals_made, field_goals_attempted,
    three_points_made, three_points_attempted,
    free_throws_made, free_throws_attempted,
    rebounds, assists, steals, blocks,
    turnovers, fouls,
    points_in_paint
  )
  SELECT
    game_record.id AS game_id,
    e.player_id,
    COALESCE(e.quarter, 0) AS quarter,
    -- points
    SUM(
      CASE 
        WHEN e.event_type = 'three_made' THEN 3
        WHEN e.event_type = 'ft_made' THEN 1
        WHEN e.event_type IN ('fg_made','points') THEN COALESCE(e.value, 2)
        ELSE 0
      END
    ) AS points,
    -- FG
    SUM(CASE WHEN e.event_type IN ('fg_made') THEN 1 ELSE 0 END) AS field_goals_made,
    SUM(CASE WHEN e.event_type IN ('fg_made','fg_attempt','three_made','three_attempt') THEN 1 ELSE 0 END) AS field_goals_attempted,
    -- 3PT
    SUM(CASE WHEN e.event_type = 'three_made' THEN 1 ELSE 0 END) AS three_points_made,
    SUM(CASE WHEN e.event_type = 'three_made' OR e.event_type = 'three_attempt' THEN 1 ELSE 0 END) AS three_points_attempted,
    -- FT
    SUM(CASE WHEN e.event_type = 'ft_made' THEN 1 ELSE 0 END) AS free_throws_made,
    SUM(CASE WHEN e.event_type IN ('ft_made','ft_attempt') THEN 1 ELSE 0 END) AS free_throws_attempted,
    -- Others (simplified; real function may be more detailed)
    SUM(CASE WHEN e.event_type IN ('offensive_rebound','defensive_rebound','rebound') THEN 1 ELSE 0 END) AS rebounds,
    SUM(CASE WHEN e.event_type = 'assist' THEN 1 ELSE 0 END) AS assists,
    SUM(CASE WHEN e.event_type = 'steal' THEN 1 ELSE 0 END) AS steals,
    SUM(CASE WHEN e.event_type = 'block' THEN 1 ELSE 0 END) AS blocks,
    SUM(CASE WHEN e.event_type = 'turnover' THEN 1 ELSE 0 END) AS turnovers,
    SUM(CASE WHEN e.event_type = 'foul' THEN 1 ELSE 0 END) AS fouls,
    -- Points in Paint: attribute 2 points when metadata.pip = true on fg_made
    SUM(
      CASE 
        WHEN e.event_type = 'fg_made' AND (e.metadata->>'pip')::boolean IS TRUE THEN 2
        ELSE 0
      END
    ) AS points_in_paint
  FROM live_game_events e
  WHERE e.session_id = session_id_param AND COALESCE(e.is_opponent,false) = FALSE
  GROUP BY e.player_id, COALESCE(e.quarter,0);

END;
$$ LANGUAGE plpgsql;


