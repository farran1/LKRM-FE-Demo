-- Simple script to fill game stats data only
-- This will add comprehensive game statistics to existing games

-- First, let's see what games exist and add stats to them
-- Game stats for existing game (Lander)
INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
VALUES 
((SELECT id FROM games WHERE opponent = 'Lander' LIMIT 1), 18, 25, 9, 18, 3, 8, 4, 5, 8, 2, 6, 6, 3, 1, 2, 2, 35, 12, 1, 'game', 10),
((SELECT id FROM games WHERE opponent = 'Lander' LIMIT 1), 19, 20, 8, 15, 2, 5, 2, 3, 10, 3, 7, 4, 2, 2, 1, 1, 32, 15, 1, 'game', 8),
((SELECT id FROM games WHERE opponent = 'Lander' LIMIT 1), 20, 18, 6, 12, 3, 7, 3, 3, 5, 1, 4, 8, 4, 0, 1, 2, 30, 10, 1, 'game', 6),
((SELECT id FROM games WHERE opponent = 'Lander' LIMIT 1), 21, 15, 6, 11, 2, 4, 1, 2, 7, 2, 5, 3, 1, 1, 2, 2, 28, 8, 1, 'game', 8),
((SELECT id FROM games WHERE opponent = 'Lander' LIMIT 1), 22, 12, 4, 8, 1, 3, 3, 4, 4, 1, 3, 2, 1, 0, 1, 1, 25, 6, 1, 'game', 6),
((SELECT id FROM games WHERE opponent = 'Lander' LIMIT 1), 24, 8, 3, 6, 1, 2, 1, 2, 3, 0, 3, 1, 0, 0, 0, 2, 18, 4, 1, 'game', 4);

-- Add some additional game stats for variety
INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
VALUES 
-- Quarter 1 stats
((SELECT id FROM games WHERE opponent = 'Lander' LIMIT 1), 18, 8, 3, 6, 1, 3, 1, 2, 2, 1, 1, 2, 1, 0, 1, 1, 8, 3, 1, 'quarter', 4),
((SELECT id FROM games WHERE opponent = 'Lander' LIMIT 1), 19, 6, 2, 4, 0, 1, 2, 2, 3, 1, 2, 1, 0, 1, 0, 0, 8, 2, 1, 'quarter', 3),
((SELECT id FROM games WHERE opponent = 'Lander' LIMIT 1), 20, 5, 2, 4, 1, 2, 0, 0, 1, 0, 1, 2, 1, 0, 0, 1, 8, 2, 1, 'quarter', 2),

-- Quarter 2 stats  
((SELECT id FROM games WHERE opponent = 'Lander' LIMIT 1), 18, 7, 2, 5, 1, 2, 2, 2, 2, 0, 2, 2, 1, 0, 0, 0, 8, 4, 2, 'quarter', 3),
((SELECT id FROM games WHERE opponent = 'Lander' LIMIT 1), 19, 8, 3, 5, 1, 2, 1, 1, 4, 1, 3, 2, 1, 1, 0, 0, 8, 5, 2, 'quarter', 4),
((SELECT id FROM games WHERE opponent = 'Lander' LIMIT 1), 20, 6, 2, 3, 1, 2, 1, 1, 2, 0, 2, 3, 2, 0, 0, 0, 8, 3, 2, 'quarter', 2),

-- Quarter 3 stats
((SELECT id FROM games WHERE opponent = 'Lander' LIMIT 1), 18, 6, 2, 4, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 8, 3, 3, 'quarter', 2),
((SELECT id FROM games WHERE opponent = 'Lander' LIMIT 1), 19, 4, 2, 4, 0, 1, 0, 0, 2, 1, 1, 1, 0, 0, 1, 1, 8, 2, 3, 'quarter', 2),
((SELECT id FROM games WHERE opponent = 'Lander' LIMIT 1), 20, 4, 1, 3, 1, 2, 1, 1, 1, 0, 1, 2, 1, 0, 0, 0, 8, 2, 3, 'quarter', 1),

-- Quarter 4 stats
((SELECT id FROM games WHERE opponent = 'Lander' LIMIT 1), 18, 4, 2, 3, 0, 1, 0, 0, 2, 0, 2, 1, 0, 0, 0, 0, 8, 2, 4, 'quarter', 1),
((SELECT id FROM games WHERE opponent = 'Lander' LIMIT 1), 19, 2, 1, 2, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 8, 1, 4, 'quarter', 1),
((SELECT id FROM games WHERE opponent = 'Lander' LIMIT 1), 20, 3, 1, 2, 0, 1, 1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 8, 1, 4, 'quarter', 1);

-- Success message
SELECT 'Game stats data has been successfully loaded!' as message;



