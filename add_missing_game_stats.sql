-- Add missing game stats only (avoiding duplicates)
-- This script will only add stats that don't already exist

-- Add game stats for players that don't have stats yet
INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
SELECT 18, 18, 25, 9, 18, 3, 8, 4, 5, 8, 2, 6, 6, 3, 1, 2, 2, 35, 12, 1, 'game', 10
WHERE NOT EXISTS (SELECT 1 FROM game_stats WHERE "gameId" = 18 AND "playerId" = 18 AND quarter = 1);

INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
SELECT 18, 19, 20, 8, 15, 2, 5, 2, 3, 10, 3, 7, 4, 2, 2, 1, 1, 32, 15, 1, 'game', 8
WHERE NOT EXISTS (SELECT 1 FROM game_stats WHERE "gameId" = 18 AND "playerId" = 19 AND quarter = 1);

INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
SELECT 18, 20, 18, 6, 12, 3, 7, 3, 3, 5, 1, 4, 8, 4, 0, 1, 2, 30, 10, 1, 'game', 6
WHERE NOT EXISTS (SELECT 1 FROM game_stats WHERE "gameId" = 18 AND "playerId" = 20 AND quarter = 1);

INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
SELECT 18, 22, 12, 4, 8, 1, 3, 3, 4, 4, 1, 3, 2, 1, 0, 1, 1, 25, 6, 1, 'game', 6
WHERE NOT EXISTS (SELECT 1 FROM game_stats WHERE "gameId" = 18 AND "playerId" = 22 AND quarter = 1);

INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
SELECT 18, 24, 8, 3, 6, 1, 2, 1, 2, 3, 0, 3, 1, 0, 0, 0, 2, 18, 4, 1, 'game', 4
WHERE NOT EXISTS (SELECT 1 FROM game_stats WHERE "gameId" = 18 AND "playerId" = 24 AND quarter = 1);

-- Add quarter-by-quarter stats for existing players (avoiding duplicates)
INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
SELECT 18, 18, 8, 3, 6, 1, 3, 1, 2, 2, 1, 1, 2, 1, 0, 1, 1, 8, 3, 1, 'quarter', 4
WHERE NOT EXISTS (SELECT 1 FROM game_stats WHERE "gameId" = 18 AND "playerId" = 18 AND quarter = 1 AND period = 'quarter');

INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
SELECT 18, 19, 6, 2, 4, 0, 1, 2, 2, 3, 1, 2, 1, 0, 1, 0, 0, 8, 2, 1, 'quarter', 3
WHERE NOT EXISTS (SELECT 1 FROM game_stats WHERE "gameId" = 18 AND "playerId" = 19 AND quarter = 1 AND period = 'quarter');

INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
SELECT 18, 20, 5, 2, 4, 1, 2, 0, 0, 1, 0, 1, 2, 1, 0, 0, 1, 8, 2, 1, 'quarter', 2
WHERE NOT EXISTS (SELECT 1 FROM game_stats WHERE "gameId" = 18 AND "playerId" = 20 AND quarter = 1 AND period = 'quarter');

INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
SELECT 18, 21, 4, 2, 3, 0, 1, 0, 0, 2, 0, 2, 1, 0, 0, 0, 0, 8, 2, 1, 'quarter', 1
WHERE NOT EXISTS (SELECT 1 FROM game_stats WHERE "gameId" = 18 AND "playerId" = 21 AND quarter = 1 AND period = 'quarter');

-- Add more quarter stats for variety
INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
SELECT 18, 18, 7, 2, 5, 1, 2, 2, 2, 2, 0, 2, 2, 1, 0, 0, 0, 8, 4, 2, 'quarter', 3
WHERE NOT EXISTS (SELECT 1 FROM game_stats WHERE "gameId" = 18 AND "playerId" = 18 AND quarter = 2 AND period = 'quarter');

INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
SELECT 18, 19, 8, 3, 5, 1, 2, 1, 1, 4, 1, 3, 2, 1, 1, 0, 0, 8, 5, 2, 'quarter', 4
WHERE NOT EXISTS (SELECT 1 FROM game_stats WHERE "gameId" = 18 AND "playerId" = 19 AND quarter = 2 AND period = 'quarter');

INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
SELECT 18, 20, 6, 2, 3, 1, 2, 1, 1, 2, 0, 2, 3, 2, 0, 0, 0, 8, 3, 2, 'quarter', 2
WHERE NOT EXISTS (SELECT 1 FROM game_stats WHERE "gameId" = 18 AND "playerId" = 20 AND quarter = 2 AND period = 'quarter');

-- Success message
SELECT 'Missing game stats have been successfully added!' as message;
