-- Sample Game Data for LKRM Basketball Statistics
-- This script will populate your database with comprehensive game statistics
-- Run this script in your Supabase SQL editor or database client

-- First, let's create additional game events with unique names
-- Using actual user ID from your database
INSERT INTO events (name, "eventTypeId", "startTime", location, venue, "oppositionTeam", "createdBy", "updatedBy")
VALUES 
('LKRM vs Thunder - Jan 2025', 5, '2025-01-15 19:00:00', 'HOME', 'LKRM Arena', 'Thunder', '5e4fc558-dac5-4dcc-bdde-91763c4aee8b', '5e4fc558-dac5-4dcc-bdde-91763c4aee8b'),
('LKRM vs Eagles - Jan 2025', 5, '2025-01-22 19:30:00', 'AWAY', 'Eagles Stadium', 'Eagles', '5e4fc558-dac5-4dcc-bdde-91763c4aee8b', '5e4fc558-dac5-4dcc-bdde-91763c4aee8b'),
('LKRM vs Warriors - Jan 2025', 5, '2025-01-29 20:00:00', 'HOME', 'LKRM Arena', 'Warriors', '5e4fc558-dac5-4dcc-bdde-91763c4aee8b', '5e4fc558-dac5-4dcc-bdde-91763c4aee8b'),
('LKRM vs Lions - Feb 2025', 5, '2025-02-05 19:00:00', 'AWAY', 'Lions Den', 'Lions', '5e4fc558-dac5-4dcc-bdde-91763c4aee8b', '5e4fc558-dac5-4dcc-bdde-91763c4aee8b'),
('LKRM vs Hawks - Feb 2025', 5, '2025-02-12 19:30:00', 'HOME', 'LKRM Arena', 'Hawks', '5e4fc558-dac5-4dcc-bdde-91763c4aee8b', '5e4fc558-dac5-4dcc-bdde-91763c4aee8b');

-- Create game records for these events
INSERT INTO games ("eventId", opponent, "homeScore", "awayScore", result, "gameDate", season, "isPlayoffs", notes)
VALUES 
((SELECT id FROM events WHERE name = 'LKRM vs Thunder - Jan 2025'), 'Thunder', 78, 65, 'WIN', '2025-01-15 19:00:00', '2024-25', false, 'Great team performance'),
((SELECT id FROM events WHERE name = 'LKRM vs Eagles - Jan 2025'), 'Eagles', 72, 84, 'LOSS', '2025-01-22 19:30:00', '2024-25', false, 'Tough away game'),
((SELECT id FROM events WHERE name = 'LKRM vs Warriors - Jan 2025'), 'Warriors', 89, 76, 'WIN', '2025-01-29 20:00:00', '2024-25', false, 'Strong offensive showing'),
((SELECT id FROM events WHERE name = 'LKRM vs Lions - Feb 2025'), 'Lions', 81, 79, 'WIN', '2025-02-05 19:00:00', '2024-25', false, 'Close victory'),
((SELECT id FROM events WHERE name = 'LKRM vs Hawks - Feb 2025'), 'Hawks', 95, 88, 'WIN', '2025-02-12 19:30:00', '2024-25', false, 'High-scoring game');

-- Game 1: LKRM vs Thunder (WIN 78-65)
INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
VALUES 
((SELECT id FROM games WHERE opponent = 'Thunder'), 18, 22, 8, 15, 2, 5, 4, 6, 7, 2, 5, 5, 2, 1, 3, 2, 32, 8, 1, 'game', 6),
((SELECT id FROM games WHERE opponent = 'Thunder'), 19, 18, 7, 12, 1, 3, 3, 4, 9, 3, 6, 3, 1, 2, 2, 1, 28, 12, 1, 'game', 8),
((SELECT id FROM games WHERE opponent = 'Thunder'), 20, 15, 6, 11, 3, 6, 0, 0, 4, 1, 3, 8, 3, 0, 1, 3, 30, 15, 1, 'game', 4),
((SELECT id FROM games WHERE opponent = 'Thunder'), 21, 12, 5, 9, 2, 4, 0, 0, 6, 2, 4, 2, 1, 1, 2, 2, 25, 6, 1, 'game', 6),
((SELECT id FROM games WHERE opponent = 'Thunder'), 22, 8, 3, 7, 0, 2, 2, 2, 3, 1, 2, 4, 2, 0, 1, 1, 22, 4, 1, 'game', 4),
((SELECT id FROM games WHERE opponent = 'Thunder'), 24, 3, 1, 4, 0, 1, 1, 2, 2, 0, 2, 1, 0, 0, 0, 2, 15, -2, 1, 'game', 2);

-- Game 2: LKRM vs Eagles (LOSS 72-84)
INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
VALUES 
((SELECT id FROM games WHERE opponent = 'Eagles'), 18, 19, 7, 18, 1, 6, 4, 5, 5, 1, 4, 3, 1, 0, 4, 3, 35, -8, 1, 'game', 8),
((SELECT id FROM games WHERE opponent = 'Eagles'), 19, 16, 6, 14, 2, 5, 2, 3, 8, 2, 6, 2, 2, 1, 3, 2, 30, -5, 1, 'game', 6),
((SELECT id FROM games WHERE opponent = 'Eagles'), 20, 14, 5, 12, 2, 7, 2, 2, 3, 0, 3, 6, 2, 0, 2, 4, 28, -12, 1, 'game', 4),
((SELECT id FROM games WHERE opponent = 'Eagles'), 21, 11, 4, 10, 1, 4, 2, 2, 7, 3, 4, 1, 1, 2, 1, 2, 26, -3, 1, 'game', 6),
((SELECT id FROM games WHERE opponent = 'Eagles'), 22, 8, 3, 8, 0, 3, 2, 3, 2, 0, 2, 3, 1, 0, 2, 1, 20, -6, 1, 'game', 4),
((SELECT id FROM games WHERE opponent = 'Eagles'), 24, 4, 2, 5, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 1, 12, -8, 1, 'game', 2);

-- Game 3: LKRM vs Warriors (WIN 89-76)
INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
VALUES 
((SELECT id FROM games WHERE opponent = 'Warriors'), 18, 28, 10, 19, 4, 8, 4, 5, 8, 2, 6, 6, 3, 1, 2, 2, 36, 16, 1, 'game', 12),
((SELECT id FROM games WHERE opponent = 'Warriors'), 19, 21, 8, 15, 2, 4, 3, 4, 11, 4, 7, 4, 2, 3, 1, 1, 32, 18, 1, 'game', 10),
((SELECT id FROM games WHERE opponent = 'Warriors'), 20, 18, 6, 13, 3, 7, 3, 3, 5, 1, 4, 9, 4, 0, 1, 2, 31, 14, 1, 'game', 6),
((SELECT id FROM games WHERE opponent = 'Warriors'), 21, 12, 5, 10, 1, 3, 1, 2, 8, 2, 6, 2, 1, 2, 2, 3, 27, 8, 1, 'game', 8),
((SELECT id FROM games WHERE opponent = 'Warriors'), 22, 7, 2, 6, 1, 3, 2, 2, 3, 1, 2, 3, 1, 0, 1, 1, 18, 5, 1, 'game', 4),
((SELECT id FROM games WHERE opponent = 'Warriors'), 24, 3, 1, 3, 0, 1, 1, 2, 2, 0, 2, 1, 0, 0, 0, 1, 12, 2, 1, 'game', 2);

-- Game 4: LKRM vs Lions (WIN 81-79)
INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
VALUES 
((SELECT id FROM games WHERE opponent = 'Lions'), 18, 24, 9, 17, 2, 5, 4, 6, 6, 1, 5, 4, 2, 0, 3, 2, 34, 6, 1, 'game', 10),
((SELECT id FROM games WHERE opponent = 'Lions'), 19, 17, 6, 13, 1, 3, 4, 5, 9, 3, 6, 3, 1, 2, 2, 1, 29, 8, 1, 'game', 8),
((SELECT id FROM games WHERE opponent = 'Lions'), 20, 16, 5, 12, 2, 6, 4, 4, 4, 0, 4, 7, 3, 0, 2, 3, 30, 4, 1, 'game', 6),
((SELECT id FROM games WHERE opponent = 'Lions'), 21, 14, 6, 11, 0, 2, 2, 3, 7, 2, 5, 2, 1, 1, 1, 2, 26, 3, 1, 'game', 8),
((SELECT id FROM games WHERE opponent = 'Lions'), 22, 6, 2, 6, 0, 2, 2, 2, 3, 1, 2, 2, 1, 0, 1, 1, 19, 1, 1, 'game', 4),
((SELECT id FROM games WHERE opponent = 'Lions'), 24, 4, 2, 4, 0, 0, 0, 0, 2, 0, 2, 1, 0, 0, 0, 1, 13, -1, 1, 'game', 2);

-- Game 5: LKRM vs Hawks (WIN 95-88)
INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
VALUES 
((SELECT id FROM games WHERE opponent = 'Hawks'), 18, 31, 11, 20, 5, 9, 4, 5, 7, 2, 5, 7, 4, 1, 2, 2, 38, 12, 1, 'game', 14),
((SELECT id FROM games WHERE opponent = 'Hawks'), 19, 25, 9, 16, 3, 6, 4, 5, 12, 4, 8, 5, 2, 2, 1, 1, 33, 15, 1, 'game', 12),
((SELECT id FROM games WHERE opponent = 'Hawks'), 20, 19, 7, 14, 3, 7, 2, 2, 6, 1, 5, 8, 3, 0, 1, 2, 32, 10, 1, 'game', 8),
((SELECT id FROM games WHERE opponent = 'Hawks'), 21, 12, 5, 10, 1, 3, 1, 2, 8, 2, 6, 3, 1, 1, 2, 2, 28, 6, 1, 'game', 8),
((SELECT id FROM games WHERE opponent = 'Hawks'), 22, 6, 2, 5, 0, 1, 2, 2, 3, 1, 2, 2, 1, 0, 1, 1, 20, 3, 1, 'game', 4),
((SELECT id FROM games WHERE opponent = 'Hawks'), 24, 2, 1, 2, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 8, 1, 1, 'game', 2);

-- Add some additional players for more depth
INSERT INTO players (name, "positionId", jersey, "phoneNumber", email, height, weight, "birthDate", "isActive", "updatedBy", "user_id", "first_name", "last_name", "school_year", "jersey_number", "profile_id")
VALUES 
('Marcus Johnson', 7, '12', '555-0123', 'marcus.johnson@email.com', 6.2, 185, '2005-03-15', true, 1, '5e4fc558-dac5-4dcc-bdde-91763c4aee8b', 'Marcus', 'Johnson', 'senior', '12', 1),
('David Wilson', 8, '14', '555-0124', 'david.wilson@email.com', 6.4, 200, '2005-07-22', true, 1, '5e4fc558-dac5-4dcc-bdde-91763c4aee8b', 'David', 'Wilson', 'senior', '14', 2),
('James Brown', 6, '16', '555-0125', 'james.brown@email.com', 6.6, 220, '2005-01-10', true, 1, '5e4fc558-dac5-4dcc-bdde-91763c4aee8b', 'James', 'Brown', 'senior', '16', 3),
('Michael Davis', 7, '18', '555-0126', 'michael.davis@email.com', 6.1, 175, '2005-05-18', true, 1, '5e4fc558-dac5-4dcc-bdde-91763c4aee8b', 'Michael', 'Davis', 'senior', '18', 4),
('Robert Miller', 8, '20', '555-0127', 'robert.miller@email.com', 6.3, 195, '2005-09-25', true, 1, '5e4fc558-dac5-4dcc-bdde-91763c4aee8b', 'Robert', 'Miller', 'senior', '20', 5);

-- Add game stats for the new players in recent games
-- Game 3: LKRM vs Warriors (additional players)
INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
VALUES 
((SELECT id FROM games WHERE opponent = 'Warriors'), (SELECT id FROM players WHERE jersey = '12'), 5, 2, 4, 1, 2, 0, 0, 2, 0, 2, 1, 0, 0, 1, 1, 12, 3, 1, 'game', 2);

-- Game 4: LKRM vs Lions (additional players)
INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
VALUES 
((SELECT id FROM games WHERE opponent = 'Lions'), (SELECT id FROM players WHERE jersey = '12'), 7, 3, 5, 1, 2, 0, 0, 3, 1, 2, 2, 1, 0, 0, 1, 15, 4, 1, 'game', 4),
((SELECT id FROM games WHERE opponent = 'Lions'), (SELECT id FROM players WHERE jersey = '14'), 4, 2, 3, 0, 0, 0, 0, 2, 0, 2, 0, 0, 0, 1, 1, 10, 1, 1, 'game', 2);

-- Game 5: LKRM vs Hawks (additional players)
INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
VALUES 
((SELECT id FROM games WHERE opponent = 'Hawks'), (SELECT id FROM players WHERE jersey = '12'), 8, 3, 6, 1, 3, 1, 1, 4, 1, 3, 2, 1, 0, 1, 1, 18, 5, 1, 'game', 4),
((SELECT id FROM games WHERE opponent = 'Hawks'), (SELECT id FROM players WHERE jersey = '14'), 6, 2, 4, 0, 1, 2, 2, 3, 1, 2, 1, 0, 0, 0, 1, 14, 3, 1, 'game', 4),
((SELECT id FROM games WHERE opponent = 'Hawks'), (SELECT id FROM players WHERE jersey = '16'), 3, 1, 2, 0, 0, 1, 2, 2, 0, 2, 0, 0, 0, 0, 1, 8, 2, 1, 'game', 2);

-- Update the existing game to have a proper score
UPDATE games SET "homeScore" = 78, "awayScore" = 65, result = 'WIN' WHERE opponent = 'Lander';

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

-- Create some quarter-by-quarter data for game analysis
INSERT INTO game_quarter_totals (gameid, quarter, points, reb, ast, stl, blk, tov, pf, timeouts)
VALUES 
((SELECT id FROM games WHERE opponent = 'Thunder'), 1, 18, 8, 4, 2, 1, 3, 4, 1),
((SELECT id FROM games WHERE opponent = 'Thunder'), 2, 22, 12, 6, 3, 2, 2, 3, 1),
((SELECT id FROM games WHERE opponent = 'Thunder'), 3, 20, 10, 5, 2, 1, 4, 5, 2),
((SELECT id FROM games WHERE opponent = 'Thunder'), 4, 18, 9, 4, 1, 1, 2, 2, 1),
((SELECT id FROM games WHERE opponent = 'Warriors'), 1, 24, 10, 6, 3, 1, 2, 3, 1),
((SELECT id FROM games WHERE opponent = 'Warriors'), 2, 22, 8, 5, 2, 2, 3, 4, 1),
((SELECT id FROM games WHERE opponent = 'Warriors'), 3, 25, 12, 7, 4, 1, 1, 2, 2),
((SELECT id FROM games WHERE opponent = 'Warriors'), 4, 18, 9, 4, 2, 1, 2, 3, 1);

-- Summary of what this script creates:
-- 5 new game events with realistic opponents
-- 5 new game records with scores and results
-- Comprehensive game statistics for 6+ players across 5 games
-- 5 additional players for roster depth
-- Player notes and goals for development tracking
-- Quarter-by-quarter breakdowns for game analysis
-- Total: ~30+ game stat records for comprehensive analysis

SELECT 'Sample data loaded successfully! You now have comprehensive game statistics to work with.' as status;
