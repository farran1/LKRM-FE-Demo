-- Simple fix for missing game stats - Eagles and Warriors games
-- This will add basic stats to fix the 0 PPG issue

-- Add game stats for Eagles game (ID 58) - LOSS
INSERT INTO game_stats ("gameId", "playerId", "userId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
VALUES 
(58, 18, 1, 19, 7, 18, 1, 6, 4, 5, 6, 1, 5, 3, 1, 0, 2, 3, 35, -8, 1, 'game', 8),
(58, 19, 1, 16, 6, 14, 2, 5, 2, 3, 8, 2, 6, 2, 2, 1, 3, 2, 30, -5, 1, 'game', 6),
(58, 20, 1, 14, 5, 12, 2, 7, 2, 2, 4, 1, 3, 6, 2, 0, 2, 4, 28, -12, 1, 'game', 4),
(58, 21, 1, 11, 4, 10, 1, 4, 2, 2, 7, 3, 4, 1, 1, 2, 1, 2, 26, -3, 1, 'game', 6),
(58, 22, 1, 8, 3, 8, 0, 3, 2, 3, 3, 1, 2, 2, 1, 0, 2, 1, 20, -6, 1, 'game', 4),
(58, 24, 1, 4, 2, 5, 0, 1, 0, 0, 2, 0, 2, 0, 0, 0, 1, 1, 12, -8, 1, 'game', 2);

-- Add game stats for Warriors game (ID 59) - WIN
INSERT INTO game_stats ("gameId", "playerId", "userId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
VALUES 
(59, 18, 1, 28, 10, 19, 4, 8, 4, 5, 8, 2, 6, 6, 3, 1, 2, 2, 36, 16, 1, 'game', 12),
(59, 19, 1, 21, 8, 15, 2, 4, 3, 4, 11, 4, 7, 4, 2, 3, 1, 1, 32, 18, 1, 'game', 10),
(59, 20, 1, 18, 6, 13, 3, 7, 3, 3, 5, 1, 4, 9, 4, 0, 1, 2, 31, 14, 1, 'game', 6),
(59, 21, 1, 14, 5, 11, 2, 5, 2, 2, 8, 3, 5, 3, 2, 1, 1, 2, 28, 12, 1, 'game', 8),
(59, 22, 1, 6, 2, 6, 0, 2, 2, 2, 4, 1, 3, 2, 1, 0, 1, 1, 22, 8, 1, 'game', 4),
(59, 24, 1, 4, 1, 3, 0, 1, 2, 2, 2, 0, 2, 0, 0, 0, 0, 1, 10, 4, 1, 'game', 2);

-- Success message
SELECT 'Missing game stats have been added! PPG should now show correctly.' as message;
