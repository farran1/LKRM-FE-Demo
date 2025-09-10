-- Complete Game Data Script - Updates existing games and adds new ones with full stats
-- This will give you comprehensive game data to work with

-- First, update the existing Lander game with proper scores and data
UPDATE games 
SET "homeScore" = 78, "awayScore" = 65, result = 'WIN', notes = 'Great team performance - strong defense in second half'
WHERE id = 18;

-- Add some new games with full data
INSERT INTO events (name, "eventTypeId", "startTime", location, venue, "oppositionTeam", "createdBy", "updatedBy")
VALUES 
('LKRM vs Thunder - Jan 2025', 5, '2025-01-15 19:00:00', 'HOME', 'LKRM Arena', 'Thunder', '5e4fc558-dac5-4dcc-bdde-91763c4aee8b', '5e4fc558-dac5-4dcc-bdde-91763c4aee8b'),
('LKRM vs Eagles - Jan 2025', 5, '2025-01-22 19:30:00', 'AWAY', 'Eagles Stadium', 'Eagles', '5e4fc558-dac5-4dcc-bdde-91763c4aee8b', '5e4fc558-dac5-4dcc-bdde-91763c4aee8b'),
('LKRM vs Warriors - Jan 2025', 5, '2025-01-29 20:00:00', 'HOME', 'LKRM Arena', 'Warriors', '5e4fc558-dac5-4dcc-bdde-91763c4aee8b', '5e4fc558-dac5-4dcc-bdde-91763c4aee8b');

-- Create games for these events
INSERT INTO games ("eventId", opponent, "homeScore", "awayScore", result, "gameDate", season, "isPlayoffs", notes)
VALUES 
((SELECT id FROM events WHERE name = 'LKRM vs Thunder - Jan 2025' LIMIT 1), 'Thunder', 82, 74, 'WIN', '2025-01-15 19:00:00', '2024-25', false, 'Strong offensive showing in the second half'),
((SELECT id FROM events WHERE name = 'LKRM vs Eagles - Jan 2025' LIMIT 1), 'Eagles', 68, 76, 'LOSS', '2025-01-22 19:30:00', '2024-25', false, 'Tough away game - struggled with their press'),
((SELECT id FROM events WHERE name = 'LKRM vs Warriors - Jan 2025' LIMIT 1), 'Warriors', 91, 83, 'WIN', '2025-01-29 20:00:00', '2024-25', false, 'Great team defense and ball movement');

-- Add comprehensive game stats for the updated Lander game
INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
SELECT 18, p.id, 
  CASE p.id
    WHEN 18 THEN 22
    WHEN 19 THEN 18  
    WHEN 20 THEN 15
    WHEN 21 THEN 12
    WHEN 22 THEN 8
    WHEN 24 THEN 3
    ELSE 10
  END,
  CASE p.id
    WHEN 18 THEN 8
    WHEN 19 THEN 7
    WHEN 20 THEN 6
    WHEN 21 THEN 5
    WHEN 22 THEN 3
    WHEN 24 THEN 1
    ELSE 4
  END,
  CASE p.id
    WHEN 18 THEN 15
    WHEN 19 THEN 12
    WHEN 20 THEN 11
    WHEN 21 THEN 9
    WHEN 22 THEN 7
    WHEN 24 THEN 4
    ELSE 8
  END,
  CASE p.id
    WHEN 18 THEN 2
    WHEN 19 THEN 1
    WHEN 20 THEN 3
    WHEN 21 THEN 2
    WHEN 22 THEN 0
    WHEN 24 THEN 0
    ELSE 1
  END,
  CASE p.id
    WHEN 18 THEN 5
    WHEN 19 THEN 3
    WHEN 20 THEN 6
    WHEN 21 THEN 4
    WHEN 22 THEN 2
    WHEN 24 THEN 1
    ELSE 3
  END,
  CASE p.id
    WHEN 18 THEN 4
    WHEN 19 THEN 3
    WHEN 20 THEN 0
    WHEN 21 THEN 0
    WHEN 22 THEN 2
    WHEN 24 THEN 1
    ELSE 2
  END,
  CASE p.id
    WHEN 18 THEN 6
    WHEN 19 THEN 4
    WHEN 20 THEN 0
    WHEN 21 THEN 2
    WHEN 22 THEN 2
    WHEN 24 THEN 2
    ELSE 3
  END,
  CASE p.id
    WHEN 18 THEN 7
    WHEN 19 THEN 9
    WHEN 20 THEN 4
    WHEN 21 THEN 6
    WHEN 22 THEN 3
    WHEN 24 THEN 2
    ELSE 5
  END,
  CASE p.id
    WHEN 18 THEN 2
    WHEN 19 THEN 3
    WHEN 20 THEN 1
    WHEN 21 THEN 2
    WHEN 22 THEN 1
    WHEN 24 THEN 0
    ELSE 1
  END,
  CASE p.id
    WHEN 18 THEN 5
    WHEN 19 THEN 6
    WHEN 20 THEN 3
    WHEN 21 THEN 4
    WHEN 22 THEN 2
    WHEN 24 THEN 2
    ELSE 4
  END,
  CASE p.id
    WHEN 18 THEN 5
    WHEN 19 THEN 3
    WHEN 20 THEN 8
    WHEN 21 THEN 2
    WHEN 22 THEN 4
    WHEN 24 THEN 1
    ELSE 3
  END,
  CASE p.id
    WHEN 18 THEN 2
    WHEN 19 THEN 1
    WHEN 20 THEN 3
    WHEN 21 THEN 1
    WHEN 22 THEN 1
    WHEN 24 THEN 0
    ELSE 2
  END,
  CASE p.id
    WHEN 18 THEN 1
    WHEN 19 THEN 2
    WHEN 20 THEN 0
    WHEN 21 THEN 1
    WHEN 22 THEN 0
    WHEN 24 THEN 0
    ELSE 1
  END,
  CASE p.id
    WHEN 18 THEN 2
    WHEN 19 THEN 1
    WHEN 20 THEN 1
    WHEN 21 THEN 2
    WHEN 22 THEN 1
    WHEN 24 THEN 0
    ELSE 1
  END,
  CASE p.id
    WHEN 18 THEN 2
    WHEN 19 THEN 1
    WHEN 20 THEN 3
    WHEN 21 THEN 2
    WHEN 22 THEN 1
    WHEN 24 THEN 2
    ELSE 1
  END,
  CASE p.id
    WHEN 18 THEN 32
    WHEN 19 THEN 28
    WHEN 20 THEN 30
    WHEN 21 THEN 25
    WHEN 22 THEN 22
    WHEN 24 THEN 15
    ELSE 20
  END,
  CASE p.id
    WHEN 18 THEN 8
    WHEN 19 THEN 12
    WHEN 20 THEN 15
    WHEN 21 THEN 6
    WHEN 22 THEN 4
    WHEN 24 THEN -2
    ELSE 5
  END,
  1, 'game',
  CASE p.id
    WHEN 18 THEN 6
    WHEN 19 THEN 8
    WHEN 20 THEN 4
    WHEN 21 THEN 6
    WHEN 22 THEN 4
    WHEN 24 THEN 2
    ELSE 5
  END
FROM players p
WHERE p.id IN (18, 19, 20, 21, 22, 24)
AND NOT EXISTS (
  SELECT 1 FROM game_stats gs 
  WHERE gs."gameId" = 18 
  AND gs."playerId" = p.id 
  AND gs.quarter = 1 
  AND gs.period = 'game'
);

-- Add game stats for Thunder game
INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
SELECT (SELECT id FROM games WHERE opponent = 'Thunder' LIMIT 1), p.id, 
  CASE p.id
    WHEN 18 THEN 24
    WHEN 19 THEN 20  
    WHEN 20 THEN 16
    WHEN 21 THEN 14
    WHEN 22 THEN 6
    WHEN 24 THEN 2
    ELSE 10
  END,
  CASE p.id
    WHEN 18 THEN 9
    WHEN 19 THEN 8
    WHEN 20 THEN 6
    WHEN 21 THEN 5
    WHEN 22 THEN 2
    WHEN 24 THEN 1
    ELSE 4
  END,
  CASE p.id
    WHEN 18 THEN 16
    WHEN 19 THEN 14
    WHEN 20 THEN 12
    WHEN 21 THEN 10
    WHEN 22 THEN 5
    WHEN 24 THEN 3
    ELSE 8
  END,
  CASE p.id
    WHEN 18 THEN 3
    WHEN 19 THEN 2
    WHEN 20 THEN 2
    WHEN 21 THEN 2
    WHEN 22 THEN 0
    WHEN 24 THEN 0
    ELSE 1
  END,
  CASE p.id
    WHEN 18 THEN 6
    WHEN 19 THEN 4
    WHEN 20 THEN 5
    WHEN 21 THEN 4
    WHEN 22 THEN 2
    WHEN 24 THEN 1
    ELSE 3
  END,
  CASE p.id
    WHEN 18 THEN 3
    WHEN 19 THEN 2
    WHEN 20 THEN 2
    WHEN 21 THEN 2
    WHEN 22 THEN 2
    WHEN 24 THEN 0
    ELSE 2
  END,
  CASE p.id
    WHEN 18 THEN 4
    WHEN 19 THEN 3
    WHEN 20 THEN 2
    WHEN 21 THEN 2
    WHEN 22 THEN 2
    WHEN 24 THEN 0
    ELSE 3
  END,
  CASE p.id
    WHEN 18 THEN 8
    WHEN 19 THEN 10
    WHEN 20 THEN 5
    WHEN 21 THEN 7
    WHEN 22 THEN 4
    WHEN 24 THEN 2
    ELSE 5
  END,
  CASE p.id
    WHEN 18 THEN 2
    WHEN 19 THEN 3
    WHEN 20 THEN 1
    WHEN 21 THEN 2
    WHEN 22 THEN 1
    WHEN 24 THEN 0
    ELSE 1
  END,
  CASE p.id
    WHEN 18 THEN 6
    WHEN 19 THEN 7
    WHEN 20 THEN 4
    WHEN 21 THEN 5
    WHEN 22 THEN 3
    WHEN 24 THEN 2
    ELSE 4
  END,
  CASE p.id
    WHEN 18 THEN 6
    WHEN 19 THEN 4
    WHEN 20 THEN 8
    WHEN 21 THEN 3
    WHEN 22 THEN 2
    WHEN 24 THEN 1
    ELSE 3
  END,
  CASE p.id
    WHEN 18 THEN 2
    WHEN 19 THEN 1
    WHEN 20 THEN 3
    WHEN 21 THEN 1
    WHEN 22 THEN 1
    WHEN 24 THEN 0
    ELSE 2
  END,
  CASE p.id
    WHEN 18 THEN 1
    WHEN 19 THEN 2
    WHEN 20 THEN 0
    WHEN 21 THEN 1
    WHEN 22 THEN 0
    WHEN 24 THEN 0
    ELSE 1
  END,
  CASE p.id
    WHEN 18 THEN 2
    WHEN 19 THEN 1
    WHEN 20 THEN 1
    WHEN 21 THEN 2
    WHEN 22 THEN 1
    WHEN 24 THEN 0
    ELSE 1
  END,
  CASE p.id
    WHEN 18 THEN 2
    WHEN 19 THEN 1
    WHEN 20 THEN 2
    WHEN 21 THEN 1
    WHEN 22 THEN 1
    WHEN 24 THEN 1
    ELSE 1
  END,
  CASE p.id
    WHEN 18 THEN 35
    WHEN 19 THEN 32
    WHEN 20 THEN 28
    WHEN 21 THEN 26
    WHEN 22 THEN 20
    WHEN 24 THEN 12
    ELSE 20
  END,
  CASE p.id
    WHEN 18 THEN 10
    WHEN 19 THEN 8
    WHEN 20 THEN 12
    WHEN 21 THEN 4
    WHEN 22 THEN 2
    WHEN 24 THEN -4
    ELSE 5
  END,
  1, 'game',
  CASE p.id
    WHEN 18 THEN 8
    WHEN 19 THEN 6
    WHEN 20 THEN 4
    WHEN 21 THEN 6
    WHEN 22 THEN 4
    WHEN 24 THEN 2
    ELSE 5
  END
FROM players p
WHERE p.id IN (18, 19, 20, 21, 22, 24);

-- Add quarter totals for the games (using correct column names)
INSERT INTO game_quarter_totals (gameid, quarter, points, reb, ast, stl, blk, tov, pf, timeouts)
VALUES 
(18, 1, 22, 8, 5, 2, 1, 3, 4, 2),
(18, 2, 20, 6, 4, 1, 0, 2, 3, 1),
(18, 3, 18, 7, 3, 2, 1, 1, 2, 1),
(18, 4, 18, 5, 2, 1, 0, 2, 3, 1),
((SELECT id FROM games WHERE opponent = 'Thunder' LIMIT 1), 1, 24, 9, 6, 3, 1, 2, 3, 2),
((SELECT id FROM games WHERE opponent = 'Thunder' LIMIT 1), 2, 22, 7, 4, 2, 0, 1, 2, 1),
((SELECT id FROM games WHERE opponent = 'Thunder' LIMIT 1), 3, 20, 8, 5, 1, 1, 3, 4, 1),
((SELECT id FROM games WHERE opponent = 'Thunder' LIMIT 1), 4, 16, 6, 3, 1, 0, 2, 2, 1);

-- Success message
SELECT 'Complete game data has been successfully loaded!' as message;
