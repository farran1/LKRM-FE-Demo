-- Fix foreign key constraints to preserve stats data when players are soft deleted
-- Change from CASCADE to SET NULL to maintain team stats integrity

-- Drop existing foreign key constraints
ALTER TABLE game_stats DROP CONSTRAINT IF EXISTS game_stats_playerId_fkey;
ALTER TABLE player_notes DROP CONSTRAINT IF EXISTS player_notes_playerId_fkey;
ALTER TABLE player_goals DROP CONSTRAINT IF EXISTS player_goals_playerId_fkey;
ALTER TABLE player_events DROP CONSTRAINT IF EXISTS player_events_playerId_fkey;
ALTER TABLE live_game_events DROP CONSTRAINT IF EXISTS live_game_events_player_id_fkey;

-- Add new foreign key constraints with SET NULL on delete
ALTER TABLE game_stats 
ADD CONSTRAINT game_stats_playerId_fkey 
FOREIGN KEY ("playerId") REFERENCES players(id) 
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE player_notes 
ADD CONSTRAINT player_notes_playerId_fkey 
FOREIGN KEY ("playerId") REFERENCES players(id) 
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE player_goals 
ADD CONSTRAINT player_goals_playerId_fkey 
FOREIGN KEY ("playerId") REFERENCES players(id) 
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE player_events 
ADD CONSTRAINT player_events_playerId_fkey 
FOREIGN KEY ("playerId") REFERENCES players(id) 
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE live_game_events 
ADD CONSTRAINT live_game_events_player_id_fkey 
FOREIGN KEY (player_id) REFERENCES players(id) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Add comments to document the change
COMMENT ON CONSTRAINT game_stats_playerId_fkey ON game_stats IS 'Player stats preserved when player is soft deleted (isActive=false)';
COMMENT ON CONSTRAINT player_notes_playerId_fkey ON player_notes IS 'Player notes preserved when player is soft deleted (isActive=false)';
COMMENT ON CONSTRAINT player_goals_playerId_fkey ON player_goals IS 'Player goals preserved when player is soft deleted (isActive=false)';
COMMENT ON CONSTRAINT player_events_playerId_fkey ON player_events IS 'Player events preserved when player is soft deleted (isActive=false)';
COMMENT ON CONSTRAINT live_game_events_player_id_fkey ON live_game_events IS 'Live game events preserved when player is soft deleted (isActive=false)';
