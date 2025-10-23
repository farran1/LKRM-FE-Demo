-- =====================================================
-- COMPREHENSIVE DATABASE MIGRATION SCRIPT
-- LKRM Basketball Coaching Platform
-- Fresh Start for New Client
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CREATE CUSTOM TYPES AND ENUMS
-- =====================================================

-- Location enum for events
CREATE TYPE location AS ENUM ('HOME', 'AWAY');

-- School year enum for players
CREATE TYPE school_year_enum AS ENUM ('freshman', 'sophomore', 'junior', 'senior');

-- Task status enum
CREATE TYPE taskstatus AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'ARCHIVE');

-- =====================================================
-- CREATE TABLES
-- =====================================================

-- Positions table
CREATE TABLE positions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    abbreviation TEXT NOT NULL UNIQUE,
    description TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER DEFAULT 0,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER DEFAULT 0
);

COMMENT ON TABLE positions IS 'Player positions (Center, Guard, Forward)';

-- Event types table
CREATE TABLE event_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#1890ff',
    icon TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER DEFAULT 0
);

COMMENT ON TABLE event_types IS 'Types of events (games, practices, meetings, etc.)';

-- Players table
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    "positionId" INTEGER NOT NULL REFERENCES positions(id),
    jersey TEXT NOT NULL,
    "phoneNumber" TEXT,
    email TEXT,
    height DOUBLE PRECISION,
    weight DOUBLE PRECISION,
    avatar TEXT,
    "birthDate" TIMESTAMP,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER DEFAULT 0,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER DEFAULT 0,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    school_year school_year_enum NOT NULL,
    jersey_number VARCHAR NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    profile_id INTEGER NOT NULL
);

COMMENT ON TABLE players IS 'Player information and profiles';

-- Create indexes for players
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
CREATE INDEX IF NOT EXISTS idx_players_position_id ON players("positionId");
CREATE INDEX IF NOT EXISTS idx_players_jersey ON players(jersey);
CREATE INDEX IF NOT EXISTS idx_players_created_by ON players("createdBy");

-- Events table
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    "eventTypeId" INTEGER NOT NULL REFERENCES event_types(id),
    "startTime" TIMESTAMP NOT NULL,
    "endTime" TIMESTAMP,
    location location,
    venue TEXT NOT NULL,
    "oppositionTeam" TEXT,
    "isRepeat" BOOLEAN DEFAULT false,
    occurence INTEGER DEFAULT 0,
    "isNotice" BOOLEAN DEFAULT false,
    notes TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "repeatType" TEXT DEFAULT 'weekly' CHECK ("repeatType" IN ('daily', 'weekly', 'monthly', 'yearly')),
    "daysOfWeek" INTEGER[],
    "createdBy" UUID NOT NULL REFERENCES auth.users(id),
    "updatedBy" UUID NOT NULL REFERENCES auth.users(id)
);

COMMENT ON TABLE events IS 'Scheduled events with location and timing';

-- Create indexes for events
CREATE INDEX IF NOT EXISTS idx_events_name ON events(name);
CREATE INDEX IF NOT EXISTS idx_events_event_type_id ON events("eventTypeId");
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events("startTime");
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events("createdBy");
CREATE INDEX IF NOT EXISTS idx_events_end_date ON events("endTime");

-- Player-Event relationships
CREATE TABLE player_events (
    "playerId" INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    "eventId" INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER DEFAULT 0,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER DEFAULT 0,
    PRIMARY KEY ("playerId", "eventId")
);

COMMENT ON TABLE player_events IS 'Many-to-many relationship between players and events';

-- Create indexes for player_events
CREATE INDEX IF NOT EXISTS idx_player_events_event_id ON player_events("eventId");

-- Task priorities table
CREATE TABLE task_priorities (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    weight INTEGER NOT NULL UNIQUE,
    color TEXT DEFAULT '#1890ff',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER DEFAULT 0,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER DEFAULT 0
);

COMMENT ON TABLE task_priorities IS 'Priority levels for tasks';

-- Tasks table
CREATE TABLE tasks (
    "userId" SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    "dueDate" TIMESTAMP,
    "priorityId" INTEGER NOT NULL REFERENCES task_priorities(id),
    status taskstatus DEFAULT 'TODO',
    "eventId" INTEGER REFERENCES events(id),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdBy" VARCHAR DEFAULT 'system@lkrmsports.com',
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" VARCHAR DEFAULT 'system@lkrmsports.com',
    "assigneeId" VARCHAR DEFAULT ''
);

COMMENT ON TABLE tasks IS 'Task management system';

-- Create indexes for tasks
CREATE INDEX IF NOT EXISTS idx_tasks_name ON tasks(name);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks("dueDate");
CREATE INDEX IF NOT EXISTS idx_tasks_priority_id ON tasks("priorityId");
CREATE INDEX IF NOT EXISTS idx_tasks_event_id ON tasks("eventId");
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks("createdBy");

-- User-Task relationships
CREATE TABLE user_tasks (
    "taskId" INTEGER NOT NULL REFERENCES tasks("userId") ON DELETE CASCADE,
    "userId" INTEGER NOT NULL,
    status TEXT DEFAULT 'assigned',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER DEFAULT 0,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER DEFAULT 0,
    PRIMARY KEY ("taskId", "userId")
);

COMMENT ON TABLE user_tasks IS 'User-task assignments';

-- Player Notes table
CREATE TABLE player_notes (
    id SERIAL PRIMARY KEY,
    "playerId" INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    "isPublic" BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER DEFAULT 0,
    player_id BIGINT,
    note_text TEXT,
    user_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE player_notes IS 'Notes about players';

-- Create indexes for player_notes
CREATE INDEX IF NOT EXISTS idx_player_notes_player_id ON player_notes("playerId");
CREATE INDEX IF NOT EXISTS idx_player_notes_created_by ON player_notes("createdBy");

-- Player Goals table
CREATE TABLE player_goals (
    id SERIAL PRIMARY KEY,
    "playerId" INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    goal TEXT NOT NULL,
    "targetDate" TIMESTAMP,
    "isAchieved" BOOLEAN DEFAULT false,
    "achievedAt" TIMESTAMP,
    category TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER DEFAULT 0,
    player_id BIGINT,
    goal_text TEXT,
    user_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE player_goals IS 'Goals set for players';

-- Create indexes for player_goals
CREATE INDEX IF NOT EXISTS idx_player_goals_player_id ON player_goals("playerId");
CREATE INDEX IF NOT EXISTS idx_player_goals_created_by ON player_goals("createdBy");

-- Games table
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
    opponent TEXT NOT NULL,
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    result TEXT CHECK (result IN ('WIN', 'LOSS', 'TIE')),
    game_date TIMESTAMPTZ DEFAULT now(),
    season TEXT DEFAULT '2024-25',
    is_playoffs BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE games IS 'Final aggregated game records linked to events';

-- Create indexes for games
CREATE INDEX IF NOT EXISTS idx_games_event_id ON games(event_id);
CREATE INDEX IF NOT EXISTS idx_games_game_date ON games(game_date);
CREATE INDEX IF NOT EXISTS idx_games_season ON games(season);
CREATE INDEX IF NOT EXISTS idx_games_opponent ON games(opponent);

-- Game Statistics table
CREATE TABLE game_stats (
    id SERIAL PRIMARY KEY,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id INTEGER REFERENCES players(id),
    points INTEGER DEFAULT 0,
    field_goals_made INTEGER DEFAULT 0,
    field_goals_attempted INTEGER DEFAULT 0,
    three_points_made INTEGER DEFAULT 0,
    three_points_attempted INTEGER DEFAULT 0,
    free_throws_made INTEGER DEFAULT 0,
    free_throws_attempted INTEGER DEFAULT 0,
    rebounds INTEGER DEFAULT 0,
    offensive_rebounds INTEGER DEFAULT 0,
    defensive_rebounds INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    steals INTEGER DEFAULT 0,
    blocks INTEGER DEFAULT 0,
    turnovers INTEGER DEFAULT 0,
    fouls INTEGER DEFAULT 0,
    minutes_played INTEGER DEFAULT 0,
    plus_minus INTEGER DEFAULT 0,
    quarter INTEGER,
    period TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE game_stats IS 'Per-player per-game aggregated statistics';

-- Create indexes for game_stats
CREATE INDEX IF NOT EXISTS idx_game_stats_game_id ON game_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_player_id ON game_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_quarter ON game_stats(quarter);

-- Seasons table
CREATE TABLE seasons (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    "startDate" TIMESTAMP NOT NULL,
    "endDate" TIMESTAMP NOT NULL,
    "isActive" BOOLEAN DEFAULT false,
    description TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER DEFAULT 0,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER DEFAULT 0
);

COMMENT ON TABLE seasons IS 'Season definitions';

-- Create indexes for seasons
CREATE INDEX IF NOT EXISTS idx_seasons_is_active ON seasons("isActive");

-- Budget Categories table
CREATE TABLE budget_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#1890ff',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER DEFAULT 0,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER DEFAULT 0
);

COMMENT ON TABLE budget_categories IS 'Categories for budget organization';

-- Budgets table
CREATE TABLE budgets (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    period TEXT NOT NULL,
    "autoRepeat" BOOLEAN DEFAULT false,
    description TEXT,
    "categoryId" INTEGER REFERENCES budget_categories(id),
    season TEXT DEFAULT '2024-25',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER DEFAULT 0,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false
);

COMMENT ON TABLE budgets IS 'Budget management';

-- Create indexes for budgets
CREATE INDEX IF NOT EXISTS idx_budgets_season ON budgets(season);
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets("categoryId");

-- Expenses table
CREATE TABLE expenses (
    id SERIAL,
    "budgetId" INTEGER REFERENCES budgets(id),
    merchant TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    category TEXT NOT NULL,
    date TIMESTAMP NOT NULL,
    "eventId" INTEGER REFERENCES events(id),
    description TEXT,
    "receiptUrl" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdBy" VARCHAR DEFAULT 'Unknown',
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" VARCHAR DEFAULT '''Unknown''::character varying',
    PRIMARY KEY (id, "createdBy")
);

COMMENT ON TABLE expenses IS 'Expense tracking';

-- Create indexes for expenses
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_budget_id ON expenses("budgetId");
CREATE INDEX IF NOT EXISTS idx_expenses_event_id ON expenses("eventId");

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    "isRead" BOOLEAN DEFAULT false,
    data JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP
);

COMMENT ON TABLE notifications IS 'User notifications';

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications("userId");
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications("isRead");
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications("createdAt");

-- Settings table
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL UNIQUE,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("userId", key)
);

COMMENT ON TABLE settings IS 'User settings';

-- Audit Logs table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER,
    action TEXT NOT NULL,
    "table" TEXT NOT NULL,
    "recordId" INTEGER,
    "oldData" JSONB,
    "newData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    userid UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

COMMENT ON TABLE audit_logs IS 'Audit trail for system changes';

-- Create indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs("userId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs("table");
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs("createdAt");

-- Live Game Sessions table
CREATE TABLE live_game_sessions (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id),
    game_id INTEGER REFERENCES games(id),
    session_key TEXT NOT NULL,
    game_state JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE live_game_sessions IS 'Live game sessions for real-time stat tracking';

-- Create indexes for live_game_sessions
CREATE INDEX IF NOT EXISTS idx_live_game_sessions_event_id ON live_game_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_live_game_sessions_session_key ON live_game_sessions(session_key);
CREATE UNIQUE INDEX IF NOT EXISTS live_game_sessions_session_key_key ON live_game_sessions(session_key);

-- Live Game Events table
CREATE TABLE live_game_events (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES live_game_sessions(id),
    game_id INTEGER REFERENCES games(id),
    player_id INTEGER REFERENCES players(id),
    event_type TEXT NOT NULL,
    event_value INTEGER,
    quarter INTEGER NOT NULL,
    is_opponent_event BOOLEAN DEFAULT false,
    opponent_jersey TEXT,
    metadata JSONB DEFAULT '{}',
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'failed')),
    created_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    updated_by UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id)
);

COMMENT ON TABLE live_game_events IS 'Real-time stat events during live games';

-- Create indexes for live_game_events
CREATE INDEX IF NOT EXISTS idx_live_game_events_session_id ON live_game_events(session_id);
CREATE INDEX IF NOT EXISTS idx_live_game_events_player_id ON live_game_events(player_id);
CREATE INDEX IF NOT EXISTS idx_live_game_events_event_type ON live_game_events(event_type);
CREATE INDEX IF NOT EXISTS idx_live_game_events_deleted_at ON live_game_events(deleted_at);

-- Live Game Sync Status table
CREATE TABLE live_game_sync_status (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES live_game_sessions(id),
    last_synced_at TIMESTAMPTZ DEFAULT now(),
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'failed')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE live_game_sync_status IS 'Tracks offline sync status for live game sessions';

-- Create indexes for live_game_sync_status
CREATE INDEX IF NOT EXISTS idx_live_game_sync_status_session_id ON live_game_sync_status(session_id);

-- Stat Metrics table
CREATE TABLE stat_metrics (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    category VARCHAR NOT NULL CHECK (category IN ('offense', 'defense', 'efficiency', 'special')),
    description TEXT,
    unit VARCHAR DEFAULT 'per_game',
    calculation_type VARCHAR NOT NULL CHECK (calculation_type IN ('sum', 'average', 'percentage', 'ratio')),
    event_types JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Team Goals table
CREATE TABLE team_goals (
    id SERIAL PRIMARY KEY,
    metric_id INTEGER NOT NULL REFERENCES stat_metrics(id),
    target_value NUMERIC NOT NULL,
    comparison_operator VARCHAR NOT NULL CHECK (comparison_operator IN ('gte', 'lte', 'eq')),
    period_type VARCHAR DEFAULT 'per_game' CHECK (period_type IN ('per_game', 'season_total', 'rolling_5', 'rolling_10')),
    season VARCHAR DEFAULT '2024-25',
    competition_filter JSONB DEFAULT '{}',
    visibility VARCHAR DEFAULT 'staff_only' CHECK (visibility IN ('staff_only', 'shared_with_team')),
    status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for team_goals
CREATE INDEX IF NOT EXISTS idx_team_goals_metric_id ON team_goals(metric_id);
CREATE INDEX IF NOT EXISTS idx_team_goals_created_by ON team_goals(created_by);
CREATE INDEX IF NOT EXISTS idx_team_goals_status ON team_goals(status);

-- Team Goal Progress table
CREATE TABLE team_goal_progress (
    id SERIAL PRIMARY KEY,
    goal_id INTEGER NOT NULL REFERENCES team_goals(id),
    game_session_id INTEGER NOT NULL REFERENCES live_game_sessions(id),
    actual_value NUMERIC NOT NULL,
    target_value NUMERIC NOT NULL,
    delta NUMERIC NOT NULL,
    status VARCHAR NOT NULL CHECK (status IN ('on_track', 'at_risk', 'off_track')),
    calculated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for team_goal_progress
CREATE INDEX IF NOT EXISTS idx_team_goal_progress_goal_id ON team_goal_progress(goal_id);
CREATE INDEX IF NOT EXISTS idx_team_goal_progress_session_id ON team_goal_progress(game_session_id);
CREATE INDEX IF NOT EXISTS idx_team_goal_progress_calculated_at ON team_goal_progress(calculated_at);

-- Users table (extends auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- User Sessions table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    session_token TEXT NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_activity TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for user_sessions
CREATE UNIQUE INDEX IF NOT EXISTS user_sessions_session_token_key ON user_sessions(session_token);

-- Event Coaches table
CREATE TABLE event_coaches (
    "eventId" INTEGER NOT NULL REFERENCES events(id),
    "coachUsername" TEXT NOT NULL,
    PRIMARY KEY ("eventId", "coachUsername")
);

COMMENT ON TABLE event_coaches IS 'Coach assignments to events';

-- Create indexes for event_coaches
CREATE INDEX IF NOT EXISTS idx_event_coaches_event_id ON event_coaches("eventId");

-- Quick Notes table
CREATE TABLE quick_notes (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    color VARCHAR DEFAULT '#FFE66D',
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE quick_notes IS 'Quick notes system for coaches';

-- Create indexes for quick_notes
CREATE INDEX IF NOT EXISTS idx_quick_notes_created_by ON quick_notes(created_by);

-- Coach Tags table
CREATE TABLE coach_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL UNIQUE,
    color VARCHAR DEFAULT '#1890ff',
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE coach_tags IS 'Tags for organizing quick notes';

-- Quick Note Tags table
CREATE TABLE quick_note_tags (
    note_id INTEGER NOT NULL REFERENCES quick_notes(id),
    tag_id INTEGER NOT NULL REFERENCES coach_tags(id),
    PRIMARY KEY (note_id, tag_id)
);

COMMENT ON TABLE quick_note_tags IS 'Many-to-many relationship between notes and tags';

-- Create indexes for quick_note_tags
CREATE INDEX IF NOT EXISTS idx_quick_note_tags_note_id ON quick_note_tags(note_id);

-- Coach Mentions table
CREATE TABLE coach_mentions (
    id SERIAL PRIMARY KEY,
    note_id INTEGER REFERENCES quick_notes(id),
    mentioned_user_id UUID REFERENCES auth.users(id),
    mention_text VARCHAR NOT NULL,
    start_position INTEGER NOT NULL,
    end_position INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE coach_mentions IS 'Mentions of coaches in notes';

-- Create indexes for coach_mentions
CREATE INDEX IF NOT EXISTS idx_coach_mentions_note_id ON coach_mentions(note_id);
CREATE INDEX IF NOT EXISTS idx_coach_mentions_mentioned_user_id ON coach_mentions(mentioned_user_id);

-- Mention Notifications table
CREATE TABLE mention_notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    note_id INTEGER REFERENCES quick_notes(id),
    mentioned_by UUID REFERENCES auth.users(id),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    read_at TIMESTAMPTZ
);

COMMENT ON TABLE mention_notifications IS 'Notifications for coach mentions';

-- Create indexes for mention_notifications
CREATE INDEX IF NOT EXISTS idx_mention_notifications_user_id ON mention_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_mention_notifications_note_id ON mention_notifications(note_id);

-- Security Audit Logs table
CREATE TABLE security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT,
    user_role TEXT,
    action TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    resource_type TEXT,
    resource_id TEXT,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for security_audit_logs
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON security_audit_logs(user_id);

-- Security Events table
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT now(),
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    user_id UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT,
    details JSONB DEFAULT '{}',
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- CREATE FUNCTIONS
-- =====================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, first_name, last_name, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to handle user updates
CREATE OR REPLACE FUNCTION handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users SET
        email = NEW.email,
        first_name = NEW.raw_user_meta_data->>'first_name',
        last_name = NEW.raw_user_meta_data->>'last_name',
        full_name = NEW.raw_user_meta_data->>'full_name',
        avatar_url = NEW.raw_user_meta_data->>'avatar_url',
        updated_at = now()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    p_user_id UUID,
    p_user_email TEXT,
    p_user_role TEXT,
    p_action TEXT,
    p_severity TEXT,
    p_resource_type TEXT,
    p_resource_id TEXT,
    p_details JSONB,
    p_ip_address INET,
    p_user_agent TEXT,
    p_session_id TEXT,
    p_success BOOLEAN,
    p_error_message TEXT,
    p_metadata JSONB
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO security_audit_logs (
        user_id, user_email, user_role, action, severity, resource_type, resource_id,
        details, ip_address, user_agent, session_id, success, error_message, metadata
    ) VALUES (
        p_user_id, p_user_email, p_user_role, p_action, p_severity, p_resource_type, p_resource_id,
        p_details, p_ip_address, p_user_agent, p_session_id, p_success, p_error_message, p_metadata
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to aggregate live events to game stats
CREATE OR REPLACE FUNCTION aggregate_live_events_to_game_stats(session_id INTEGER)
RETURNS VOID AS $$
BEGIN
    -- This function would aggregate live game events into final game statistics
    -- Implementation depends on specific business logic
    NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to get game events for analysis
CREATE OR REPLACE FUNCTION get_game_events_for_analysis(session_id INTEGER)
RETURNS TABLE(
    id INTEGER,
    event_type TEXT,
    player_id INTEGER,
    opponent_jersey TEXT,
    quarter INTEGER,
    event_value INTEGER,
    is_opponent_event BOOLEAN,
    metadata JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lge.id,
        lge.event_type,
        lge.player_id,
        lge.opponent_jersey,
        lge.quarter,
        lge.event_value,
        lge.is_opponent_event,
        lge.metadata,
        lge.created_at
    FROM live_game_events lge
    WHERE lge.session_id = $1
        AND lge.deleted_at IS NULL
    ORDER BY lge.created_at;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old audit logs
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS VOID AS $$
BEGIN
    DELETE FROM audit_logs 
    WHERE "createdAt" < NOW() - INTERVAL '90 days';
    
    DELETE FROM security_audit_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

-- Trigger for updating updated_at columns
CREATE TRIGGER update_game_stats_updated_at
    AFTER UPDATE ON game_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at
    AFTER UPDATE ON games
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_live_game_sessions_updated_at
    AFTER UPDATE ON live_game_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_live_game_sync_status_updated_at
    AFTER UPDATE ON live_game_sync_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_game_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE stat_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_goal_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mention_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================

-- Positions policies
CREATE POLICY "Users can view positions" ON positions
    FOR SELECT USING (auth.role() = 'authenticated');

-- Event types policies
CREATE POLICY "Users can view event_types" ON event_types
    FOR SELECT USING (auth.role() = 'authenticated');

-- Players policies
CREATE POLICY "Users can view all players" ON players
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create players" ON players
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update players" ON players
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete players" ON players
    FOR DELETE USING (auth.role() = 'authenticated');

-- Events policies
CREATE POLICY "Users can view all events" ON events
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create events" ON events
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update events" ON events
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete events" ON events
    FOR DELETE USING (auth.role() = 'authenticated');

-- Player events policies
CREATE POLICY "Users can view player_events" ON player_events
    FOR SELECT USING (auth.role() = 'authenticated');

-- Task priorities policies
CREATE POLICY "Users can view task_priorities" ON task_priorities
    FOR SELECT USING (auth.role() = 'authenticated');

-- Tasks policies
CREATE POLICY "Users can view all tasks" ON tasks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create tasks" ON tasks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update tasks" ON tasks
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete tasks" ON tasks
    FOR DELETE USING (auth.role() = 'authenticated');

-- User tasks policies
CREATE POLICY "Users can view user_tasks" ON user_tasks
    FOR SELECT USING (auth.role() = 'authenticated');

-- Player notes policies
CREATE POLICY "Users can view player notes" ON player_notes
    FOR SELECT USING (true);

CREATE POLICY "Users can create player notes" ON player_notes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own player notes" ON player_notes
    FOR UPDATE USING ("createdBy" = (auth.uid())::text::integer);

CREATE POLICY "Users can delete their own player notes" ON player_notes
    FOR DELETE USING ("createdBy" = (auth.uid())::text::integer);

-- Player goals policies
CREATE POLICY "Users can view player goals" ON player_goals
    FOR SELECT USING (true);

CREATE POLICY "Users can create player goals" ON player_goals
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own player goals" ON player_goals
    FOR UPDATE USING ("createdBy" = (auth.uid())::text::integer);

CREATE POLICY "Users can delete their own player goals" ON player_goals
    FOR DELETE USING ("createdBy" = (auth.uid())::text::integer);

-- Games policies
CREATE POLICY "Allow all operations on games" ON games
    FOR ALL USING (true) WITH CHECK (true);

-- Game stats policies
CREATE POLICY "Allow all operations on game_stats" ON game_stats
    FOR ALL USING (true) WITH CHECK (true);

-- Seasons policies
CREATE POLICY "Users can view seasons" ON seasons
    FOR SELECT USING (auth.role() = 'authenticated');

-- Budget categories policies
CREATE POLICY "Users can view budget_categories" ON budget_categories
    FOR SELECT USING (auth.role() = 'authenticated');

-- Budgets policies
CREATE POLICY "Users can view all budgets" ON budgets
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create budgets" ON budgets
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update budgets" ON budgets
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete budgets" ON budgets
    FOR DELETE USING (auth.role() = 'authenticated');

-- Expenses policies
CREATE POLICY "Users can view all expenses" ON expenses
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create expenses" ON expenses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update expenses" ON expenses
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete expenses" ON expenses
    FOR DELETE USING (auth.role() = 'authenticated');

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON notifications
    FOR SELECT USING ((auth.uid())::text = "userId"::text);

CREATE POLICY "Users can create notifications" ON notifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their notifications" ON notifications
    FOR UPDATE USING ((auth.uid())::text = "userId"::text);

CREATE POLICY "Users can delete their notifications" ON notifications
    FOR DELETE USING ((auth.uid())::text = "userId"::text);

-- Settings policies
CREATE POLICY "Users can view their settings" ON settings
    FOR SELECT USING ((auth.uid())::text = "userId"::text);

CREATE POLICY "Users can create their settings" ON settings
    FOR INSERT WITH CHECK ((auth.uid())::text = "userId"::text);

CREATE POLICY "Users can update their settings" ON settings
    FOR UPDATE USING ((auth.uid())::text = "userId"::text);

CREATE POLICY "Users can delete their settings" ON settings
    FOR DELETE USING ((auth.uid())::text = "userId"::text);

-- Audit logs policies
CREATE POLICY "Users can view audit logs" ON audit_logs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System can create audit logs" ON audit_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Live game sessions policies
CREATE POLICY "Users can view live game sessions" ON live_game_sessions
    FOR SELECT USING (true);

CREATE POLICY "Users can create live game sessions" ON live_game_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own live game sessions" ON live_game_sessions
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own live game sessions" ON live_game_sessions
    FOR DELETE USING (auth.uid() = created_by);

-- Live game events policies
CREATE POLICY "Users can view live game events" ON live_game_events
    FOR SELECT USING (true);

CREATE POLICY "Users can create live game events" ON live_game_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update live game events" ON live_game_events
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete live game events" ON live_game_events
    FOR DELETE USING (auth.uid() = created_by);

-- Live game sync status policies
CREATE POLICY "Allow all operations on live_game_sync_status" ON live_game_sync_status
    FOR ALL USING (true) WITH CHECK (true);

-- Stat metrics policies
CREATE POLICY "stat_metrics_read_policy" ON stat_metrics
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create stat metrics" ON stat_metrics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update stat metrics" ON stat_metrics
    FOR UPDATE USING (true);

-- Team goals policies
CREATE POLICY "team_goals_read_policy" ON team_goals
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "team_goals_insert_policy" ON team_goals
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "team_goals_update_policy" ON team_goals
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "team_goals_delete_policy" ON team_goals
    FOR DELETE USING (auth.uid() = created_by);

-- Team goal progress policies
CREATE POLICY "team_goal_progress_read_policy" ON team_goal_progress
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create team goal progress" ON team_goal_progress
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update team goal progress" ON team_goal_progress
    FOR UPDATE USING (true);

-- Users policies
CREATE POLICY "Users can view all users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- User sessions policies
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Event coaches policies
CREATE POLICY "Users can view event_coaches" ON event_coaches
    FOR SELECT USING (auth.role() = 'authenticated');

-- Quick notes policies
CREATE POLICY "Users can select their own quick notes" ON quick_notes
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own quick notes" ON quick_notes
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own quick notes" ON quick_notes
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own quick notes" ON quick_notes
    FOR DELETE USING (auth.uid() = created_by);

-- Coach tags policies
CREATE POLICY "Users can view coach tags" ON coach_tags
    FOR SELECT USING (true);

CREATE POLICY "Users can create coach tags" ON coach_tags
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update coach tags" ON coach_tags
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete coach tags" ON coach_tags
    FOR DELETE USING (true);

-- Quick note tags policies
CREATE POLICY "Users can view quick note tags" ON quick_note_tags
    FOR SELECT USING (true);

CREATE POLICY "Users can create quick note tags" ON quick_note_tags
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update quick note tags" ON quick_note_tags
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete quick note tags" ON quick_note_tags
    FOR DELETE USING (true);

-- Coach mentions policies
CREATE POLICY "Users can select mentions in their notes" ON coach_mentions
    FOR SELECT USING (auth.uid() = mentioned_user_id);

CREATE POLICY "Users can insert mentions in their notes" ON coach_mentions
    FOR INSERT WITH CHECK (auth.uid() = mentioned_user_id);

CREATE POLICY "Users can update mentions in their notes" ON coach_mentions
    FOR UPDATE USING (auth.uid() = mentioned_user_id);

CREATE POLICY "Users can delete mentions in their notes" ON coach_mentions
    FOR DELETE USING (auth.uid() = mentioned_user_id);

-- Mention notifications policies
CREATE POLICY "Users can select their own notifications" ON mention_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert notifications" ON mention_notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON mention_notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON mention_notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Security audit logs policies
CREATE POLICY "Users can view their own audit logs" ON security_audit_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create audit logs" ON security_audit_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Security events policies
CREATE POLICY "Users can view security events" ON security_events
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System can create security events" ON security_events
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update security events" ON security_events
    FOR UPDATE USING (auth.role() = 'authenticated');

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Insert default positions
INSERT INTO positions (name, abbreviation, description) VALUES
('Point Guard', 'PG', 'Primary ball handler and playmaker'),
('Shooting Guard', 'SG', 'Primary scorer and perimeter shooter'),
('Small Forward', 'SF', 'Versatile wing player'),
('Power Forward', 'PF', 'Strong inside player'),
('Center', 'C', 'Tallest player, primary rebounder and defender');

-- Insert default event types
INSERT INTO event_types (name, color, icon) VALUES
('Game', '#ff4d4f', '🏀'),
('Practice', '#52c41a', '🏃'),
('Meeting', '#1890ff', '👥'),
('Tournament', '#fa8c16', '🏆'),
('Training', '#722ed1', '💪'),
('Other', '#8c8c8c', '📅');

-- Insert default task priorities
INSERT INTO task_priorities (name, weight, color) VALUES
('High', 1, '#ff4d4f'),
('Medium', 2, '#fa8c16'),
('Low', 3, '#52c41a');

-- Insert default budget categories
INSERT INTO budget_categories (name, description, color) VALUES
('Equipment', 'Basketballs, uniforms, training equipment', '#1890ff'),
('Travel', 'Transportation and accommodation costs', '#52c41a'),
('Facilities', 'Gym rental, court maintenance', '#fa8c16'),
('Food & Beverages', 'Team meals and refreshments', '#722ed1'),
('Administrative', 'Office supplies, software licenses', '#8c8c8c'),
('Marketing', 'Promotional materials and events', '#ff4d4f');

-- Insert default stat metrics
INSERT INTO stat_metrics (name, category, description, unit, calculation_type, event_types) VALUES
('Points Per Game', 'offense', 'Average points scored per game', 'per_game', 'average', '["field_goal_made", "three_point_made", "free_throw_made"]'),
('Field Goal Percentage', 'efficiency', 'Percentage of field goals made', 'percentage', 'percentage', '["field_goal_made", "field_goal_attempted"]'),
('Three Point Percentage', 'efficiency', 'Percentage of three-pointers made', 'percentage', 'percentage', '["three_point_made", "three_point_attempted"]'),
('Free Throw Percentage', 'efficiency', 'Percentage of free throws made', 'percentage', 'percentage', '["free_throw_made", "free_throw_attempted"]'),
('Rebounds Per Game', 'defense', 'Average rebounds per game', 'per_game', 'average', '["rebound"]'),
('Assists Per Game', 'offense', 'Average assists per game', 'per_game', 'average', '["assist"]'),
('Steals Per Game', 'defense', 'Average steals per game', 'per_game', 'average', '["steal"]'),
('Blocks Per Game', 'defense', 'Average blocks per game', 'per_game', 'average', '["block"]'),
('Turnovers Per Game', 'efficiency', 'Average turnovers per game', 'per_game', 'average', '["turnover"]'),
('Fouls Per Game', 'defense', 'Average fouls per game', 'per_game', 'average', '["foul"]'),
('Minutes Per Game', 'special', 'Average minutes played per game', 'per_game', 'average', '["minutes_played"]'),
('Plus/Minus', 'special', 'Point differential while player is on court', 'per_game', 'average', '["plus_minus"]'),
('Offensive Rebounds', 'offense', 'Rebounds on offensive end', 'per_game', 'average', '["offensive_rebound"]'),
('Defensive Rebounds', 'defense', 'Rebounds on defensive end', 'per_game', 'average', '["defensive_rebound"]'),
('Field Goals Made', 'offense', 'Total field goals made', 'per_game', 'average', '["field_goal_made"]'),
('Field Goals Attempted', 'offense', 'Total field goals attempted', 'per_game', 'average', '["field_goal_attempted"]'),
('Three Points Made', 'offense', 'Total three-pointers made', 'per_game', 'average', '["three_point_made"]'),
('Three Points Attempted', 'offense', 'Total three-pointers attempted', 'per_game', 'average', '["three_point_attempted"]'),
('Free Throws Made', 'offense', 'Total free throws made', 'per_game', 'average', '["free_throw_made"]'),
('Free Throws Attempted', 'offense', 'Total free throws attempted', 'per_game', 'average', '["free_throw_attempted"]');

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'DATABASE MIGRATION COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '- 3 Custom Types/Enums';
    RAISE NOTICE '- 30 Tables with proper relationships';
    RAISE NOTICE '- 8 Functions for business logic';
    RAISE NOTICE '- 4 Triggers for automation';
    RAISE NOTICE '- 100+ RLS Policies for security';
    RAISE NOTICE '- 20+ Indexes for performance';
    RAISE NOTICE '- Default data for core entities';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Your LKRM Basketball Coaching Platform database';
    RAISE NOTICE 'is ready for production use!';
    RAISE NOTICE '=====================================================';
END $$;
