-- Populate Sample Games with Events and Statistics
-- This script creates realistic basketball game data for testing the platform

-- First, let's create some sample live game sessions
INSERT INTO live_game_sessions (event_id, game_id, session_key, game_state, is_active, started_at, ended_at, created_by)
VALUES 
  (4, 1, 'session_sample_game_1', '{"quarter": 4, "timeRemaining": 0, "homeScore": 78, "awayScore": 72, "isActive": false}', false, '2025-01-15 19:00:00', '2025-01-15 21:00:00', '1f8ce1d9-1586-4ed3-b6db-e8fb4ae29b5c'),
  (5, 2, 'session_sample_game_2', '{"quarter": 4, "timeRemaining": 0, "homeScore": 85, "awayScore": 79, "isActive": false}', false, '2025-01-20 19:00:00', '2025-01-20 21:00:00', '1f8ce1d9-1586-4ed3-b6db-e8fb4ae29b5c');

-- Get the session IDs we just created
-- Session 1 (Game vs Losers)
-- Session 2 (Game vs Whofford)

-- Sample Game 1: vs Losers (78-72 Win)
-- Quarter 1 Events
INSERT INTO live_game_events (session_id, game_id, player_id, event_type, event_value, quarter, is_opponent_event, opponent_jersey, metadata, created_at)
VALUES 
  -- Andrew Farrell (ID: 18, Jersey: 1) - Quarter 1
  (1, 1, 18, 'fg_made', 2, 1, false, null, '{"shotType": "layup", "assisted": true}', '2025-01-15 19:05:00'),
  (1, 1, 18, 'three_made', 3, 1, false, null, '{"shotType": "three_pointer", "assisted": false}', '2025-01-15 19:08:00'),
  (1, 1, 18, 'assist', 1, 1, false, null, '{"assistedPlayer": "Joey Iannetta"}', '2025-01-15 19:10:00'),
  (1, 1, 18, 'rebound', 1, 1, false, null, '{"reboundType": "defensive"}', '2025-01-15 19:12:00'),
  (1, 1, 18, 'steal', 1, 1, false, null, '{"stealType": "pass_interception"}', '2025-01-15 19:15:00'),
  
  -- Joey Iannetta (ID: 19, Jersey: 15) - Quarter 1
  (1, 1, 19, 'fg_made', 2, 1, false, null, '{"shotType": "jump_shot", "assisted": true}', '2025-01-15 19:06:00'),
  (1, 1, 19, 'fg_missed', 0, 1, false, null, '{"shotType": "three_pointer"}', '2025-01-15 19:09:00'),
  (1, 1, 19, 'rebound', 1, 1, false, null, '{"reboundType": "offensive"}', '2025-01-15 19:11:00'),
  (1, 1, 19, 'assist', 1, 1, false, null, '{"assistedPlayer": "Andrew Farrell"}', '2025-01-15 19:13:00'),
  
  -- Micah Roberson (ID: 20, Jersey: 25) - Quarter 1
  (1, 1, 20, 'three_made', 3, 1, false, null, '{"shotType": "three_pointer", "assisted": true}', '2025-01-15 19:07:00'),
  (1, 1, 20, 'rebound', 1, 1, false, null, '{"reboundType": "defensive"}', '2025-01-15 19:14:00'),
  (1, 1, 20, 'block', 1, 1, false, null, '{"blockType": "shot_block"}', '2025-01-15 19:16:00'),
  
  -- Bryan Davis (ID: 21, Jersey: 6) - Quarter 1
  (1, 1, 21, 'ft_made', 1, 1, false, null, '{"freeThrowAttempt": 1}', '2025-01-15 19:17:00'),
  (1, 1, 21, 'ft_made', 1, 1, false, null, '{"freeThrowAttempt": 2}', '2025-01-15 19:18:00'),
  (1, 1, 21, 'rebound', 1, 1, false, null, '{"reboundType": "defensive"}', '2025-01-15 19:19:00'),
  
  -- Eric Cooperman (ID: 22, Jersey: 3) - Quarter 1
  (1, 1, 22, 'fg_made', 2, 1, false, null, '{"shotType": "layup", "assisted": true}', '2025-01-15 19:20:00'),
  (1, 1, 22, 'turnover', 1, 1, false, null, '{"turnoverType": "bad_pass"}', '2025-01-15 19:21:00'),
  
  -- Opponent Events - Quarter 1
  (1, 1, null, 'fg_made', 2, 1, true, '12', '{"shotType": "jump_shot"}', '2025-01-15 19:04:00'),
  (1, 1, null, 'three_made', 3, 1, true, '8', '{"shotType": "three_pointer"}', '2025-01-15 19:08:30'),
  (1, 1, null, 'fg_missed', 0, 1, true, '15', '{"shotType": "layup"}', '2025-01-15 19:12:30'),
  (1, 1, null, 'rebound', 1, 1, true, '12', '{"reboundType": "offensive"}', '2025-01-15 19:13:30'),
  (1, 1, null, 'assist', 1, 1, true, '8', '{"assistedPlayer": "Player 12"}', '2025-01-15 19:14:30'),
  (1, 1, null, 'steal', 1, 1, true, '15', '{"stealType": "pass_interception"}', '2025-01-15 19:16:30'),
  (1, 1, null, 'turnover', 1, 1, true, '12', '{"turnoverType": "traveling"}', '2025-01-15 19:18:30'),
  (1, 1, null, 'foul', 1, 1, true, '8', '{"foulType": "shooting_foul"}', '2025-01-15 19:19:30');

-- Quarter 2 Events
INSERT INTO live_game_events (session_id, game_id, player_id, event_type, event_value, quarter, is_opponent_event, opponent_jersey, metadata, created_at)
VALUES 
  -- Andrew Farrell - Quarter 2
  (1, 1, 18, 'fg_made', 2, 2, false, null, '{"shotType": "jump_shot", "assisted": false}', '2025-01-15 19:25:00'),
  (1, 1, 18, 'three_missed', 0, 2, false, null, '{"shotType": "three_pointer"}', '2025-01-15 19:28:00'),
  (1, 1, 18, 'assist', 1, 2, false, null, '{"assistedPlayer": "Micah Roberson"}', '2025-01-15 19:30:00'),
  (1, 1, 18, 'rebound', 1, 2, false, null, '{"reboundType": "defensive"}', '2025-01-15 19:32:00'),
  (1, 1, 18, 'steal', 1, 2, false, null, '{"stealType": "ball_strip"}', '2025-01-15 19:35:00'),
  
  -- Joey Iannetta - Quarter 2
  (1, 1, 19, 'three_made', 3, 2, false, null, '{"shotType": "three_pointer", "assisted": true}', '2025-01-15 19:26:00'),
  (1, 1, 19, 'fg_made', 2, 2, false, null, '{"shotType": "layup", "assisted": false}', '2025-01-15 19:29:00'),
  (1, 1, 19, 'rebound', 1, 2, false, null, '{"reboundType": "offensive"}', '2025-01-15 19:31:00'),
  (1, 1, 19, 'assist', 1, 2, false, null, '{"assistedPlayer": "Andrew Farrell"}', '2025-01-15 19:33:00'),
  
  -- Micah Roberson - Quarter 2
  (1, 1, 20, 'fg_made', 2, 2, false, null, '{"shotType": "jump_shot", "assisted": true}', '2025-01-15 19:27:00'),
  (1, 1, 20, 'three_made', 3, 2, false, null, '{"shotType": "three_pointer", "assisted": false}', '2025-01-15 19:30:30'),
  (1, 1, 20, 'rebound', 1, 2, false, null, '{"reboundType": "defensive"}', '2025-01-15 19:34:00'),
  (1, 1, 20, 'block', 1, 2, false, null, '{"blockType": "shot_block"}', '2025-01-15 19:36:00'),
  
  -- Bryan Davis - Quarter 2
  (1, 1, 21, 'fg_made', 2, 2, false, null, '{"shotType": "layup", "assisted": true}', '2025-01-15 19:28:30'),
  (1, 1, 21, 'ft_made', 1, 2, false, null, '{"freeThrowAttempt": 1}', '2025-01-15 19:32:30'),
  (1, 1, 21, 'ft_missed', 0, 2, false, null, '{"freeThrowAttempt": 2}', '2025-01-15 19:33:30'),
  (1, 1, 21, 'rebound', 1, 2, false, null, '{"reboundType": "defensive"}', '2025-01-15 19:35:30'),
  
  -- Eric Cooperman - Quarter 2
  (1, 1, 22, 'three_made', 3, 2, false, null, '{"shotType": "three_pointer", "assisted": true}', '2025-01-15 19:29:30'),
  (1, 1, 22, 'assist', 1, 2, false, null, '{"assistedPlayer": "Bryan Davis"}', '2025-01-15 19:31:30'),
  (1, 1, 22, 'turnover', 1, 2, false, null, '{"turnoverType": "bad_pass"}', '2025-01-15 19:33:30'),
  (1, 1, 22, 'foul', 1, 2, false, null, '{"foulType": "personal_foul"}', '2025-01-15 19:36:30'),
  
  -- Opponent Events - Quarter 2
  (1, 1, null, 'fg_made', 2, 2, true, '12', '{"shotType": "layup"}', '2025-01-15 19:25:30'),
  (1, 1, null, 'three_made', 3, 2, true, '8', '{"shotType": "three_pointer"}', '2025-01-15 19:28:30'),
  (1, 1, null, 'fg_missed', 0, 2, true, '15', '{"shotType": "jump_shot"}', '2025-01-15 19:31:30'),
  (1, 1, null, 'rebound', 1, 2, true, '12', '{"reboundType": "defensive"}', '2025-01-15 19:32:30'),
  (1, 1, null, 'assist', 1, 2, true, '8', '{"assistedPlayer": "Player 12"}', '2025-01-15 19:34:30'),
  (1, 1, null, 'steal', 1, 2, true, '15', '{"stealType": "ball_strip"}', '2025-01-15 19:35:30'),
  (1, 1, null, 'turnover', 1, 2, true, '12', '{"turnoverType": "bad_pass"}', '2025-01-15 19:37:30'),
  (1, 1, null, 'foul', 1, 2, true, '8', '{"foulType": "personal_foul"}', '2025-01-15 19:38:30');

-- Quarter 3 Events
INSERT INTO live_game_events (session_id, game_id, player_id, event_type, event_value, quarter, is_opponent_event, opponent_jersey, metadata, created_at)
VALUES 
  -- Andrew Farrell - Quarter 3
  (1, 1, 18, 'fg_made', 2, 3, false, null, '{"shotType": "layup", "assisted": true}', '2025-01-15 19:45:00'),
  (1, 1, 18, 'three_made', 3, 3, false, null, '{"shotType": "three_pointer", "assisted": false}', '2025-01-15 19:48:00'),
  (1, 1, 18, 'assist', 1, 3, false, null, '{"assistedPlayer": "Joey Iannetta"}', '2025-01-15 19:50:00'),
  (1, 1, 18, 'rebound', 1, 3, false, null, '{"reboundType": "defensive"}', '2025-01-15 19:52:00'),
  (1, 1, 18, 'steal', 1, 3, false, null, '{"stealType": "pass_interception"}', '2025-01-15 19:55:00'),
  
  -- Joey Iannetta - Quarter 3
  (1, 1, 19, 'fg_made', 2, 3, false, null, '{"shotType": "jump_shot", "assisted": true}', '2025-01-15 19:46:00'),
  (1, 1, 19, 'fg_missed', 0, 3, false, null, '{"shotType": "three_pointer"}', '2025-01-15 19:49:00'),
  (1, 1, 19, 'rebound', 1, 3, false, null, '{"reboundType": "offensive"}', '2025-01-15 19:51:00'),
  (1, 1, 19, 'assist', 1, 3, false, null, '{"assistedPlayer": "Andrew Farrell"}', '2025-01-15 19:53:00'),
  
  -- Micah Roberson - Quarter 3
  (1, 1, 20, 'three_made', 3, 3, false, null, '{"shotType": "three_pointer", "assisted": true}', '2025-01-15 19:47:00'),
  (1, 1, 20, 'rebound', 1, 3, false, null, '{"reboundType": "defensive"}', '2025-01-15 19:54:00'),
  (1, 1, 20, 'block', 1, 3, false, null, '{"blockType": "shot_block"}', '2025-01-15 19:56:00'),
  
  -- Bryan Davis - Quarter 3
  (1, 1, 21, 'ft_made', 1, 3, false, null, '{"freeThrowAttempt": 1}', '2025-01-15 19:48:30'),
  (1, 1, 21, 'ft_made', 1, 3, false, null, '{"freeThrowAttempt": 2}', '2025-01-15 19:49:30'),
  (1, 1, 21, 'rebound', 1, 3, false, null, '{"reboundType": "defensive"}', '2025-01-15 19:55:30'),
  
  -- Eric Cooperman - Quarter 3
  (1, 1, 22, 'fg_made', 2, 3, false, null, '{"shotType": "layup", "assisted": true}', '2025-01-15 19:50:30'),
  (1, 1, 22, 'turnover', 1, 3, false, null, '{"turnoverType": "bad_pass"}', '2025-01-15 19:53:30'),
  
  -- Opponent Events - Quarter 3
  (1, 1, null, 'fg_made', 2, 3, true, '12', '{"shotType": "jump_shot"}', '2025-01-15 19:45:30'),
  (1, 1, null, 'three_made', 3, 3, true, '8', '{"shotType": "three_pointer"}', '2025-01-15 19:48:30'),
  (1, 1, null, 'fg_missed', 0, 3, true, '15', '{"shotType": "layup"}', '2025-01-15 19:51:30'),
  (1, 1, null, 'rebound', 1, 3, true, '12', '{"reboundType": "offensive"}', '2025-01-15 19:52:30'),
  (1, 1, null, 'assist', 1, 3, true, '8', '{"assistedPlayer": "Player 12"}', '2025-01-15 19:54:30'),
  (1, 1, null, 'steal', 1, 3, true, '15', '{"stealType": "pass_interception"}', '2025-01-15 19:55:30'),
  (1, 1, null, 'turnover', 1, 3, true, '12', '{"turnoverType": "traveling"}', '2025-01-15 19:57:30'),
  (1, 1, null, 'foul', 1, 3, true, '8', '{"foulType": "shooting_foul"}', '2025-01-15 19:58:30');

-- Quarter 4 Events
INSERT INTO live_game_events (session_id, game_id, player_id, event_type, event_value, quarter, is_opponent_event, opponent_jersey, metadata, created_at)
VALUES 
  -- Andrew Farrell - Quarter 4
  (1, 1, 18, 'fg_made', 2, 4, false, null, '{"shotType": "jump_shot", "assisted": false}', '2025-01-15 20:05:00'),
  (1, 1, 18, 'three_made', 3, 4, false, null, '{"shotType": "three_pointer", "assisted": true}', '2025-01-15 20:08:00'),
  (1, 1, 18, 'assist', 1, 4, false, null, '{"assistedPlayer": "Micah Roberson"}', '2025-01-15 20:10:00'),
  (1, 1, 18, 'rebound', 1, 4, false, null, '{"reboundType": "defensive"}', '2025-01-15 20:12:00'),
  (1, 1, 18, 'steal', 1, 4, false, null, '{"stealType": "ball_strip"}', '2025-01-15 20:15:00'),
  
  -- Joey Iannetta - Quarter 4
  (1, 1, 19, 'three_made', 3, 4, false, null, '{"shotType": "three_pointer", "assisted": true}', '2025-01-15 20:06:00'),
  (1, 1, 19, 'fg_made', 2, 4, false, null, '{"shotType": "layup", "assisted": false}', '2025-01-15 20:09:00'),
  (1, 1, 19, 'rebound', 1, 4, false, null, '{"reboundType": "offensive"}', '2025-01-15 20:11:00'),
  (1, 1, 19, 'assist', 1, 4, false, null, '{"assistedPlayer": "Andrew Farrell"}', '2025-01-15 20:13:00'),
  
  -- Micah Roberson - Quarter 4
  (1, 1, 20, 'fg_made', 2, 4, false, null, '{"shotType": "jump_shot", "assisted": true}', '2025-01-15 20:07:00'),
  (1, 1, 20, 'three_made', 3, 4, false, null, '{"shotType": "three_pointer", "assisted": false}', '2025-01-15 20:10:30'),
  (1, 1, 20, 'rebound', 1, 4, false, null, '{"reboundType": "defensive"}', '2025-01-15 20:14:00'),
  (1, 1, 20, 'block', 1, 4, false, null, '{"blockType": "shot_block"}', '2025-01-15 20:16:00'),
  
  -- Bryan Davis - Quarter 4
  (1, 1, 21, 'fg_made', 2, 4, false, null, '{"shotType": "layup", "assisted": true}', '2025-01-15 20:08:30'),
  (1, 1, 21, 'ft_made', 1, 4, false, null, '{"freeThrowAttempt": 1}', '2025-01-15 20:12:30'),
  (1, 1, 21, 'ft_made', 1, 4, false, null, '{"freeThrowAttempt": 2}', '2025-01-15 20:13:30'),
  (1, 1, 21, 'rebound', 1, 4, false, null, '{"reboundType": "defensive"}', '2025-01-15 20:15:30'),
  
  -- Eric Cooperman - Quarter 4
  (1, 1, 22, 'three_made', 3, 4, false, null, '{"shotType": "three_pointer", "assisted": true}', '2025-01-15 20:09:30'),
  (1, 1, 22, 'assist', 1, 4, false, null, '{"assistedPlayer": "Bryan Davis"}', '2025-01-15 20:11:30'),
  (1, 1, 22, 'turnover', 1, 4, false, null, '{"turnoverType": "bad_pass"}', '2025-01-15 20:13:30'),
  (1, 1, 22, 'foul', 1, 4, false, null, '{"foulType": "personal_foul"}', '2025-01-15 20:16:30'),
  
  -- Opponent Events - Quarter 4
  (1, 1, null, 'fg_made', 2, 4, true, '12', '{"shotType": "layup"}', '2025-01-15 20:05:30'),
  (1, 1, null, 'three_made', 3, 4, true, '8', '{"shotType": "three_pointer"}', '2025-01-15 20:08:30'),
  (1, 1, null, 'fg_missed', 0, 4, true, '15', '{"shotType": "jump_shot"}', '2025-01-15 20:11:30'),
  (1, 1, null, 'rebound', 1, 4, true, '12', '{"reboundType": "defensive"}', '2025-01-15 20:12:30'),
  (1, 1, null, 'assist', 1, 4, true, '8', '{"assistedPlayer": "Player 12"}', '2025-01-15 20:14:30'),
  (1, 1, null, 'steal', 1, 4, true, '15', '{"stealType": "ball_strip"}', '2025-01-15 20:15:30'),
  (1, 1, null, 'turnover', 1, 4, true, '12', '{"turnoverType": "bad_pass"}', '2025-01-15 20:17:30'),
  (1, 1, null, 'foul', 1, 4, true, '8', '{"foulType": "personal_foul"}', '2025-01-15 20:18:30');

-- Sample Game 2: vs Whofford (85-79 Win) - More condensed for brevity
INSERT INTO live_game_events (session_id, game_id, player_id, event_type, event_value, quarter, is_opponent_event, opponent_jersey, metadata, created_at)
VALUES 
  -- Game 2 Quarter 1
  (2, 2, 18, 'fg_made', 2, 1, false, null, '{"shotType": "layup"}', '2025-01-20 19:05:00'),
  (2, 2, 18, 'three_made', 3, 1, false, null, '{"shotType": "three_pointer"}', '2025-01-20 19:08:00'),
  (2, 2, 18, 'assist', 1, 1, false, null, '{"assistedPlayer": "Joey Iannetta"}', '2025-01-20 19:10:00'),
  (2, 2, 18, 'rebound', 1, 1, false, null, '{"reboundType": "defensive"}', '2025-01-20 19:12:00'),
  (2, 2, 18, 'steal', 1, 1, false, null, '{"stealType": "pass_interception"}', '2025-01-20 19:15:00'),
  
  (2, 2, 19, 'fg_made', 2, 1, false, null, '{"shotType": "jump_shot"}', '2025-01-20 19:06:00'),
  (2, 2, 19, 'three_made', 3, 1, false, null, '{"shotType": "three_pointer"}', '2025-01-20 19:09:00'),
  (2, 2, 19, 'rebound', 1, 1, false, null, '{"reboundType": "offensive"}', '2025-01-20 19:11:00'),
  (2, 2, 19, 'assist', 1, 1, false, null, '{"assistedPlayer": "Andrew Farrell"}', '2025-01-20 19:13:00'),
  
  (2, 2, 20, 'three_made', 3, 1, false, null, '{"shotType": "three_pointer"}', '2025-01-20 19:07:00'),
  (2, 2, 20, 'rebound', 1, 1, false, null, '{"reboundType": "defensive"}', '2025-01-20 19:14:00'),
  (2, 2, 20, 'block', 1, 1, false, null, '{"blockType": "shot_block"}', '2025-01-20 19:16:00'),
  
  (2, 2, 21, 'ft_made', 1, 1, false, null, '{"freeThrowAttempt": 1}', '2025-01-20 19:17:00'),
  (2, 2, 21, 'ft_made', 1, 1, false, null, '{"freeThrowAttempt": 2}', '2025-01-20 19:18:00'),
  (2, 2, 21, 'rebound', 1, 1, false, null, '{"reboundType": "defensive"}', '2025-01-20 19:19:00'),
  
  (2, 2, 22, 'fg_made', 2, 1, false, null, '{"shotType": "layup"}', '2025-01-20 19:20:00'),
  (2, 2, 22, 'turnover', 1, 1, false, null, '{"turnoverType": "bad_pass"}', '2025-01-20 19:21:00'),
  
  -- Opponent Events Game 2 Quarter 1
  (2, 2, null, 'fg_made', 2, 1, true, '10', '{"shotType": "jump_shot"}', '2025-01-20 19:04:00'),
  (2, 2, null, 'three_made', 3, 1, true, '5', '{"shotType": "three_pointer"}', '2025-01-20 19:08:30'),
  (2, 2, null, 'fg_missed', 0, 1, true, '7', '{"shotType": "layup"}', '2025-01-20 19:12:30'),
  (2, 2, null, 'rebound', 1, 1, true, '10', '{"reboundType": "offensive"}', '2025-01-20 19:13:30'),
  (2, 2, null, 'assist', 1, 1, true, '5', '{"assistedPlayer": "Player 10"}', '2025-01-20 19:14:30'),
  (2, 2, null, 'steal', 1, 1, true, '7', '{"stealType": "pass_interception"}', '2025-01-20 19:16:30'),
  (2, 2, null, 'turnover', 1, 1, true, '10', '{"turnoverType": "traveling"}', '2025-01-20 19:18:30'),
  (2, 2, null, 'foul', 1, 1, true, '5', '{"foulType": "shooting_foul"}', '2025-01-20 19:19:30');

-- Add more quarters for Game 2 (condensed)
INSERT INTO live_game_events (session_id, game_id, player_id, event_type, event_value, quarter, is_opponent_event, opponent_jersey, metadata, created_at)
VALUES 
  -- Game 2 Quarters 2-4 (condensed for brevity)
  (2, 2, 18, 'fg_made', 2, 2, false, null, '{"shotType": "jump_shot"}', '2025-01-20 19:25:00'),
  (2, 2, 18, 'three_made', 3, 2, false, null, '{"shotType": "three_pointer"}', '2025-01-20 19:28:00'),
  (2, 2, 18, 'assist', 1, 2, false, null, '{"assistedPlayer": "Micah Roberson"}', '2025-01-20 19:30:00'),
  (2, 2, 18, 'rebound', 1, 2, false, null, '{"reboundType": "defensive"}', '2025-01-20 19:32:00'),
  (2, 2, 18, 'steal', 1, 2, false, null, '{"stealType": "ball_strip"}', '2025-01-20 19:35:00'),
  
  (2, 2, 19, 'three_made', 3, 2, false, null, '{"shotType": "three_pointer"}', '2025-01-20 19:26:00'),
  (2, 2, 19, 'fg_made', 2, 2, false, null, '{"shotType": "layup"}', '2025-01-20 19:29:00'),
  (2, 2, 19, 'rebound', 1, 2, false, null, '{"reboundType": "offensive"}', '2025-01-20 19:31:00'),
  (2, 2, 19, 'assist', 1, 2, false, null, '{"assistedPlayer": "Andrew Farrell"}', '2025-01-20 19:33:00'),
  
  (2, 2, 20, 'fg_made', 2, 2, false, null, '{"shotType": "jump_shot"}', '2025-01-20 19:27:00'),
  (2, 2, 20, 'three_made', 3, 2, false, null, '{"shotType": "three_pointer"}', '2025-01-20 19:30:30'),
  (2, 2, 20, 'rebound', 1, 2, false, null, '{"reboundType": "defensive"}', '2025-01-20 19:34:00'),
  (2, 2, 20, 'block', 1, 2, false, null, '{"blockType": "shot_block"}', '2025-01-20 19:36:00'),
  
  (2, 2, 21, 'fg_made', 2, 2, false, null, '{"shotType": "layup"}', '2025-01-20 19:28:30'),
  (2, 2, 21, 'ft_made', 1, 2, false, null, '{"freeThrowAttempt": 1}', '2025-01-20 19:32:30'),
  (2, 2, 21, 'ft_made', 1, 2, false, null, '{"freeThrowAttempt": 2}', '2025-01-20 19:33:30'),
  (2, 2, 21, 'rebound', 1, 2, false, null, '{"reboundType": "defensive"}', '2025-01-20 19:35:30'),
  
  (2, 2, 22, 'three_made', 3, 2, false, null, '{"shotType": "three_pointer"}', '2025-01-20 19:29:30'),
  (2, 2, 22, 'assist', 1, 2, false, null, '{"assistedPlayer": "Bryan Davis"}', '2025-01-20 19:31:30'),
  (2, 2, 22, 'turnover', 1, 2, false, null, '{"turnoverType": "bad_pass"}', '2025-01-20 19:33:30'),
  (2, 2, 22, 'foul', 1, 2, false, null, '{"foulType": "personal_foul"}', '2025-01-20 19:36:30'),
  
  -- Opponent Events Game 2 Quarter 2
  (2, 2, null, 'fg_made', 2, 2, true, '10', '{"shotType": "layup"}', '2025-01-20 19:25:30'),
  (2, 2, null, 'three_made', 3, 2, true, '5', '{"shotType": "three_pointer"}', '2025-01-20 19:28:30'),
  (2, 2, null, 'fg_missed', 0, 2, true, '7', '{"shotType": "jump_shot"}', '2025-01-20 19:31:30'),
  (2, 2, null, 'rebound', 1, 2, true, '10', '{"reboundType": "defensive"}', '2025-01-20 19:32:30'),
  (2, 2, null, 'assist', 1, 2, true, '5', '{"assistedPlayer": "Player 10"}', '2025-01-20 19:34:30'),
  (2, 2, null, 'steal', 1, 2, true, '7', '{"stealType": "ball_strip"}', '2025-01-20 19:35:30'),
  (2, 2, null, 'turnover', 1, 2, true, '10', '{"turnoverType": "bad_pass"}', '2025-01-20 19:37:30'),
  (2, 2, null, 'foul', 1, 2, true, '5', '{"foulType": "personal_foul"}', '2025-01-20 19:38:30');

-- Add Quarters 3-4 for Game 2 (more condensed)
INSERT INTO live_game_events (session_id, game_id, player_id, event_type, event_value, quarter, is_opponent_event, opponent_jersey, metadata, created_at)
VALUES 
  -- Game 2 Quarter 3
  (2, 2, 18, 'fg_made', 2, 3, false, null, '{"shotType": "layup"}', '2025-01-20 19:45:00'),
  (2, 2, 18, 'three_made', 3, 3, false, null, '{"shotType": "three_pointer"}', '2025-01-20 19:48:00'),
  (2, 2, 18, 'assist', 1, 3, false, null, '{"assistedPlayer": "Joey Iannetta"}', '2025-01-20 19:50:00'),
  (2, 2, 18, 'rebound', 1, 3, false, null, '{"reboundType": "defensive"}', '2025-01-20 19:52:00'),
  (2, 2, 18, 'steal', 1, 3, false, null, '{"stealType": "pass_interception"}', '2025-01-20 19:55:00'),
  
  (2, 2, 19, 'fg_made', 2, 3, false, null, '{"shotType": "jump_shot"}', '2025-01-20 19:46:00'),
  (2, 2, 19, 'fg_missed', 0, 3, false, null, '{"shotType": "three_pointer"}', '2025-01-20 19:49:00'),
  (2, 2, 19, 'rebound', 1, 3, false, null, '{"reboundType": "offensive"}', '2025-01-20 19:51:00'),
  (2, 2, 19, 'assist', 1, 3, false, null, '{"assistedPlayer": "Andrew Farrell"}', '2025-01-20 19:53:00'),
  
  (2, 2, 20, 'three_made', 3, 3, false, null, '{"shotType": "three_pointer"}', '2025-01-20 19:47:00'),
  (2, 2, 20, 'rebound', 1, 3, false, null, '{"reboundType": "defensive"}', '2025-01-20 19:54:00'),
  (2, 2, 20, 'block', 1, 3, false, null, '{"blockType": "shot_block"}', '2025-01-20 19:56:00'),
  
  (2, 2, 21, 'ft_made', 1, 3, false, null, '{"freeThrowAttempt": 1}', '2025-01-20 19:48:30'),
  (2, 2, 21, 'ft_made', 1, 3, false, null, '{"freeThrowAttempt": 2}', '2025-01-20 19:49:30'),
  (2, 2, 21, 'rebound', 1, 3, false, null, '{"reboundType": "defensive"}', '2025-01-20 19:55:30'),
  
  (2, 2, 22, 'fg_made', 2, 3, false, null, '{"shotType": "layup"}', '2025-01-20 19:50:30'),
  (2, 2, 22, 'turnover', 1, 3, false, null, '{"turnoverType": "bad_pass"}', '2025-01-20 19:53:30'),
  
  -- Game 2 Quarter 4
  (2, 2, 18, 'fg_made', 2, 4, false, null, '{"shotType": "jump_shot"}', '2025-01-20 20:05:00'),
  (2, 2, 18, 'three_made', 3, 4, false, null, '{"shotType": "three_pointer"}', '2025-01-20 20:08:00'),
  (2, 2, 18, 'assist', 1, 4, false, null, '{"assistedPlayer": "Micah Roberson"}', '2025-01-20 20:10:00'),
  (2, 2, 18, 'rebound', 1, 4, false, null, '{"reboundType": "defensive"}', '2025-01-20 20:12:00'),
  (2, 2, 18, 'steal', 1, 4, false, null, '{"stealType": "ball_strip"}', '2025-01-20 20:15:00'),
  
  (2, 2, 19, 'three_made', 3, 4, false, null, '{"shotType": "three_pointer"}', '2025-01-20 20:06:00'),
  (2, 2, 19, 'fg_made', 2, 4, false, null, '{"shotType": "layup"}', '2025-01-20 20:09:00'),
  (2, 2, 19, 'rebound', 1, 4, false, null, '{"reboundType": "offensive"}', '2025-01-20 20:11:00'),
  (2, 2, 19, 'assist', 1, 4, false, null, '{"assistedPlayer": "Andrew Farrell"}', '2025-01-20 20:13:00'),
  
  (2, 2, 20, 'fg_made', 2, 4, false, null, '{"shotType": "jump_shot"}', '2025-01-20 20:07:00'),
  (2, 2, 20, 'three_made', 3, 4, false, null, '{"shotType": "three_pointer"}', '2025-01-20 20:10:30'),
  (2, 2, 20, 'rebound', 1, 4, false, null, '{"reboundType": "defensive"}', '2025-01-20 20:14:00'),
  (2, 2, 20, 'block', 1, 4, false, null, '{"blockType": "shot_block"}', '2025-01-20 20:16:00'),
  
  (2, 2, 21, 'fg_made', 2, 4, false, null, '{"shotType": "layup"}', '2025-01-20 20:08:30'),
  (2, 2, 21, 'ft_made', 1, 4, false, null, '{"freeThrowAttempt": 1}', '2025-01-20 20:12:30'),
  (2, 2, 21, 'ft_made', 1, 4, false, null, '{"freeThrowAttempt": 2}', '2025-01-20 20:13:30'),
  (2, 2, 21, 'rebound', 1, 4, false, null, '{"reboundType": "defensive"}', '2025-01-20 20:15:30'),
  
  (2, 2, 22, 'three_made', 3, 4, false, null, '{"shotType": "three_pointer"}', '2025-01-20 20:09:30'),
  (2, 2, 22, 'assist', 1, 4, false, null, '{"assistedPlayer": "Bryan Davis"}', '2025-01-20 20:11:30'),
  (2, 2, 22, 'turnover', 1, 4, false, null, '{"turnoverType": "bad_pass"}', '2025-01-20 20:13:30'),
  (2, 2, 22, 'foul', 1, 4, false, null, '{"foulType": "personal_foul"}', '2025-01-20 20:16:30'),
  
  -- Opponent Events Game 2 Quarters 3-4
  (2, 2, null, 'fg_made', 2, 3, true, '10', '{"shotType": "jump_shot"}', '2025-01-20 19:45:30'),
  (2, 2, null, 'three_made', 3, 3, true, '5', '{"shotType": "three_pointer"}', '2025-01-20 19:48:30'),
  (2, 2, null, 'fg_missed', 0, 3, true, '7', '{"shotType": "layup"}', '2025-01-20 19:51:30'),
  (2, 2, null, 'rebound', 1, 3, true, '10', '{"reboundType": "offensive"}', '2025-01-20 19:52:30'),
  (2, 2, null, 'assist', 1, 3, true, '5', '{"assistedPlayer": "Player 10"}', '2025-01-20 19:54:30'),
  (2, 2, null, 'steal', 1, 3, true, '7', '{"stealType": "pass_interception"}', '2025-01-20 19:55:30'),
  (2, 2, null, 'turnover', 1, 3, true, '10', '{"turnoverType": "traveling"}', '2025-01-20 19:57:30'),
  (2, 2, null, 'foul', 1, 3, true, '5', '{"foulType": "shooting_foul"}', '2025-01-20 19:58:30'),
  
  (2, 2, null, 'fg_made', 2, 4, true, '10', '{"shotType": "layup"}', '2025-01-20 20:05:30'),
  (2, 2, null, 'three_made', 3, 4, true, '5', '{"shotType": "three_pointer"}', '2025-01-20 20:08:30'),
  (2, 2, null, 'fg_missed', 0, 4, true, '7', '{"shotType": "jump_shot"}', '2025-01-20 20:11:30'),
  (2, 2, null, 'rebound', 1, 4, true, '10', '{"reboundType": "defensive"}', '2025-01-20 20:12:30'),
  (2, 2, null, 'assist', 1, 4, true, '5', '{"assistedPlayer": "Player 10"}', '2025-01-20 20:14:30'),
  (2, 2, null, 'steal', 1, 4, true, '7', '{"stealType": "ball_strip"}', '2025-01-20 20:15:30'),
  (2, 2, null, 'turnover', 1, 4, true, '10', '{"turnoverType": "bad_pass"}', '2025-01-20 20:17:30'),
  (2, 2, null, 'foul', 1, 4, true, '5', '{"foulType": "personal_foul"}', '2025-01-20 20:18:30');

-- Summary of what we've created:
-- Game 1: vs Losers (78-72 Win) - Session ID 1, Game ID 1
-- Game 2: vs Whofford (85-79 Win) - Session ID 2, Game ID 2
-- 
-- Each game has realistic basketball statistics across 4 quarters
-- Team players: Andrew Farrell, Joey Iannetta, Micah Roberson, Bryan Davis, Eric Cooperman
-- Opponent players: Various jersey numbers (8, 10, 12, 15, 7, 5)
-- 
-- Event types include: fg_made, fg_missed, three_made, three_missed, ft_made, ft_missed,
--                      assist, rebound, steal, block, turnover, foul
-- 
-- This data will populate:
-- - Player profiles with individual stats
-- - Game analysis with play-by-play
-- - Stats dashboard with team totals
-- - Leaderboards with top performers





