-- Fix the aggregate_live_events_to_game_stats function to include all required fields
-- Run this SQL to fix the RPC function error

CREATE OR REPLACE FUNCTION public.aggregate_live_events_to_game_stats(session_id_param integer)
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Insert aggregated stats from live events into game_stats
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
        lge.game_id as "gameId",
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
    GROUP BY lge.game_id, lge.player_id, lgs.created_by, lge.quarter;
    
    -- Mark events as processed
    UPDATE live_game_events 
    SET sync_status = 'processed'
    WHERE session_id = session_id_param;
    
END;
$function$

