-- Quick Stats Addition - Add more players to existing game
-- This adds comprehensive stats for all your existing players to the current game

-- Add stats for all players to the existing game (vs Lander)
INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
VALUES 
-- Andrew Farrell (existing player)
(18, 18, 24, 9, 16, 3, 7, 3, 4, 8, 2, 6, 5, 2, 1, 2, 2, 32, 12, 1, 'game', 8),
-- Joey Iannetta
(18, 19, 18, 7, 13, 1, 4, 3, 4, 10, 3, 7, 3, 1, 2, 1, 1, 28, 8, 1, 'game', 6),
-- Micah Roberson
(18, 20, 16, 6, 12, 2, 5, 2, 2, 5, 1, 4, 7, 3, 0, 2, 3, 30, 6, 1, 'game', 4),
-- Bryan Davis (existing player with stats)
(18, 21, 14, 5, 10, 2, 4, 2, 2, 6, 2, 4, 2, 1, 1, 2, 2, 25, 4, 1, 'game', 6),
-- Eric Cooperman
(18, 22, 12, 4, 9, 1, 3, 3, 3, 4, 1, 3, 4, 2, 0, 1, 1, 22, 3, 1, 'game', 4),
-- Sub 1
(18, 23, 8, 3, 6, 0, 2, 2, 2, 3, 1, 2, 2, 1, 0, 1, 1, 18, 2, 1, 'game', 4),
-- Charles Johnston
(18, 24, 6, 2, 5, 0, 1, 2, 2, 4, 1, 3, 1, 0, 0, 0, 2, 15, 1, 1, 'game', 2),
-- Eddrin Bronson
(18, 25, 4, 2, 4, 0, 1, 0, 0, 2, 0, 2, 1, 0, 0, 1, 1, 12, 0, 1, 'game', 2),
-- Ben VanderWal
(18, 26, 3, 1, 3, 0, 1, 1, 2, 2, 0, 2, 0, 0, 0, 0, 1, 10, 0, 1, 'game', 2),
-- Mason Smith
(18, 27, 2, 1, 2, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 8, 0, 1, 'game', 2);

-- Update the game score to reflect all the stats
UPDATE games SET "homeScore" = 107, "awayScore" = 65, result = 'WIN' WHERE id = 18;

-- Add some player notes for context
INSERT INTO player_notes ("playerId", note, "isPublic", tags, "createdBy")
VALUES 
(18, 'Team captain and leading scorer. Excellent leadership on and off the court.', true, ARRAY['captain', 'leader'], 1),
(19, 'Strong rebounder and defensive presence. Needs to work on free throw shooting.', true, ARRAY['defense', 'rebounding'], 1),
(20, 'Great playmaker and three-point shooter. Sometimes takes too many risks.', true, ARRAY['playmaker', 'shooting'], 1),
(21, 'Versatile player who can play multiple positions. Consistent performer.', true, ARRAY['versatile', 'consistent'], 1),
(22, 'Young player with potential. Shows good court vision and passing ability.', true, ARRAY['young', 'potential'], 1);

-- Add some player goals
INSERT INTO player_goals ("playerId", goal, "targetDate", "isAchieved", category, "createdBy")
VALUES 
(18, 'Average 20+ points per game for the season', '2025-03-01', false, 'scoring', 1),
(19, 'Improve free throw percentage to 75%', '2025-02-15', false, 'shooting', 1),
(20, 'Reduce turnovers to under 2 per game', '2025-02-01', false, 'ball_handling', 1),
(21, 'Increase rebounding average to 8 per game', '2025-02-20', false, 'rebounding', 1),
(22, 'Develop three-point shot consistency', '2025-03-15', false, 'shooting', 1);

SELECT 'Quick stats addition completed! All players now have comprehensive game statistics.' as status;
