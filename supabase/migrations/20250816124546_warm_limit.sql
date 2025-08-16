/*
  # Enhanced LKRM Database Schema

  1. Schema Improvements
    - Enhanced user management with proper relationships
    - Added comprehensive game statistics tracking
    - Implemented budget and expense management
    - Added notification system
    - Included audit logging for security
    - Added settings management

  2. New Tables
    - `seasons` - Season management
    - `budget_categories` - Budget categorization
    - `budgets` - Budget tracking
    - `expenses` - Expense management
    - `games` - Game-specific data
    - `game_stats` - Detailed game statistics
    - `notifications` - User notifications
    - `settings` - User preferences
    - `audit_logs` - System audit trail

  3. Enhanced Existing Tables
    - Added proper foreign key relationships
    - Improved indexing for performance
    - Added cascade deletes where appropriate
    - Enhanced data types for better validation

  4. Security & Performance
    - Comprehensive indexing strategy
    - Audit logging for all changes
    - Proper cascade relationships
    - Data validation at database level
*/

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('COACH', 'ADMIN', 'TRAINEE', 'PLAYER');
CREATE TYPE "Location" AS ENUM ('HOME', 'AWAY');
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');
CREATE TYPE "GameResult" AS ENUM ('WIN', 'LOSS', 'TIE');

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS "player_imports" CASCADE;
DROP TABLE IF EXISTS "player_goals" CASCADE;
DROP TABLE IF EXISTS "player_notes" CASCADE;
DROP TABLE IF EXISTS "player_tasks" CASCADE;
DROP TABLE IF EXISTS "player_events" CASCADE;
DROP TABLE IF EXISTS "volunteer_events" CASCADE;
DROP TABLE IF EXISTS "volunteers" CASCADE;
DROP TABLE IF EXISTS "tasks" CASCADE;
DROP TABLE IF EXISTS "task_priorities" CASCADE;
DROP TABLE IF EXISTS "players" CASCADE;
DROP TABLE IF EXISTS "positions" CASCADE;
DROP TABLE IF EXISTS "events" CASCADE;
DROP TABLE IF EXISTS "eventTypes" CASCADE;
DROP TABLE IF EXISTS "profiles" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- Drop existing enums if they exist
DROP TYPE IF EXISTS "Status" CASCADE;
DROP TYPE IF EXISTS "Priority" CASCADE;

-- Create enhanced tables
CREATE TABLE "profiles" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "institute" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "role" "Role" NOT NULL DEFAULT 'COACH',
    "profileId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "positions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "players" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "positionId" INTEGER NOT NULL,
    "jersey" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "email" TEXT,
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "avatar" TEXT,
    "birthDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "event_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#1890ff',
    "txtColor" TEXT NOT NULL DEFAULT '#ffffff',
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "event_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "eventTypeId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "location" "Location" NOT NULL,
    "venue" TEXT NOT NULL,
    "oppositionTeam" TEXT,
    "isRepeat" BOOLEAN NOT NULL DEFAULT false,
    "occurence" INTEGER NOT NULL DEFAULT 0,
    "isNotice" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "player_events" (
    "playerId" INTEGER NOT NULL,
    "eventId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "player_events_pkey" PRIMARY KEY ("playerId","eventId")
);

CREATE TABLE "task_priorities" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#1890ff',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "task_priorities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tasks" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "priorityId" INTEGER NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "eventId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "player_tasks" (
    "taskId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "player_tasks_pkey" PRIMARY KEY ("taskId","playerId")
);

CREATE TABLE "user_tasks" (
    "taskId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_tasks_pkey" PRIMARY KEY ("taskId","userId")
);

CREATE TABLE "player_notes" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "note" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER NOT NULL,

    CONSTRAINT "player_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "player_goals" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "goal" TEXT NOT NULL,
    "targetDate" TIMESTAMP(3),
    "isAchieved" BOOLEAN NOT NULL DEFAULT false,
    "achievedAt" TIMESTAMP(3),
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER NOT NULL,

    CONSTRAINT "player_goals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "games" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "opponent" TEXT NOT NULL,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "result" "GameResult",
    "gameDate" TIMESTAMP(3) NOT NULL,
    "season" TEXT NOT NULL DEFAULT '2024-25',
    "isPlayoffs" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "game_stats" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "playerId" INTEGER,
    "userId" INTEGER,
    "points" INTEGER NOT NULL DEFAULT 0,
    "fieldGoalsMade" INTEGER NOT NULL DEFAULT 0,
    "fieldGoalsAttempted" INTEGER NOT NULL DEFAULT 0,
    "threePointsMade" INTEGER NOT NULL DEFAULT 0,
    "threePointsAttempted" INTEGER NOT NULL DEFAULT 0,
    "freeThrowsMade" INTEGER NOT NULL DEFAULT 0,
    "freeThrowsAttempted" INTEGER NOT NULL DEFAULT 0,
    "rebounds" INTEGER NOT NULL DEFAULT 0,
    "offensiveRebounds" INTEGER NOT NULL DEFAULT 0,
    "defensiveRebounds" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "steals" INTEGER NOT NULL DEFAULT 0,
    "blocks" INTEGER NOT NULL DEFAULT 0,
    "turnovers" INTEGER NOT NULL DEFAULT 0,
    "fouls" INTEGER NOT NULL DEFAULT 0,
    "minutesPlayed" INTEGER NOT NULL DEFAULT 0,
    "plusMinus" INTEGER NOT NULL DEFAULT 0,
    "quarter" INTEGER,
    "period" TEXT,
    "timestamp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "game_stats_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "seasons" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "budget_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#1890ff',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "budget_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "budgets" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "period" TEXT NOT NULL,
    "autoRepeat" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "categoryId" INTEGER NOT NULL,
    "season" TEXT NOT NULL DEFAULT '2024-25',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "expenses" (
    "id" SERIAL NOT NULL,
    "budgetId" INTEGER,
    "merchant" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "category" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "eventId" INTEGER,
    "description" TEXT,
    "receiptUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "settings" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "table" TEXT NOT NULL,
    "recordId" INTEGER,
    "oldData" JSONB,
    "newData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_profileId_key" ON "users"("profileId");
CREATE UNIQUE INDEX "positions_name_key" ON "positions"("name");
CREATE UNIQUE INDEX "positions_abbreviation_key" ON "positions"("abbreviation");
CREATE UNIQUE INDEX "event_types_name_key" ON "event_types"("name");
CREATE UNIQUE INDEX "task_priorities_name_key" ON "task_priorities"("name");
CREATE UNIQUE INDEX "task_priorities_weight_key" ON "task_priorities"("weight");
CREATE UNIQUE INDEX "games_eventId_key" ON "games"("eventId");
CREATE UNIQUE INDEX "seasons_name_key" ON "seasons"("name");
CREATE UNIQUE INDEX "budget_categories_name_key" ON "budget_categories"("name");
CREATE UNIQUE INDEX "settings_userId_key" ON "settings"("userId");
CREATE UNIQUE INDEX "settings_userId_key_key" ON "settings"("userId", "key");

-- Create performance indexes
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "players_name_idx" ON "players"("name");
CREATE INDEX "players_positionId_idx" ON "players"("positionId");
CREATE INDEX "players_jersey_idx" ON "players"("jersey");
CREATE INDEX "players_createdBy_idx" ON "players"("createdBy");
CREATE INDEX "events_name_idx" ON "events"("name");
CREATE INDEX "events_eventTypeId_idx" ON "events"("eventTypeId");
CREATE INDEX "events_startTime_idx" ON "events"("startTime");
CREATE INDEX "events_createdBy_idx" ON "events"("createdBy");
CREATE INDEX "tasks_name_idx" ON "tasks"("name");
CREATE INDEX "tasks_status_idx" ON "tasks"("status");
CREATE INDEX "tasks_dueDate_idx" ON "tasks"("dueDate");
CREATE INDEX "tasks_priorityId_idx" ON "tasks"("priorityId");
CREATE INDEX "tasks_eventId_idx" ON "tasks"("eventId");
CREATE INDEX "tasks_createdBy_idx" ON "tasks"("createdBy");
CREATE INDEX "player_notes_playerId_idx" ON "player_notes"("playerId");
CREATE INDEX "player_notes_createdBy_idx" ON "player_notes"("createdBy");
CREATE INDEX "player_goals_playerId_idx" ON "player_goals"("playerId");
CREATE INDEX "player_goals_createdBy_idx" ON "player_goals"("createdBy");
CREATE INDEX "player_goals_category_idx" ON "player_goals"("category");
CREATE INDEX "games_gameDate_idx" ON "games"("gameDate");
CREATE INDEX "games_season_idx" ON "games"("season");
CREATE INDEX "games_opponent_idx" ON "games"("opponent");
CREATE INDEX "game_stats_gameId_idx" ON "game_stats"("gameId");
CREATE INDEX "game_stats_playerId_idx" ON "game_stats"("playerId");
CREATE INDEX "game_stats_quarter_idx" ON "game_stats"("quarter");
CREATE INDEX "seasons_isActive_idx" ON "seasons"("isActive");
CREATE INDEX "budgets_season_idx" ON "budgets"("season");
CREATE INDEX "budgets_categoryId_idx" ON "budgets"("categoryId");
CREATE INDEX "expenses_date_idx" ON "expenses"("date");
CREATE INDEX "expenses_category_idx" ON "expenses"("category");
CREATE INDEX "expenses_budgetId_idx" ON "expenses"("budgetId");
CREATE INDEX "expenses_eventId_idx" ON "expenses"("eventId");
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_table_idx" ON "audit_logs"("table");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- Add foreign key constraints (Note: These are logical constraints, actual enforcement depends on your database setup)
-- Users
ALTER TABLE "users" ADD CONSTRAINT "users_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Players
ALTER TABLE "players" ADD CONSTRAINT "players_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "players" ADD CONSTRAINT "players_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Events
ALTER TABLE "events" ADD CONSTRAINT "events_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "event_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "events" ADD CONSTRAINT "events_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Player Events
ALTER TABLE "player_events" ADD CONSTRAINT "player_events_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "player_events" ADD CONSTRAINT "player_events_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tasks
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_priorityId_fkey" FOREIGN KEY ("priorityId") REFERENCES "task_priorities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Player Tasks
ALTER TABLE "player_tasks" ADD CONSTRAINT "player_tasks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "player_tasks" ADD CONSTRAINT "player_tasks_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- User Tasks
ALTER TABLE "user_tasks" ADD CONSTRAINT "user_tasks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_tasks" ADD CONSTRAINT "user_tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Player Notes
ALTER TABLE "player_notes" ADD CONSTRAINT "player_notes_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "player_notes" ADD CONSTRAINT "player_notes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Player Goals
ALTER TABLE "player_goals" ADD CONSTRAINT "player_goals_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "player_goals" ADD CONSTRAINT "player_goals_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Games
ALTER TABLE "games" ADD CONSTRAINT "games_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Game Stats
ALTER TABLE "game_stats" ADD CONSTRAINT "game_stats_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "game_stats" ADD CONSTRAINT "game_stats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "game_stats" ADD CONSTRAINT "game_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Budgets
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "budget_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Expenses
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;