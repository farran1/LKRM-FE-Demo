-- Fix the aggregation function to handle null game_id values
-- This creates a fallback game record if none exists

CREATE OR REPLACE FUNCTION public.aggregate_live_events_to_game_stats(session_id_param integer)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    session_game_id integer;
    session_event_id integer;
    fallback_game_id integer;
BEGIN
    -- Get session info
    SELECT game_id, event_id INTO session_game_id, session_event_id
    FROM live_game_sessions 
    WHERE id = session_id_param;
    
    -- If we don't have a game_id, try to find or create one
    IF session_game_id IS NULL THEN
        -- Try to find existing game for this event
        SELECT id INTO session_game_id 
        FROM games 
        WHERE "eventId" = session_event_id 
        LIMIT 1;
        
        -- If still no game found, create a fallback game
        IF session_game_id IS NULL THEN
            INSERT INTO games (
                "eventId", opponent, "gameDate", season, "isPlayoffs", 
                "createdAt", "createdBy", "updatedAt", "updatedBy"
            ) VALUES (
                session_event_id, 
                'Live Game', 
                NOW(), 
                '2024-25', 
                false,
                NOW(), 
                COALESCE((SELECT created_by FROM live_game_sessions WHERE id = session_id_param), 1),
                NOW(), 
                COALESCE((SELECT created_by FROM live_game_sessions WHERE id = session_id_param), 1)
            ) RETURNING id INTO session_game_id;
            
            -- Update the session with the new game_id
            UPDATE live_game_sessions 
            SET game_id = session_game_id 
            WHERE id = session_id_param;
        END IF;
    END IF;
    
    -- Now proceed with aggregation using the valid game_id
    INSERT INTO game_stats (
        "gameId", "playerId", "userId", points, rebounds, assists, 
        steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus",
        "fieldGoalsMade", "fieldGoalsAttempted", 
        "threePointsMade", "threePointsAttempted",
        "freeThrowsMade", "freeThrowsAttempted",
        "offensiveRebounds", "defensiveRebounds",
        quarter, period, timestamp, 
        "createdAt", "createdBy", "updatedAt", "updatedBy"
    )
    SELECT 
        session_game_id as "gameId",  -- Use the determined game_id
        lge.player_id as "playerId",
        lgs.created_by as "userId",
        -- Points: fg_made (2pts) + three_made (3pts) + ft_made (1pt)
        SUM(CASE 
            WHEN lge.event_type = 'fg_made' THEN 2
            WHEN lge.event_type = 'three_made' THEN 3
            WHEN lge.event_type = 'ft_made' THEN 1
            ELSE 0 
        END) as points,
        -- Rebounds
        SUM(CASE WHEN lge.event_type = 'rebound' THEN 1 ELSE 0 END) as rebounds,
        -- Assists
        SUM(CASE WHEN lge.event_type = 'assist' THEN 1 ELSE 0 END) as assists,
        -- Steals
        SUM(CASE WHEN lge.event_type = 'steal' THEN 1 ELSE 0 END) as steals,
        -- Blocks
        SUM(CASE WHEN lge.event_type = 'block' THEN 1 ELSE 0 END) as blocks,
        -- Turnovers
        SUM(CASE WHEN lge.event_type = 'turnover' THEN 1 ELSE 0 END) as turnovers,
        -- Fouls
        SUM(CASE WHEN lge.event_type = 'foul' THEN 1 ELSE 0 END) as fouls,
        0 as "minutesPlayed",
        0 as "plusMinus",
        -- Field Goals
        SUM(CASE WHEN lge.event_type = 'fg_made' THEN 1 ELSE 0 END) as "fieldGoalsMade",
        SUM(CASE WHEN lge.event_type IN ('fg_made', 'fg_missed') THEN 1 ELSE 0 END) as "fieldGoalsAttempted",
        -- Three Pointers
        SUM(CASE WHEN lge.event_type = 'three_made' THEN 1 ELSE 0 END) as "threePointsMade",
        SUM(CASE WHEN lge.event_type IN ('three_made', 'three_missed') THEN 1 ELSE 0 END) as "threePointsAttempted",
        -- Free Throws
        SUM(CASE WHEN lge.event_type = 'ft_made' THEN 1 ELSE 0 END) as "freeThrowsMade",
        SUM(CASE WHEN lge.event_type IN ('ft_made', 'ft_missed') THEN 1 ELSE 0 END) as "freeThrowsAttempted",
        -- Offensive/Defensive Rebounds (assuming all rebounds are defensive unless specified)
        0 as "offensiveRebounds",
        SUM(CASE WHEN lge.event_type = 'rebound' THEN 1 ELSE 0 END) as "defensiveRebounds",
        lge.quarter,
        'Q' || lge.quarter as period,
        NOW() as timestamp,
        NOW() as "createdAt",
        lgs.created_by as "createdBy",
        NOW() as "updatedAt",
        lgs.created_by as "updatedBy"
    FROM live_game_events lge
    JOIN live_game_sessions lgs ON lge.session_id = lgs.id
    WHERE lge.session_id = session_id_param
    AND lge.player_id IS NOT NULL
    AND lge.is_opponent_event = false  -- Only count our team's events
    GROUP BY lge.player_id, lgs.created_by, lge.quarter
    HAVING COUNT(*) > 0;  -- Only insert if there are actual events
    
    -- Mark events as processed
    UPDATE live_game_events 
    SET sync_status = 'processed'
    WHERE session_id = session_id_param;
    
END;
$function$

