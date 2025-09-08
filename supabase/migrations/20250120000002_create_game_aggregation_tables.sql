-- Create missing game aggregation tables and aggregation function
-- This migration creates the tables and function needed to aggregate live game events
-- into traditional game statistics format

-- Create game_totals table
CREATE TABLE game_totals (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id),
  team_points INTEGER DEFAULT 0,
  opponent_points INTEGER DEFAULT 0,
  team_fgm INTEGER DEFAULT 0,
  team_fga INTEGER DEFAULT 0,
  team_3pm INTEGER DEFAULT 0,
  team_3pa INTEGER DEFAULT 0,
  team_ftm INTEGER DEFAULT 0,
  team_fta INTEGER DEFAULT 0,
  team_rebounds INTEGER DEFAULT 0,
  team_assists INTEGER DEFAULT 0,
  team_steals INTEGER DEFAULT 0,
  team_blocks INTEGER DEFAULT 0,
  team_turnovers INTEGER DEFAULT 0,
  team_fouls INTEGER DEFAULT 0,
  opponent_fgm INTEGER DEFAULT 0,
  opponent_fga INTEGER DEFAULT 0,
  opponent_3pm INTEGER DEFAULT 0,
  opponent_3pa INTEGER DEFAULT 0,
  opponent_ftm INTEGER DEFAULT 0,
  opponent_fta INTEGER DEFAULT 0,
  opponent_rebounds INTEGER DEFAULT 0,
  opponent_assists INTEGER DEFAULT 0,
  opponent_steals INTEGER DEFAULT 0,
  opponent_blocks INTEGER DEFAULT 0,
  opponent_turnovers INTEGER DEFAULT 0,
  opponent_fouls INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create game_player_totals table
CREATE TABLE game_player_totals (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id),
  player_id INTEGER REFERENCES players(id),
  points INTEGER DEFAULT 0,
  fgm INTEGER DEFAULT 0,
  fga INTEGER DEFAULT 0,
  fg_percentage DECIMAL(5,2) DEFAULT 0,
  threepm INTEGER DEFAULT 0,
  threepa INTEGER DEFAULT 0,
  three_percentage DECIMAL(5,2) DEFAULT 0,
  ftm INTEGER DEFAULT 0,
  fta INTEGER DEFAULT 0,
  ft_percentage DECIMAL(5,2) DEFAULT 0,
  rebounds INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  steals INTEGER DEFAULT 0,
  blocks INTEGER DEFAULT 0,
  turnovers INTEGER DEFAULT 0,
  fouls INTEGER DEFAULT 0,
  minutes_played INTEGER DEFAULT 0,
  plus_minus INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create game_quarter_totals table
CREATE TABLE game_quarter_totals (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id),
  quarter INTEGER NOT NULL,
  team_points INTEGER DEFAULT 0,
  opponent_points INTEGER DEFAULT 0,
  team_fgm INTEGER DEFAULT 0,
  team_fga INTEGER DEFAULT 0,
  team_rebounds INTEGER DEFAULT 0,
  team_assists INTEGER DEFAULT 0,
  team_steals INTEGER DEFAULT 0,
  team_blocks INTEGER DEFAULT 0,
  team_turnovers INTEGER DEFAULT 0,
  team_fouls INTEGER DEFAULT 0,
  opponent_fgm INTEGER DEFAULT 0,
  opponent_fga INTEGER DEFAULT 0,
  opponent_rebounds INTEGER DEFAULT 0,
  opponent_assists INTEGER DEFAULT 0,
  opponent_steals INTEGER DEFAULT 0,
  opponent_blocks INTEGER DEFAULT 0,
  opponent_turnovers INTEGER DEFAULT 0,
  opponent_fouls INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, quarter)
);

-- Create function to aggregate live events to game stats
CREATE OR REPLACE FUNCTION aggregate_live_events_to_game_stats(session_id_param INTEGER)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    session_record RECORD;
    event_record RECORD;
    game_record RECORD;
    player_stat RECORD;
BEGIN
    -- Get session details
    SELECT * INTO session_record
    FROM live_game_sessions
    WHERE id = session_id_param;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Session not found: %', session_id_param;
    END IF;

    -- Create or update game record
    IF session_record.game_id IS NULL THEN
        -- Create new game record
        INSERT INTO games (
            event_id,
            opponent,
            home_score,
            away_score,
            game_date,
            created_by,
            updated_by
        ) VALUES (
            session_record.event_id,
            'Opponent', -- Default opponent name
            0, -- Will be updated from events
            0, -- Will be updated from events
            NOW(),
            session_record.created_by,
            session_record.created_by
        )
        RETURNING * INTO game_record;

        -- Update session with game_id
        UPDATE live_game_sessions
        SET game_id = game_record.id
        WHERE id = session_id_param;
    ELSE
        -- Get existing game
        SELECT * INTO game_record
        FROM games
        WHERE id = session_record.game_id;
    END IF;

    -- Clear existing aggregated data for this game
    DELETE FROM game_stats WHERE game_id = game_record.id;
    DELETE FROM game_totals WHERE game_id = game_record.id;
    DELETE FROM game_player_totals WHERE game_id = game_record.id;
    DELETE FROM game_quarter_totals WHERE game_id = game_record.id;

    -- Aggregate events into game_stats by player
    FOR event_record IN
        SELECT
            player_id,
            event_type,
            event_value,
            quarter,
            game_time,
            is_opponent_event,
            COUNT(*) as event_count
        FROM live_game_events
        WHERE session_id = session_id_param
        AND player_id IS NOT NULL
        GROUP BY player_id, event_type, event_value, quarter, game_time, is_opponent_event
    LOOP
        -- Insert/update game_stats record
        INSERT INTO game_stats (
            game_id,
            player_id,
            user_id,
            points,
            field_goals_made,
            field_goals_attempted,
            three_points_made,
            three_points_attempted,
            free_throws_made,
            free_throws_attempted,
            rebounds,
            assists,
            steals,
            blocks,
            turnovers,
            fouls,
            minutes_played,
            quarter,
            created_by,
            updated_by
        ) VALUES (
            game_record.id,
            event_record.player_id,
            session_record.created_by,
            CASE WHEN event_record.event_type = 'fg_made' THEN 2 ELSE 0 END,
            CASE WHEN event_record.event_type = 'fg_made' THEN 1 ELSE 0 END,
            CASE WHEN event_record.event_type IN ('fg_made', 'fg_missed') THEN 1 ELSE 0 END,
            CASE WHEN event_record.event_type = 'three_made' THEN 1 ELSE 0 END,
            CASE WHEN event_record.event_type IN ('three_made', 'three_missed') THEN 1 ELSE 0 END,
            CASE WHEN event_record.event_type = 'ft_made' THEN 1 ELSE 0 END,
            CASE WHEN event_record.event_type IN ('ft_made', 'ft_missed') THEN 1 ELSE 0 END,
            CASE WHEN event_record.event_type = 'rebound' THEN 1 ELSE 0 END,
            CASE WHEN event_record.event_type = 'assist' THEN 1 ELSE 0 END,
            CASE WHEN event_record.event_type = 'steal' THEN 1 ELSE 0 END,
            CASE WHEN event_record.event_type = 'block' THEN 1 ELSE 0 END,
            CASE WHEN event_record.event_type = 'turnover' THEN 1 ELSE 0 END,
            CASE WHEN event_record.event_type = 'foul' THEN 1 ELSE 0 END,
            0, -- minutes_played, would need to be calculated from game_time
            event_record.quarter,
            session_record.created_by,
            session_record.created_by
        )
        ON CONFLICT (game_id, player_id, quarter)
        DO UPDATE SET
            points = game_stats.points + EXCLUDED.points,
            field_goals_made = game_stats.field_goals_made + EXCLUDED.field_goals_made,
            field_goals_attempted = game_stats.field_goals_attempted + EXCLUDED.field_goals_attempted,
            three_points_made = game_stats.three_points_made + EXCLUDED.three_points_made,
            three_points_attempted = game_stats.three_points_attempted + EXCLUDED.three_points_attempted,
            free_throws_made = game_stats.free_throws_made + EXCLUDED.free_throws_made,
            free_throws_attempted = game_stats.free_throws_attempted + EXCLUDED.free_throws_attempted,
            rebounds = game_stats.rebounds + EXCLUDED.rebounds,
            assists = game_stats.assists + EXCLUDED.assists,
            steals = game_stats.steals + EXCLUDED.steals,
            blocks = game_stats.blocks + EXCLUDED.blocks,
            turnovers = game_stats.turnovers + EXCLUDED.turnovers,
            fouls = game_stats.fouls + EXCLUDED.fouls,
            updated_at = NOW();
    END LOOP;

    -- Aggregate into game_player_totals
    INSERT INTO game_player_totals (
        game_id,
        player_id,
        points,
        fgm,
        fga,
        fg_percentage,
        threepm,
        threepa,
        three_percentage,
        ftm,
        fta,
        ft_percentage,
        rebounds,
        assists,
        steals,
        blocks,
        turnovers,
        fouls,
        created_by,
        updated_by
    )
    SELECT
        game_id,
        player_id,
        COALESCE(SUM(points), 0) as points,
        COALESCE(SUM(field_goals_made), 0) as fgm,
        COALESCE(SUM(field_goals_attempted), 0) as fga,
        CASE WHEN SUM(field_goals_attempted) > 0
             THEN ROUND((SUM(field_goals_made)::DECIMAL / SUM(field_goals_attempted)::DECIMAL * 100), 2)
             ELSE 0 END as fg_percentage,
        COALESCE(SUM(three_points_made), 0) as threepm,
        COALESCE(SUM(three_points_attempted), 0) as threepa,
        CASE WHEN SUM(three_points_attempted) > 0
             THEN ROUND((SUM(three_points_made)::DECIMAL / SUM(three_points_attempted)::DECIMAL * 100), 2)
             ELSE 0 END as three_percentage,
        COALESCE(SUM(free_throws_made), 0) as ftm,
        COALESCE(SUM(free_throws_attempted), 0) as fta,
        CASE WHEN SUM(free_throws_attempted) > 0
             THEN ROUND((SUM(free_throws_made)::DECIMAL / SUM(free_throws_attempted)::DECIMAL * 100), 2)
             ELSE 0 END as ft_percentage,
        COALESCE(SUM(rebounds), 0) as rebounds,
        COALESCE(SUM(assists), 0) as assists,
        COALESCE(SUM(steals), 0) as steals,
        COALESCE(SUM(blocks), 0) as blocks,
        COALESCE(SUM(turnovers), 0) as turnovers,
        COALESCE(SUM(fouls), 0) as fouls,
        session_record.created_by,
        session_record.created_by
    FROM game_stats
    WHERE game_id = game_record.id
    GROUP BY game_id, player_id;

    -- Aggregate into game_quarter_totals
    INSERT INTO game_quarter_totals (
        game_id,
        quarter,
        team_points,
        team_fgm,
        team_fga,
        team_rebounds,
        team_assists,
        team_steals,
        team_blocks,
        team_turnovers,
        team_fouls,
        opponent_points,
        opponent_fgm,
        opponent_fga,
        opponent_rebounds,
        opponent_assists,
        opponent_steals,
        opponent_blocks,
        opponent_turnovers,
        opponent_fouls,
        created_by,
        updated_by
    )
    SELECT
        game_id,
        quarter,
        COALESCE(SUM(CASE WHEN NOT is_opponent_event THEN points ELSE 0 END), 0) as team_points,
        COALESCE(SUM(CASE WHEN NOT is_opponent_event THEN field_goals_made ELSE 0 END), 0) as team_fgm,
        COALESCE(SUM(CASE WHEN NOT is_opponent_event THEN field_goals_attempted ELSE 0 END), 0) as team_fga,
        COALESCE(SUM(CASE WHEN NOT is_opponent_event THEN rebounds ELSE 0 END), 0) as team_rebounds,
        COALESCE(SUM(CASE WHEN NOT is_opponent_event THEN assists ELSE 0 END), 0) as team_assists,
        COALESCE(SUM(CASE WHEN NOT is_opponent_event THEN steals ELSE 0 END), 0) as team_steals,
        COALESCE(SUM(CASE WHEN NOT is_opponent_event THEN blocks ELSE 0 END), 0) as team_blocks,
        COALESCE(SUM(CASE WHEN NOT is_opponent_event THEN turnovers ELSE 0 END), 0) as team_turnovers,
        COALESCE(SUM(CASE WHEN NOT is_opponent_event THEN fouls ELSE 0 END), 0) as team_fouls,
        COALESCE(SUM(CASE WHEN is_opponent_event THEN points ELSE 0 END), 0) as opponent_points,
        COALESCE(SUM(CASE WHEN is_opponent_event THEN field_goals_made ELSE 0 END), 0) as opponent_fgm,
        COALESCE(SUM(CASE WHEN is_opponent_event THEN field_goals_attempted ELSE 0 END), 0) as opponent_fga,
        COALESCE(SUM(CASE WHEN is_opponent_event THEN rebounds ELSE 0 END), 0) as opponent_rebounds,
        COALESCE(SUM(CASE WHEN is_opponent_event THEN assists ELSE 0 END), 0) as opponent_assists,
        COALESCE(SUM(CASE WHEN is_opponent_event THEN steals ELSE 0 END), 0) as opponent_steals,
        COALESCE(SUM(CASE WHEN is_opponent_event THEN blocks ELSE 0 END), 0) as opponent_blocks,
        COALESCE(SUM(CASE WHEN is_opponent_event THEN turnovers ELSE 0 END), 0) as opponent_turnovers,
        COALESCE(SUM(CASE WHEN is_opponent_event THEN fouls ELSE 0 END), 0) as opponent_fouls,
        session_record.created_by,
        session_record.created_by
    FROM game_stats
    WHERE game_id = game_record.id
    GROUP BY game_id, quarter;

    -- Aggregate into game_totals
    INSERT INTO game_totals (
        game_id,
        team_points,
        team_fgm,
        team_fga,
        team_3pm,
        team_3pa,
        team_rebounds,
        team_assists,
        team_steals,
        team_blocks,
        team_turnovers,
        team_fouls,
        opponent_points,
        opponent_fgm,
        opponent_fga,
        opponent_3pm,
        opponent_3pa,
        opponent_rebounds,
        opponent_assists,
        opponent_steals,
        opponent_blocks,
        opponent_turnovers,
        opponent_fouls,
        created_by,
        updated_by
    )
    SELECT
        game_id,
        COALESCE(SUM(team_points), 0) as team_points,
        COALESCE(SUM(team_fgm), 0) as team_fgm,
        COALESCE(SUM(team_fga), 0) as team_fga,
        COALESCE(SUM(team_3pm), 0) as team_3pm,
        COALESCE(SUM(team_3pa), 0) as team_3pa,
        COALESCE(SUM(team_rebounds), 0) as team_rebounds,
        COALESCE(SUM(team_assists), 0) as team_assists,
        COALESCE(SUM(team_steals), 0) as team_steals,
        COALESCE(SUM(team_blocks), 0) as team_blocks,
        COALESCE(SUM(team_turnovers), 0) as team_turnovers,
        COALESCE(SUM(team_fouls), 0) as team_fouls,
        COALESCE(SUM(opponent_points), 0) as opponent_points,
        COALESCE(SUM(opponent_fgm), 0) as opponent_fgm,
        COALESCE(SUM(opponent_fga), 0) as opponent_fga,
        COALESCE(SUM(opponent_3pm), 0) as opponent_3pm,
        COALESCE(SUM(opponent_3pa), 0) as opponent_3pa,
        COALESCE(SUM(opponent_rebounds), 0) as opponent_rebounds,
        COALESCE(SUM(opponent_assists), 0) as opponent_assists,
        COALESCE(SUM(opponent_steals), 0) as opponent_steals,
        COALESCE(SUM(opponent_blocks), 0) as opponent_blocks,
        COALESCE(SUM(opponent_turnovers), 0) as opponent_turnovers,
        COALESCE(SUM(opponent_fouls), 0) as opponent_fouls,
        session_record.created_by,
        session_record.created_by
    FROM game_quarter_totals
    WHERE game_id = game_record.id
    GROUP BY game_id;

    -- Update games table with final scores
    UPDATE games
    SET
        home_score = COALESCE((SELECT team_points FROM game_totals WHERE game_id = games.id), 0),
        away_score = COALESCE((SELECT opponent_points FROM game_totals WHERE game_id = games.id), 0),
        result = CASE
            WHEN (SELECT team_points FROM game_totals WHERE game_id = games.id) > (SELECT opponent_points FROM game_totals WHERE game_id = games.id) THEN 'WIN'
            WHEN (SELECT team_points FROM game_totals WHERE game_id = games.id) < (SELECT opponent_points FROM game_totals WHERE game_id = games.id) THEN 'LOSS'
            ELSE 'TIE'
        END,
        updated_at = NOW(),
        updated_by = session_record.created_by
    WHERE id = game_record.id;

END;
$$;
