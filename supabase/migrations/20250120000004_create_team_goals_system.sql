-- Create team goals tracking system tables
-- Migration: Create stat_metrics, team_goals, and team_goal_progress tables

-- 1. Create stat_metrics table for configurable metrics
CREATE TABLE IF NOT EXISTS stat_metrics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('offense', 'defense', 'efficiency', 'special')),
    description TEXT,
    unit VARCHAR(50) NOT NULL DEFAULT 'per_game',
    calculation_type VARCHAR(20) NOT NULL CHECK (calculation_type IN ('sum', 'average', 'percentage', 'ratio')),
    event_types JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create team_goals table
CREATE TABLE IF NOT EXISTS team_goals (
    id SERIAL PRIMARY KEY,
    metric_id INTEGER NOT NULL REFERENCES stat_metrics(id) ON DELETE CASCADE,
    target_value DECIMAL(10,2) NOT NULL,
    comparison_operator VARCHAR(10) NOT NULL CHECK (comparison_operator IN ('gte', 'lte', 'eq')),
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('per_game', 'season_total', 'rolling_5', 'rolling_10')),
    season VARCHAR(10) NOT NULL,
    competition_filter JSONB DEFAULT '{}',
    visibility VARCHAR(20) NOT NULL DEFAULT 'staff_only' CHECK (visibility IN ('staff_only', 'shared_with_team')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create team_goal_progress table for historical tracking
CREATE TABLE IF NOT EXISTS team_goal_progress (
    id SERIAL PRIMARY KEY,
    goal_id INTEGER NOT NULL REFERENCES team_goals(id) ON DELETE CASCADE,
    game_session_id INTEGER NOT NULL REFERENCES live_game_sessions(id) ON DELETE CASCADE,
    actual_value DECIMAL(10,2) NOT NULL,
    target_value DECIMAL(10,2) NOT NULL,
    delta DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('on_track', 'at_risk', 'off_track')),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stat_metrics_category ON stat_metrics(category);
CREATE INDEX IF NOT EXISTS idx_stat_metrics_active ON stat_metrics(is_active);
CREATE INDEX IF NOT EXISTS idx_team_goals_season ON team_goals(season);
CREATE INDEX IF NOT EXISTS idx_team_goals_status ON team_goals(status);
CREATE INDEX IF NOT EXISTS idx_team_goals_created_by ON team_goals(created_by);
CREATE INDEX IF NOT EXISTS idx_team_goal_progress_goal_id ON team_goal_progress(goal_id);
CREATE INDEX IF NOT EXISTS idx_team_goal_progress_session_id ON team_goal_progress(game_session_id);
CREATE INDEX IF NOT EXISTS idx_team_goal_progress_calculated_at ON team_goal_progress(calculated_at);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_stat_metrics_updated_at BEFORE UPDATE ON stat_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_goals_updated_at BEFORE UPDATE ON team_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial basketball metrics
INSERT INTO stat_metrics (name, category, description, unit, calculation_type, event_types) VALUES
-- Offense metrics
('Points', 'offense', 'Total points scored by the team', 'per_game', 'sum', '["fg_made", "three_made", "ft_made"]'),
('Field Goal Percentage', 'offense', 'Percentage of field goals made', 'percentage', 'percentage', '["fg_made", "fg_missed"]'),
('Three Point Percentage', 'offense', 'Percentage of three-point shots made', 'percentage', 'percentage', '["three_made", "three_missed"]'),
('Free Throw Percentage', 'offense', 'Percentage of free throws made', 'percentage', 'percentage', '["ft_made", "ft_missed"]'),
('Assists', 'offense', 'Number of assists', 'per_game', 'sum', '["assist"]'),
('Offensive Rebounds', 'offense', 'Number of offensive rebounds', 'per_game', 'sum', '["offensive_rebound"]'),
('Total Rebounds', 'offense', 'Number of total rebounds', 'per_game', 'sum', '["offensive_rebound", "defensive_rebound"]'),

-- Defense metrics
('Turnovers', 'defense', 'Number of turnovers committed', 'per_game', 'sum', '["turnover"]'),
('Steals', 'defense', 'Number of steals', 'per_game', 'sum', '["steal"]'),
('Blocks', 'defense', 'Number of blocks', 'per_game', 'sum', '["block"]'),
('Defensive Rebounds', 'defense', 'Number of defensive rebounds', 'per_game', 'sum', '["defensive_rebound"]'),
('Opponent Field Goal Percentage', 'defense', 'Opponent field goal percentage', 'percentage', 'percentage', '["opponent_fg_made", "opponent_fg_missed"]'),
('Opponent Points', 'defense', 'Points allowed to opponent', 'per_game', 'sum', '["opponent_fg_made", "opponent_three_made", "opponent_ft_made"]'),

-- Efficiency metrics
('Assist-to-Turnover Ratio', 'efficiency', 'Ratio of assists to turnovers', 'ratio', 'ratio', '["assist", "turnover"]'),
('Field Goal Attempts', 'efficiency', 'Total field goal attempts', 'per_game', 'sum', '["fg_made", "fg_missed"]'),
('Three Point Attempts', 'efficiency', 'Total three-point attempts', 'per_game', 'sum', '["three_made", "three_missed"]'),
('Free Throw Attempts', 'efficiency', 'Total free throw attempts', 'per_game', 'sum', '["ft_made", "ft_missed"]'),
('True Shooting Percentage', 'efficiency', 'Overall shooting efficiency', 'percentage', 'percentage', '["fg_made", "fg_missed", "three_made", "three_missed", "ft_made", "ft_missed"]'),

-- Special metrics
('Fouls', 'special', 'Number of personal fouls', 'per_game', 'sum', '["foul"]'),
('Technical Fouls', 'special', 'Number of technical fouls', 'per_game', 'sum', '["technical_foul"]'),
('Flagrant Fouls', 'special', 'Number of flagrant fouls', 'per_game', 'sum', '["flagrant_foul"]')
ON CONFLICT DO NOTHING;

-- Enable RLS (Row Level Security)
ALTER TABLE stat_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_goal_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- stat_metrics: readable by all authenticated users
CREATE POLICY "stat_metrics_read_policy" ON stat_metrics
    FOR SELECT USING (auth.role() = 'authenticated');

-- team_goals: users can only see goals they created or goals shared with team
CREATE POLICY "team_goals_read_policy" ON team_goals
    FOR SELECT USING (
        created_by = auth.uid() OR 
        visibility = 'shared_with_team'
    );

CREATE POLICY "team_goals_insert_policy" ON team_goals
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "team_goals_update_policy" ON team_goals
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "team_goals_delete_policy" ON team_goals
    FOR DELETE USING (created_by = auth.uid());

-- team_goal_progress: readable by users who can see the associated goal
CREATE POLICY "team_goal_progress_read_policy" ON team_goal_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_goals 
            WHERE team_goals.id = team_goal_progress.goal_id 
            AND (team_goals.created_by = auth.uid() OR team_goals.visibility = 'shared_with_team')
        )
    );

CREATE POLICY "team_goal_progress_insert_policy" ON team_goal_progress
    FOR INSERT WITH CHECK (true); -- Allow system to insert progress records

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON stat_metrics TO authenticated;
GRANT ALL ON team_goals TO authenticated;
GRANT ALL ON team_goal_progress TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
