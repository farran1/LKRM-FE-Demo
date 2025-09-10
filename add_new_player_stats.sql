-- Add game stats for players that don't have ANY stats yet
-- This will avoid all duplicate issues

-- First, let's see what players exist and add stats for ones without any game stats
INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
SELECT 18, p.id, 
  CASE p.id
    WHEN 18 THEN 25
    WHEN 19 THEN 20  
    WHEN 20 THEN 18
    WHEN 22 THEN 12
    WHEN 24 THEN 8
    ELSE 10
  END,
  CASE p.id
    WHEN 18 THEN 9
    WHEN 19 THEN 8
    WHEN 20 THEN 6
    WHEN 22 THEN 4
    WHEN 24 THEN 3
    ELSE 4
  END,
  CASE p.id
    WHEN 18 THEN 18
    WHEN 19 THEN 15
    WHEN 20 THEN 12
    WHEN 22 THEN 8
    WHEN 24 THEN 6
    ELSE 8
  END,
  CASE p.id
    WHEN 18 THEN 3
    WHEN 19 THEN 2
    WHEN 20 THEN 3
    WHEN 22 THEN 1
    WHEN 24 THEN 1
    ELSE 1
  END,
  CASE p.id
    WHEN 18 THEN 8
    WHEN 19 THEN 5
    WHEN 20 THEN 7
    WHEN 22 THEN 3
    WHEN 24 THEN 2
    ELSE 3
  END,
  CASE p.id
    WHEN 18 THEN 4
    WHEN 19 THEN 2
    WHEN 20 THEN 3
    WHEN 22 THEN 3
    WHEN 24 THEN 1
    ELSE 2
  END,
  CASE p.id
    WHEN 18 THEN 5
    WHEN 19 THEN 3
    WHEN 20 THEN 3
    WHEN 22 THEN 4
    WHEN 24 THEN 2
    ELSE 3
  END,
  CASE p.id
    WHEN 18 THEN 8
    WHEN 19 THEN 10
    WHEN 20 THEN 5
    WHEN 22 THEN 4
    WHEN 24 THEN 3
    ELSE 5
  END,
  CASE p.id
    WHEN 18 THEN 2
    WHEN 19 THEN 3
    WHEN 20 THEN 1
    WHEN 22 THEN 1
    WHEN 24 THEN 0
    ELSE 1
  END,
  CASE p.id
    WHEN 18 THEN 6
    WHEN 19 THEN 7
    WHEN 20 THEN 4
    WHEN 22 THEN 3
    WHEN 24 THEN 3
    ELSE 4
  END,
  CASE p.id
    WHEN 18 THEN 6
    WHEN 19 THEN 4
    WHEN 20 THEN 8
    WHEN 22 THEN 2
    WHEN 24 THEN 1
    ELSE 3
  END,
  CASE p.id
    WHEN 18 THEN 3
    WHEN 19 THEN 2
    WHEN 20 THEN 4
    WHEN 22 THEN 1
    WHEN 24 THEN 0
    ELSE 2
  END,
  CASE p.id
    WHEN 18 THEN 1
    WHEN 19 THEN 2
    WHEN 20 THEN 0
    WHEN 22 THEN 0
    WHEN 24 THEN 0
    ELSE 1
  END,
  CASE p.id
    WHEN 18 THEN 2
    WHEN 19 THEN 1
    WHEN 20 THEN 1
    WHEN 22 THEN 1
    WHEN 24 THEN 0
    ELSE 1
  END,
  CASE p.id
    WHEN 18 THEN 2
    WHEN 19 THEN 1
    WHEN 20 THEN 2
    WHEN 22 THEN 1
    WHEN 24 THEN 2
    ELSE 1
  END,
  CASE p.id
    WHEN 18 THEN 35
    WHEN 19 THEN 32
    WHEN 20 THEN 30
    WHEN 22 THEN 25
    WHEN 24 THEN 18
    ELSE 20
  END,
  CASE p.id
    WHEN 18 THEN 12
    WHEN 19 THEN 15
    WHEN 20 THEN 10
    WHEN 22 THEN 6
    WHEN 24 THEN 4
    ELSE 5
  END,
  1, 'game',
  CASE p.id
    WHEN 18 THEN 10
    WHEN 19 THEN 8
    WHEN 20 THEN 6
    WHEN 22 THEN 6
    WHEN 24 THEN 4
    ELSE 5
  END
FROM players p
WHERE p.id IN (18, 19, 20, 22, 24)
AND NOT EXISTS (
  SELECT 1 FROM game_stats gs 
  WHERE gs."gameId" = 18 
  AND gs."playerId" = p.id 
  AND gs.quarter = 1 
  AND gs.period = 'game'
);

-- Success message
SELECT 'New player game stats have been successfully added!' as message;
