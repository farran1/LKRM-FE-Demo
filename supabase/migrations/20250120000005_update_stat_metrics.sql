-- Update stat_metrics to match the old system
-- This replaces the metrics with the correct event types that match the live stat tracker

-- First, clear existing team_goals that reference metrics
DELETE FROM team_goals;

-- Then clear existing metrics
DELETE FROM stat_metrics;

-- Insert the correct metrics matching the old system
INSERT INTO stat_metrics (id, name, category, description, unit, calculation_type, event_types, is_active, created_at, updated_at) VALUES
-- Offense metrics
(1, 'Points', 'offense', 'Total points scored', 'per_game', 'sum', '["fg_made", "three_made", "ft_made"]', true, now(), now()),
(2, 'Field Goal Percentage', 'offense', 'Percentage of field goals made', 'percentage', 'percentage', '["fg_made", "fg_missed"]', true, now(), now()),
(3, 'Three Point Percentage', 'offense', 'Percentage of three-pointers made', 'percentage', 'percentage', '["three_made", "three_missed"]', true, now(), now()),
(4, 'Free Throw Percentage', 'offense', 'Percentage of free throws made', 'percentage', 'percentage', '["ft_made", "ft_missed"]', true, now(), now()),
(5, 'Assists', 'offense', 'Number of assists', 'per_game', 'sum', '["assist"]', true, now(), now()),
(6, 'Offensive Rebounds', 'offense', 'Number of offensive rebounds', 'per_game', 'sum', '["rebound"]', true, now(), now()),
(7, 'Turnovers', 'offense', 'Number of turnovers', 'per_game', 'sum', '["turnover"]', true, now(), now()),
(8, 'Free Throw Attempts', 'offense', 'Number of free throw attempts', 'per_game', 'sum', '["ft_made", "ft_missed"]', true, now(), now()),

-- Defense metrics  
(9, 'Opponent Points', 'defense', 'Points allowed to opponent', 'per_game', 'sum', '["fg_made", "three_made", "ft_made"]', true, now(), now()),
(10, 'Opponent Field Goal Percentage', 'defense', 'Opponent field goal percentage', 'percentage', 'percentage', '["fg_made", "fg_missed"]', true, now(), now()),
(11, 'Opponent Three Point Percentage', 'defense', 'Opponent three-point percentage', 'percentage', 'percentage', '["three_made", "three_missed"]', true, now(), now()),
(13, 'Steals', 'defense', 'Number of steals', 'per_game', 'sum', '["steal"]', true, now(), now()),
(14, 'Blocks', 'defense', 'Number of blocks', 'per_game', 'sum', '["block"]', true, now(), now()),
(15, 'Fouls', 'defense', 'Number of fouls', 'per_game', 'sum', '["foul"]', true, now(), now()),

-- Efficiency metrics
(16, 'Assist-to-Turnover Ratio', 'efficiency', 'Ratio of assists to turnovers', 'ratio', 'ratio', '["assist", "turnover"]', true, now(), now()),
(17, 'Rebounds', 'efficiency', 'Total rebounds (offensive + defensive)', 'per_game', 'sum', '["rebound"]', true, now(), now()),
(18, 'Plus/Minus', 'efficiency', 'Point differential', 'per_game', 'sum', '["fg_made", "three_made", "ft_made"]', true, now(), now()),

-- Special metrics
(19, 'Points off Turnovers', 'special', 'Points scored after forcing turnovers', 'per_game', 'sum', '["fg_made", "three_made", "ft_made"]', true, now(), now()),
(20, 'Second Chance Points', 'special', 'Points scored on offensive rebounds', 'per_game', 'sum', '["fg_made", "three_made", "ft_made"]', true, now(), now());

-- Reset the sequence to continue from the highest ID
SELECT setval('stat_metrics_id_seq', 20);

