-- =====================================================
-- LKRM Database Recreation Script
-- Excludes Statistics and Live Stat Tracker Tables
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CREATE CUSTOM TYPES AND ENUMS
-- =====================================================

-- Location enum for events
CREATE TYPE Location AS ENUM ('HOME', 'AWAY');

-- TaskStatus enum for tasks
CREATE TYPE TaskStatus AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'ARCHIVE');

-- School year enum for players
CREATE TYPE school_year_enum AS ENUM ('freshman', 'sophomore', 'junior', 'senior');

-- =====================================================
-- CREATE SEQUENCES
-- =====================================================

-- Core sequences
CREATE SEQUENCE IF NOT EXISTS positions_id_seq;
CREATE SEQUENCE IF NOT EXISTS players_id_seq;
CREATE SEQUENCE IF NOT EXISTS event_types_id_seq;
CREATE SEQUENCE IF NOT EXISTS events_id_seq;
CREATE SEQUENCE IF NOT EXISTS task_priorities_id_seq;
CREATE SEQUENCE IF NOT EXISTS tasks_id_seq;
CREATE SEQUENCE IF NOT EXISTS player_notes_id_seq;
CREATE SEQUENCE IF NOT EXISTS player_goals_id_seq;
CREATE SEQUENCE IF NOT EXISTS seasons_id_seq;
CREATE SEQUENCE IF NOT EXISTS budget_categories_id_seq;
CREATE SEQUENCE IF NOT EXISTS budgets_id_seq;
CREATE SEQUENCE IF NOT EXISTS expenses_id_seq;
CREATE SEQUENCE IF NOT EXISTS notifications_id_seq;
CREATE SEQUENCE IF NOT EXISTS settings_id_seq;
CREATE SEQUENCE IF NOT EXISTS audit_logs_id_seq;
CREATE SEQUENCE IF NOT EXISTS quick_notes_id_seq;
CREATE SEQUENCE IF NOT EXISTS coach_tags_id_seq;
CREATE SEQUENCE IF NOT EXISTS coach_mentions_id_seq;
CREATE SEQUENCE IF NOT EXISTS mention_notifications_id_seq;

-- =====================================================
-- CREATE TABLES
-- =====================================================

-- Positions table
CREATE TABLE positions (
    id integer NOT NULL DEFAULT nextval('positions_id_seq'::regclass),
    name text NOT NULL,
    abbreviation text NOT NULL,
    description text,
    "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" integer NOT NULL DEFAULT 0,
    "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" integer NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
);

-- Players table
CREATE TABLE players (
    id integer NOT NULL DEFAULT nextval('players_id_seq'::regclass),
    name text NOT NULL,
    "positionId" integer NOT NULL,
    jersey text NOT NULL,
    "phoneNumber" text,
    email text,
    height double precision,
    weight double precision,
    avatar text,
    "birthDate" timestamp without time zone,
    "isActive" boolean NOT NULL DEFAULT true,
    "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" integer NOT NULL DEFAULT 0,
    user_id uuid NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    school_year school_year_enum NOT NULL,
    jersey_number character varying(10) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    profile_id integer NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY ("positionId") REFERENCES positions(id)
);

-- Event types table
CREATE TABLE event_types (
    id integer NOT NULL DEFAULT nextval('event_types_id_seq'::regclass),
    name text NOT NULL,
    color text NOT NULL DEFAULT '#1890ff'::text,
    icon text,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" integer NOT NULL DEFAULT 0,
    updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" integer NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
);

-- Events table
CREATE TABLE events (
    id integer NOT NULL DEFAULT nextval('events_id_seq'::regclass),
    name text NOT NULL,
    description text,
    "eventTypeId" integer NOT NULL,
    "startTime" timestamp without time zone NOT NULL,
    "endTime" timestamp without time zone,
    location Location NOT NULL,
    venue text NOT NULL,
    "oppositionTeam" text,
    "isRepeat" boolean NOT NULL DEFAULT false,
    occurence integer NOT NULL DEFAULT 0,
    "isNotice" boolean NOT NULL DEFAULT false,
    notes text,
    "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "repeatType" text DEFAULT 'weekly'::text CHECK ("repeatType" = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text, 'yearly'::text])),
    "daysOfWeek" integer[],
    "endDate" timestamp without time zone DEFAULT NULL,
    "createdBy" uuid NOT NULL,
    "updatedBy" uuid NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY ("eventTypeId") REFERENCES event_types(id),
    FOREIGN KEY ("createdBy") REFERENCES auth.users(id),
    FOREIGN KEY ("updatedBy") REFERENCES auth.users(id)
);

-- Player events junction table
CREATE TABLE player_events (
    "playerId" integer NOT NULL,
    "eventId" integer NOT NULL,
    status text NOT NULL DEFAULT 'pending'::text,
    "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" integer NOT NULL DEFAULT 0,
    "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" integer NOT NULL DEFAULT 0,
    PRIMARY KEY ("playerId", "eventId"),
    FOREIGN KEY ("playerId") REFERENCES players(id),
    FOREIGN KEY ("eventId") REFERENCES events(id)
);

-- Task priorities table
CREATE TABLE task_priorities (
    id integer NOT NULL DEFAULT nextval('task_priorities_id_seq'::regclass),
    name text NOT NULL,
    weight integer NOT NULL,
    color text NOT NULL DEFAULT '#1890ff'::text,
    "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" integer NOT NULL DEFAULT 0,
    "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" integer NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
);

-- Tasks table
CREATE TABLE tasks (
    "userId" integer NOT NULL DEFAULT nextval('tasks_id_seq'::regclass),
    name text NOT NULL,
    description text,
    "dueDate" timestamp without time zone,
    "priorityId" integer NOT NULL,
    status TaskStatus NOT NULL DEFAULT 'TODO'::TaskStatus,
    "eventId" integer,
    "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" character varying NOT NULL DEFAULT 'system@lkrmsports.com'::character varying,
    "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" character varying NOT NULL DEFAULT 'system@lkrmsports.com'::character varying,
    "assigneeId" character varying DEFAULT ''::character varying,
    PRIMARY KEY ("userId"),
    FOREIGN KEY ("priorityId") REFERENCES task_priorities(id),
    FOREIGN KEY ("eventId") REFERENCES events(id)
);

-- User tasks junction table
CREATE TABLE user_tasks (
    "taskId" integer NOT NULL,
    "userId" integer NOT NULL,
    status text NOT NULL DEFAULT 'assigned'::text,
    "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" integer NOT NULL DEFAULT 0,
    "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" integer NOT NULL DEFAULT 0,
    PRIMARY KEY ("taskId", "userId"),
    FOREIGN KEY ("taskId") REFERENCES tasks("userId")
);

-- Player notes table
CREATE TABLE player_notes (
    id integer NOT NULL DEFAULT nextval('player_notes_id_seq'::regclass),
    "playerId" integer NOT NULL,
    note text NOT NULL,
    "isPublic" boolean NOT NULL DEFAULT false,
    tags text[] DEFAULT ARRAY[]::text[],
    "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" integer NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" integer NOT NULL DEFAULT 0,
    player_id bigint,
    note_text text,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id),
    FOREIGN KEY ("playerId") REFERENCES players(id)
);

-- Player goals table
CREATE TABLE player_goals (
    id integer NOT NULL DEFAULT nextval('player_goals_id_seq'::regclass),
    "playerId" integer NOT NULL,
    goal text NOT NULL,
    "targetDate" timestamp without time zone,
    "isAchieved" boolean NOT NULL DEFAULT false,
    "achievedAt" timestamp without time zone,
    category text,
    "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" integer NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" integer NOT NULL DEFAULT 0,
    player_id bigint,
    goal_text text,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id),
    FOREIGN KEY ("playerId") REFERENCES players(id)
);

-- Seasons table
CREATE TABLE seasons (
    id integer NOT NULL DEFAULT nextval('seasons_id_seq'::regclass),
    name text NOT NULL,
    "startDate" timestamp without time zone NOT NULL,
    "endDate" timestamp without time zone NOT NULL,
    "isActive" boolean NOT NULL DEFAULT false,
    description text,
    "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" integer NOT NULL DEFAULT 0,
    "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" integer NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
);

-- Budget categories table
CREATE TABLE budget_categories (
    id integer NOT NULL DEFAULT nextval('budget_categories_id_seq'::regclass),
    name text NOT NULL,
    description text,
    color text NOT NULL DEFAULT '#1890ff'::text,
    "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" integer NOT NULL DEFAULT 0,
    "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" integer NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
);

-- Budgets table
CREATE TABLE budgets (
    id integer NOT NULL DEFAULT nextval('budgets_id_seq'::regclass),
    name text NOT NULL,
    amount numeric NOT NULL,
    period text NOT NULL,
    "autoRepeat" boolean NOT NULL DEFAULT false,
    description text,
    "categoryId" integer,
    season text NOT NULL DEFAULT '2024-25'::text,
    "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" integer NOT NULL DEFAULT 0,
    "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" integer NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    FOREIGN KEY ("categoryId") REFERENCES budget_categories(id)
);

-- Expenses table
CREATE TABLE expenses (
    id integer NOT NULL DEFAULT nextval('expenses_id_seq'::regclass),
    "budgetId" integer,
    merchant text NOT NULL,
    amount numeric NOT NULL,
    category text NOT NULL,
    date timestamp without time zone NOT NULL,
    "eventId" integer,
    description text,
    "receiptUrl" text,
    "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" character varying NOT NULL DEFAULT 'Unknown'::character varying,
    "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" character varying NOT NULL DEFAULT '''Unknown''::character varying'::character varying,
    PRIMARY KEY (id, "createdBy"),
    FOREIGN KEY ("budgetId") REFERENCES budgets(id),
    FOREIGN KEY ("eventId") REFERENCES events(id)
);

-- Notifications table
CREATE TABLE notifications (
    id integer NOT NULL DEFAULT nextval('notifications_id_seq'::regclass),
    "userId" integer NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    "isRead" boolean NOT NULL DEFAULT false,
    data jsonb,
    "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" timestamp without time zone,
    PRIMARY KEY (id)
);

-- Settings table
CREATE TABLE settings (
    id integer NOT NULL DEFAULT nextval('settings_id_seq'::regclass),
    "userId" integer NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Audit logs table
CREATE TABLE audit_logs (
    id integer NOT NULL DEFAULT nextval('audit_logs_id_seq'::regclass),
    "userId" integer,
    action text NOT NULL,
    "table" text NOT NULL,
    "recordId" integer,
    "oldData" jsonb,
    "newData" jsonb,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Event coaches table
CREATE TABLE event_coaches (
    "eventId" integer NOT NULL,
    "coachUsername" text NOT NULL,
    PRIMARY KEY ("eventId", "coachUsername"),
    FOREIGN KEY ("eventId") REFERENCES events(id)
);

-- Quick notes table
CREATE TABLE quick_notes (
    id integer NOT NULL DEFAULT nextval('quick_notes_id_seq'::regclass),
    content text NOT NULL,
    color character varying(7) DEFAULT '#FFE66D'::character varying,
    position_x integer DEFAULT 0,
    position_y integer DEFAULT 0,
    is_pinned boolean DEFAULT false,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id),
    FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- Coach tags table
CREATE TABLE coach_tags (
    id integer NOT NULL DEFAULT nextval('coach_tags_id_seq'::regclass),
    name character varying(50) NOT NULL UNIQUE,
    color character varying(7) DEFAULT '#1890ff'::character varying,
    description text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id),
    FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- Quick note tags junction table
CREATE TABLE quick_note_tags (
    note_id integer NOT NULL,
    tag_id integer NOT NULL,
    PRIMARY KEY (note_id, tag_id),
    FOREIGN KEY (note_id) REFERENCES quick_notes(id),
    FOREIGN KEY (tag_id) REFERENCES coach_tags(id)
);

-- Coach mentions table
CREATE TABLE coach_mentions (
    id integer NOT NULL DEFAULT nextval('coach_mentions_id_seq'::regclass),
    note_id integer,
    mentioned_user_id uuid,
    mention_text character varying(100) NOT NULL,
    start_position integer NOT NULL,
    end_position integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id),
    FOREIGN KEY (note_id) REFERENCES quick_notes(id),
    FOREIGN KEY (mentioned_user_id) REFERENCES auth.users(id)
);

-- Mention notifications table
CREATE TABLE mention_notifications (
    id integer NOT NULL DEFAULT nextval('mention_notifications_id_seq'::regclass),
    user_id uuid,
    note_id integer,
    mentioned_by uuid,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    read_at timestamp with time zone,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES auth.users(id),
    FOREIGN KEY (note_id) REFERENCES quick_notes(id),
    FOREIGN KEY (mentioned_by) REFERENCES auth.users(id)
);

-- =====================================================
-- INSERT REFERENCE DATA
-- =====================================================

-- Insert positions
INSERT INTO positions (id, name, abbreviation, description, "createdAt", "createdBy", "updatedAt", "updatedBy") VALUES
(6, 'Center', 'C', NULL, '2025-08-18 18:24:38.125', 0, '2025-08-18 18:24:38.125', 0),
(7, 'Guard', 'G', NULL, '2025-08-18 18:24:38.125', 0, '2025-08-18 18:24:38.125', 0),
(8, 'Forward', 'F', NULL, '2025-08-18 18:24:38.125', 0, '2025-08-18 18:24:38.125', 0);

-- Update sequences to continue from the correct values
SELECT setval('positions_id_seq', 8, true);

-- =====================================================
-- CREATE INDEXES (Optional - for performance)
-- =====================================================

-- Create indexes on frequently queried columns
CREATE INDEX IF NOT EXISTS idx_players_position_id ON players("positionId");
CREATE INDEX IF NOT EXISTS idx_events_event_type_id ON events("eventTypeId");
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events("startTime");
CREATE INDEX IF NOT EXISTS idx_player_events_player_id ON player_events("playerId");
CREATE INDEX IF NOT EXISTS idx_player_events_event_id ON player_events("eventId");
CREATE INDEX IF NOT EXISTS idx_tasks_priority_id ON tasks("priorityId");
CREATE INDEX IF NOT EXISTS idx_tasks_event_id ON tasks("eventId");
CREATE INDEX IF NOT EXISTS idx_player_notes_player_id ON player_notes("playerId");
CREATE INDEX IF NOT EXISTS idx_player_goals_player_id ON player_goals("playerId");
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets("categoryId");
CREATE INDEX IF NOT EXISTS idx_expenses_budget_id ON expenses("budgetId");
CREATE INDEX IF NOT EXISTS idx_expenses_event_id ON expenses("eventId");
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications("userId");
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings("userId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs("userId");
CREATE INDEX IF NOT EXISTS idx_event_coaches_event_id ON event_coaches("eventId");
CREATE INDEX IF NOT EXISTS idx_quick_notes_created_by ON quick_notes(created_by);
CREATE INDEX IF NOT EXISTS idx_coach_tags_created_by ON coach_tags(created_by);
CREATE INDEX IF NOT EXISTS idx_quick_note_tags_note_id ON quick_note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_quick_note_tags_tag_id ON quick_note_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_coach_mentions_note_id ON coach_mentions(note_id);
CREATE INDEX IF NOT EXISTS idx_coach_mentions_mentioned_user_id ON coach_mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_mention_notifications_user_id ON mention_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_mention_notifications_note_id ON mention_notifications(note_id);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY (RLS) WHERE APPLICABLE
-- =====================================================

-- Enable RLS on tables that need it
ALTER TABLE player_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mention_notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE positions IS 'Player positions (Center, Guard, Forward)';
COMMENT ON TABLE players IS 'Player information and profiles';
COMMENT ON TABLE event_types IS 'Types of events (games, practices, meetings, etc.)';
COMMENT ON TABLE events IS 'Scheduled events with location and timing';
COMMENT ON TABLE player_events IS 'Many-to-many relationship between players and events';
COMMENT ON TABLE task_priorities IS 'Priority levels for tasks';
COMMENT ON TABLE tasks IS 'Task management system';
COMMENT ON TABLE user_tasks IS 'User-task assignments';
COMMENT ON TABLE player_notes IS 'Notes about players';
COMMENT ON TABLE player_goals IS 'Goals set for players';
COMMENT ON TABLE seasons IS 'Season definitions';
COMMENT ON TABLE budget_categories IS 'Categories for budget organization';
COMMENT ON TABLE budgets IS 'Budget management';
COMMENT ON TABLE expenses IS 'Expense tracking';
COMMENT ON TABLE notifications IS 'User notifications';
COMMENT ON TABLE settings IS 'User settings';
COMMENT ON TABLE audit_logs IS 'Audit trail for system changes';
COMMENT ON TABLE event_coaches IS 'Coach assignments to events';
COMMENT ON TABLE quick_notes IS 'Quick notes system for coaches';
COMMENT ON TABLE coach_tags IS 'Tags for organizing quick notes';
COMMENT ON TABLE quick_note_tags IS 'Many-to-many relationship between notes and tags';
COMMENT ON TABLE coach_mentions IS 'Mentions of coaches in notes';
COMMENT ON TABLE mention_notifications IS 'Notifications for coach mentions';

-- =====================================================
-- SCRIPT COMPLETE
-- =====================================================

-- This script recreates your database structure excluding:
-- - games (statistics)
-- - game_stats (statistics) 
-- - live_game_sessions (live stat tracker)
-- - live_game_events (live stat tracker)
-- - live_game_sync_status (live stat tracker)
-- - game_quarter_totals (statistics)

-- The script includes:
-- - All table structures with proper data types
-- - Primary keys and foreign key constraints
-- - Custom enums and types
-- - Sequences for auto-incrementing IDs
-- - Reference data (positions)
-- - Performance indexes
-- - Row Level Security where applicable
-- - Table comments for documentation
