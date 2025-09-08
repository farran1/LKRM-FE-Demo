-- Fix Tasks Table Structure
-- This script corrects the tasks table to match the expected application schema

-- Step 1: Drop the existing tasks table if it exists and recreate it properly
DROP TABLE IF EXISTS player_tasks CASCADE;
DROP TABLE IF EXISTS user_tasks CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;

-- Step 2: Create the tasks table with the correct structure
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    "dueDate" DATE,
    "priorityId" INTEGER NOT NULL,
    status TEXT DEFAULT 'TODO',
    "eventId" INTEGER,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "createdBy" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedBy" INTEGER NOT NULL
);

-- Step 3: Create the task_priorities table if it doesn't exist
CREATE TABLE IF NOT EXISTS task_priorities (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    weight INTEGER UNIQUE NOT NULL,
    color TEXT DEFAULT '#1890ff',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "createdBy" INTEGER DEFAULT 0,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedBy" INTEGER DEFAULT 0
);

-- Step 4: Insert default task priorities
INSERT INTO task_priorities (name, weight, color) VALUES
    ('High', 1, '#ff4d4f'),
    ('Medium', 2, '#faad14'),
    ('Low', 3, '#52c41a')
ON CONFLICT (name) DO NOTHING;

-- Step 5: Create the player_tasks junction table
CREATE TABLE player_tasks (
    "taskId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    status TEXT DEFAULT 'assigned',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "createdBy" INTEGER DEFAULT 0,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedBy" INTEGER DEFAULT 0,
    PRIMARY KEY ("taskId", "playerId")
);

-- Step 6: Create the user_tasks junction table
CREATE TABLE user_tasks (
    "taskId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    status TEXT DEFAULT 'assigned',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "createdBy" INTEGER DEFAULT 0,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedBy" INTEGER DEFAULT 0,
    PRIMARY KEY ("taskId", "userId")
);

-- Step 7: Add foreign key constraints
ALTER TABLE tasks 
    ADD CONSTRAINT tasks_priorityId_fkey 
    FOREIGN KEY ("priorityId") REFERENCES task_priorities(id);

ALTER TABLE tasks 
    ADD CONSTRAINT tasks_eventId_fkey 
    FOREIGN KEY ("eventId") REFERENCES events(id) ON DELETE SET NULL;

ALTER TABLE player_tasks 
    ADD CONSTRAINT player_tasks_taskId_fkey 
    FOREIGN KEY ("taskId") REFERENCES tasks(id) ON DELETE CASCADE;

ALTER TABLE player_tasks 
    ADD CONSTRAINT player_tasks_playerId_fkey 
    FOREIGN KEY ("playerId") REFERENCES players(id) ON DELETE CASCADE;

ALTER TABLE user_tasks 
    ADD CONSTRAINT user_tasks_taskId_fkey 
    FOREIGN KEY ("taskId") REFERENCES tasks(id) ON DELETE CASCADE;

-- Step 8: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_name ON tasks(name);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_dueDate ON tasks("dueDate");
CREATE INDEX IF NOT EXISTS idx_tasks_priorityId ON tasks("priorityId");
CREATE INDEX IF NOT EXISTS idx_tasks_eventId ON tasks("eventId");
CREATE INDEX IF NOT EXISTS idx_tasks_createdBy ON tasks("createdBy");
CREATE INDEX IF NOT EXISTS idx_task_priorities_weight ON task_priorities(weight);

-- Step 9: Add comments for documentation
COMMENT ON TABLE tasks IS 'Tasks table for managing team tasks and assignments';
COMMENT ON TABLE task_priorities IS 'Priority levels for tasks with weights and colors';
COMMENT ON TABLE player_tasks IS 'Junction table linking tasks to assigned players';
COMMENT ON TABLE user_tasks IS 'Junction table linking tasks to assigned users';

-- Step 10: Verify the table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;
