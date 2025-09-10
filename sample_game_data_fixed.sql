-- Sample Game Data for LKRM Basketball Statistics - Fixed Version
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

-- Create game records for these events using specific event IDs
-- We'll get the event IDs after they're created
INSERT INTO games ("eventId", opponent, "homeScore", "awayScore", result, "gameDate", season, "isPlayoffs", notes)
VALUES 
((SELECT id FROM events WHERE name = 'LKRM vs Thunder - Jan 2025' LIMIT 1), 'Thunder', 78, 65, 'WIN', '2025-01-15 19:00:00', '2024-25', false, 'Great team performance'),
((SELECT id FROM events WHERE name = 'LKRM vs Eagles - Jan 2025' LIMIT 1), 'Eagles', 72, 84, 'LOSS', '2025-01-22 19:30:00', '2024-25', false, 'Tough away game'),
((SELECT id FROM events WHERE name = 'LKRM vs Warriors - Jan 2025' LIMIT 1), 'Warriors', 89, 76, 'WIN', '2025-01-29 20:00:00', '2024-25', false, 'Strong offensive showing'),
((SELECT id FROM events WHERE name = 'LKRM vs Lions - Feb 2025' LIMIT 1), 'Lions', 81, 79, 'WIN', '2025-02-05 19:00:00', '2024-25', false, 'Close victory'),
((SELECT id FROM events WHERE name = 'LKRM vs Hawks - Feb 2025' LIMIT 1), 'Hawks', 95, 88, 'WIN', '2025-02-12 19:30:00', '2024-25', false, 'High-scoring game');

-- Add some additional players for more depth
INSERT INTO players (name, "positionId", jersey, "phoneNumber", email, height, weight, "birthDate", "isActive", "updatedBy", "user_id", "first_name", "last_name", "school_year", "jersey_number", "profile_id")
VALUES 
('Marcus Johnson', 7, '12', '555-0123', 'marcus.johnson@email.com', 6.2, 185, '2005-03-15', true, 1, '5e4fc558-dac5-4dcc-bdde-91763c4aee8b', 'Marcus', 'Johnson', 'senior', '12', 1),
('David Wilson', 8, '14', '555-0124', 'david.wilson@email.com', 6.4, 200, '2005-07-22', true, 1, '5e4fc558-dac5-4dcc-bdde-91763c4aee8b', 'David', 'Wilson', 'senior', '14', 2),
('James Brown', 6, '16', '555-0125', 'james.brown@email.com', 6.6, 220, '2005-01-10', true, 1, '5e4fc558-dac5-4dcc-bdde-91763c4aee8b', 'James', 'Brown', 'senior', '16', 3),
('Michael Davis', 7, '18', '555-0126', 'michael.davis@email.com', 6.1, 175, '2005-05-18', true, 1, '5e4fc558-dac5-4dcc-bdde-91763c4aee8b', 'Michael', 'Davis', 'senior', '18', 4),
('Robert Miller', 8, '20', '555-0127', 'robert.miller@email.com', 6.3, 195, '2005-09-25', true, 1, '5e4fc558-dac5-4dcc-bdde-91763c4aee8b', 'Robert', 'Miller', 'senior', '20', 5);

-- Game 1: LKRM vs Thunder (WIN 78-65) - Using specific game ID lookup
INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
VALUES 
((SELECT id FROM games WHERE opponent = 'Thunder' AND "gameDate" = '2025-01-15 19:00:00' LIMIT 1), 18, 22, 8, 15, 2, 5, 4, 6, 7, 2, 5, 5, 2, 1, 3, 2, 32, 8, 1, 'game', 6),
((SELECT id FROM games WHERE opponent = 'Thunder' AND "gameDate" = '2025-01-15 19:00:00' LIMIT 1), 19, 18, 7, 12, 1, 3, 3, 4, 9, 3, 6, 3, 1, 2, 2, 1, 28, 12, 1, 'game', 8),
((SELECT id FROM games WHERE opponent = 'Thunder' AND "gameDate" = '2025-01-15 19:00:00' LIMIT 1), 20, 15, 6, 11, 3, 6, 0, 0, 4, 1, 3, 8, 3, 0, 1, 3, 30, 15, 1, 'game', 4),
((SELECT id FROM games WHERE opponent = 'Thunder' AND "gameDate" = '2025-01-15 19:00:00' LIMIT 1), 21, 12, 5, 9, 2, 4, 0, 0, 6, 2, 4, 2, 1, 1, 2, 2, 25, 6, 1, 'game', 6),
((SELECT id FROM games WHERE opponent = 'Thunder' AND "gameDate" = '2025-01-15 19:00:00' LIMIT 1), 22, 8, 3, 7, 0, 2, 2, 2, 3, 1, 2, 4, 2, 0, 1, 1, 22, 4, 1, 'game', 4),
((SELECT id FROM games WHERE opponent = 'Thunder' AND "gameDate" = '2025-01-15 19:00:00' LIMIT 1), 24, 3, 1, 4, 0, 1, 1, 2, 2, 0, 2, 1, 0, 0, 0, 2, 15, -2, 1, 'game', 2);

-- Game 2: LKRM vs Eagles (LOSS 72-84)
INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
VALUES 
((SELECT id FROM games WHERE opponent = 'Eagles' AND "gameDate" = '2025-01-22 19:30:00' LIMIT 1), 18, 19, 7, 18, 1, 6, 4, 5, 5, 1, 4, 3, 1, 0, 4, 3, 35, -8, 1, 'game', 8),
((SELECT id FROM games WHERE opponent = 'Eagles' AND "gameDate" = '2025-01-22 19:30:00' LIMIT 1), 19, 16, 6, 14, 2, 5, 2, 3, 8, 2, 6, 2, 2, 1, 3, 2, 30, -5, 1, 'game', 6),
((SELECT id FROM games WHERE opponent = 'Eagles' AND "gameDate" = '2025-01-22 19:30:00' LIMIT 1), 20, 14, 5, 12, 2, 7, 2, 2, 3, 0, 3, 6, 2, 0, 2, 4, 28, -12, 1, 'game', 4),
((SELECT id FROM games WHERE opponent = 'Eagles' AND "gameDate" = '2025-01-22 19:30:00' LIMIT 1), 21, 11, 4, 10, 1, 4, 2, 2, 7, 3, 4, 1, 1, 2, 1, 2, 26, -3, 1, 'game', 6),
((SELECT id FROM games WHERE opponent = 'Eagles' AND "gameDate" = '2025-01-22 19:30:00' LIMIT 1), 22, 8, 3, 8, 0, 3, 2, 3, 2, 0, 2, 3, 1, 0, 2, 1, 20, -6, 1, 'game', 4),
((SELECT id FROM games WHERE opponent = 'Eagles' AND "gameDate" = '2025-01-22 19:30:00' LIMIT 1), 24, 4, 2, 5, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 1, 12, -8, 1, 'game', 2);

-- Game 3: LKRM vs Warriors (WIN 89-76)
INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
VALUES 
((SELECT id FROM games WHERE opponent = 'Warriors' AND "gameDate" = '2025-01-29 20:00:00' LIMIT 1), 18, 28, 10, 19, 4, 8, 4, 5, 8, 2, 6, 6, 3, 1, 2, 2, 36, 16, 1, 'game', 12),
((SELECT id FROM games WHERE opponent = 'Warriors' AND "gameDate" = '2025-01-29 20:00:00' LIMIT 1), 19, 21, 8, 15, 2, 4, 3, 4, 11, 4, 7, 4, 2, 3, 1, 1, 32, 18, 1, 'game', 10),
((SELECT id FROM games WHERE opponent = 'Warriors' AND "gameDate" = '2025-01-29 20:00:00' LIMIT 1), 20, 18, 6, 13, 3, 7, 3, 3, 5, 1, 4, 9, 4, 0, 1, 2, 31, 14, 1, 'game', 6),
((SELECT id FROM games WHERE opponent = 'Warriors' AND "gameDate" = '2025-01-29 20:00:00' LIMIT 1), 21, 14, 5, 11, 2, 5, 2, 2, 8, 3, 5, 3, 2, 1, 1, 2, 28, 12, 1, 'game', 8),
((SELECT id FROM games WHERE opponent = 'Warriors' AND "gameDate" = '2025-01-29 20:00:00' LIMIT 1), 22, 6, 2, 6, 0, 2, 2, 2, 4, 1, 3, 2, 1, 0, 1, 1, 22, 8, 1, 'game', 4),
((SELECT id FROM games WHERE opponent = 'Warriors' AND "gameDate" = '2025-01-29 20:00:00' LIMIT 1), 24, 2, 1, 3, 0, 1, 0, 0, 2, 0, 2, 0, 0, 0, 0, 1, 10, 4, 1, 'game', 2);

-- Game 4: LKRM vs Lions (WIN 81-79)
INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
VALUES 
((SELECT id FROM games WHERE opponent = 'Lions' AND "gameDate" = '2025-02-05 19:00:00' LIMIT 1), 18, 24, 9, 17, 3, 7, 3, 4, 6, 1, 5, 4, 2, 0, 2, 3, 34, 5, 1, 'game', 10),
((SELECT id FROM games WHERE opponent = 'Lions' AND "gameDate" = '2025-02-05 19:00:00' LIMIT 1), 19, 19, 7, 13, 2, 4, 3, 4, 10, 3, 7, 3, 1, 2, 1, 2, 30, 7, 1, 'game', 8),
((SELECT id FROM games WHERE opponent = 'Lions' AND "gameDate" = '2025-02-05 19:00:00' LIMIT 1), 20, 16, 6, 12, 2, 6, 2, 2, 4, 1, 3, 7, 3, 0, 2, 3, 29, 4, 1, 'game', 6),
((SELECT id FROM games WHERE opponent = 'Lions' AND "gameDate" = '2025-02-05 19:00:00' LIMIT 1), 21, 12, 5, 10, 1, 3, 1, 2, 8, 2, 6, 3, 1, 1, 2, 2, 28, 6, 1, 'game', 8),
((SELECT id FROM games WHERE opponent = 'Lions' AND "gameDate" = '2025-02-05 19:00:00' LIMIT 1), 22, 6, 2, 5, 0, 1, 2, 2, 3, 1, 2, 2, 1, 0, 1, 1, 20, 3, 1, 'game', 4),
((SELECT id FROM games WHERE opponent = 'Lions' AND "gameDate" = '2025-02-05 19:00:00' LIMIT 1), 24, 4, 2, 4, 0, 0, 0, 0, 2, 0, 2, 0, 0, 0, 0, 1, 12, 2, 1, 'game', 2);

-- Game 5: LKRM vs Hawks (WIN 95-88)
INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
VALUES 
((SELECT id FROM games WHERE opponent = 'Hawks' AND "gameDate" = '2025-02-12 19:30:00' LIMIT 1), 18, 31, 11, 20, 5, 9, 4, 5, 7, 2, 5, 5, 3, 1, 2, 2, 38, 12, 1, 'game', 14),
((SELECT id FROM games WHERE opponent = 'Hawks' AND "gameDate" = '2025-02-12 19:30:00' LIMIT 1), 19, 25, 9, 16, 3, 6, 4, 5, 12, 4, 8, 4, 2, 2, 1, 1, 34, 15, 1, 'game', 12),
((SELECT id FROM games WHERE opponent = 'Hawks' AND "gameDate" = '2025-02-12 19:30:00' LIMIT 1), 20, 20, 7, 14, 3, 8, 3, 3, 5, 1, 4, 8, 4, 0, 1, 2, 32, 10, 1, 'game', 8),
((SELECT id FROM games WHERE opponent = 'Hawks' AND "gameDate" = '2025-02-12 19:30:00' LIMIT 1), 21, 12, 5, 10, 1, 3, 1, 2, 8, 2, 6, 3, 1, 1, 2, 2, 28, 6, 1, 'game', 8),
((SELECT id FROM games WHERE opponent = 'Hawks' AND "gameDate" = '2025-02-12 19:30:00' LIMIT 1), 22, 6, 2, 5, 0, 1, 2, 2, 3, 1, 2, 2, 1, 0, 1, 1, 20, 3, 1, 'game', 4),
((SELECT id FROM games WHERE opponent = 'Hawks' AND "gameDate" = '2025-02-12 19:30:00' LIMIT 1), 24, 2, 1, 2, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 8, 1, 1, 'game', 2);

-- Add game stats for the new players in recent games
-- Game 3: LKRM vs Warriors (additional players)
INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
VALUES 
((SELECT id FROM games WHERE opponent = 'Warriors' AND "gameDate" = '2025-01-29 20:00:00' LIMIT 1), (SELECT id FROM players WHERE name = 'Marcus Johnson' LIMIT 1), 8, 3, 6, 1, 2, 1, 2, 3, 1, 2, 2, 1, 0, 1, 1, 18, 4, 1, 'game', 4),
((SELECT id FROM games WHERE opponent = 'Warriors' AND "gameDate" = '2025-01-29 20:00:00' LIMIT 1), (SELECT id FROM players WHERE name = 'David Wilson' LIMIT 1), 6, 2, 4, 0, 1, 2, 2, 4, 2, 2, 1, 0, 1, 0, 1, 15, 2, 1, 'game', 4);

-- Game 4: LKRM vs Lions (additional players)
INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
VALUES 
((SELECT id FROM games WHERE opponent = 'Lions' AND "gameDate" = '2025-02-05 19:00:00' LIMIT 1), (SELECT id FROM players WHERE name = 'James Brown' LIMIT 1), 10, 4, 7, 1, 3, 1, 2, 5, 2, 3, 1, 0, 2, 1, 2, 20, 3, 1, 'game', 6),
((SELECT id FROM games WHERE opponent = 'Lions' AND "gameDate" = '2025-02-05 19:00:00' LIMIT 1), (SELECT id FROM players WHERE name = 'Michael Davis' LIMIT 1), 7, 3, 5, 0, 2, 1, 1, 3, 1, 2, 2, 1, 0, 1, 1, 16, 2, 1, 'game', 4);

-- Game 5: LKRM vs Hawks (additional players)
INSERT INTO game_stats ("gameId", "playerId", points, "fieldGoalsMade", "fieldGoalsAttempted", "threePointsMade", "threePointsAttempted", "freeThrowsMade", "freeThrowsAttempted", rebounds, "offensiveRebounds", "defensiveRebounds", assists, steals, blocks, turnovers, fouls, "minutesPlayed", "plusMinus", quarter, period, "points_in_paint")
VALUES 
((SELECT id FROM games WHERE opponent = 'Hawks' AND "gameDate" = '2025-02-12 19:30:00' LIMIT 1), (SELECT id FROM players WHERE name = 'Robert Miller' LIMIT 1), 9, 3, 6, 1, 2, 2, 2, 4, 1, 3, 1, 1, 1, 1, 1, 17, 3, 1, 'game', 4);

-- Add some player notes for context
INSERT INTO player_notes ("playerId", note, "createdBy", "updatedBy")
VALUES 
((SELECT id FROM players WHERE name = 'Marcus Johnson' LIMIT 1), 'Great defensive presence and team leadership', 1, 1),
((SELECT id FROM players WHERE name = 'David Wilson' LIMIT 1), 'Strong rebounder and consistent scorer', 1, 1),
((SELECT id FROM players WHERE name = 'James Brown' LIMIT 1), 'Excellent shot blocker and paint defender', 1, 1);

-- Add some player goals
INSERT INTO player_goals ("playerId", goal, "targetValue", "currentValue", "deadline", "isCompleted", "createdBy", "updatedBy")
VALUES 
((SELECT id FROM players WHERE name = 'Marcus Johnson' LIMIT 1), 'Improve three-point percentage', 35.0, 28.5, '2025-03-01', false, 1, 1),
((SELECT id FROM players WHERE name = 'David Wilson' LIMIT 1), 'Increase rebounds per game', 8.0, 6.2, '2025-03-01', false, 1, 1),
((SELECT id FROM players WHERE name = 'James Brown' LIMIT 1), 'Reduce turnovers per game', 2.0, 2.8, '2025-03-01', false, 1, 1);

-- Add quarter totals for some games
INSERT INTO game_quarter_totals ("gameId", quarter, "teamPoints", "opponentPoints", "teamFouls", "opponentFouls", "teamTimeouts", "opponentTimeouts")
VALUES 
((SELECT id FROM games WHERE opponent = 'Thunder' AND "gameDate" = '2025-01-15 19:00:00' LIMIT 1), 1, 22, 18, 4, 5, 2, 1),
((SELECT id FROM games WHERE opponent = 'Thunder' AND "gameDate" = '2025-01-15 19:00:00' LIMIT 1), 2, 20, 16, 3, 4, 1, 2),
((SELECT id FROM games WHERE opponent = 'Thunder' AND "gameDate" = '2025-01-15 19:00:00' LIMIT 1), 3, 18, 15, 2, 3, 1, 1),
((SELECT id FROM games WHERE opponent = 'Thunder' AND "gameDate" = '2025-01-15 19:00:00' LIMIT 1), 4, 18, 16, 3, 4, 1, 1);

-- Success message
SELECT 'Sample game data has been successfully loaded!' as message;
