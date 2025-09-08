-- Safe Fix for Tasks Table Structure
-- This script carefully fixes the tasks table without losing data

-- Step 1: Check current table structure
DO $$
BEGIN
    RAISE NOTICE 'Current tasks table structure:';
    RAISE NOTICE 'Checking existing columns...';
END $$;

-- Step 2: Check what columns currently exist
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;

-- Step 3: Check current constraints
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'tasks';

-- Step 4: Create backup of existing data (if any)
CREATE TABLE IF NOT EXISTS tasks_backup AS SELECT * FROM tasks;

-- Step 5: Fix the table structure step by step
DO $$
DECLARE
    col_exists BOOLEAN;
    constraint_exists BOOLEAN;
BEGIN
    RAISE NOTICE 'Starting safe table structure fixes...';
    
    -- Check if userId column exists and fix it
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'userId'
    ) INTO col_exists;
    
    IF col_exists THEN
        RAISE NOTICE 'Found userId column, checking if it should be the primary key...';
        
        -- Check if userId is currently the primary key
        SELECT EXISTS (
            SELECT FROM information_schema.table_constraints 
            WHERE table_name = 'tasks' 
            AND constraint_type = 'PRIMARY KEY' 
            AND constraint_name LIKE '%userId%'
        ) INTO constraint_exists;
        
        IF constraint_exists THEN
            RAISE NOTICE 'userId is currently the primary key, will rename to id';
            -- Rename userId to id
            ALTER TABLE tasks RENAME COLUMN "userId" TO "id";
        ELSE
            RAISE NOTICE 'userId exists but is not primary key, checking if we need to add id column';
            -- Add id column if it doesn't exist
            IF NOT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'tasks' AND column_name = 'id'
            ) THEN
                ALTER TABLE tasks ADD COLUMN "id" SERIAL PRIMARY KEY;
                RAISE NOTICE 'Added id column as primary key';
            END IF;
        END IF;
    ELSE
        RAISE NOTICE 'No userId column found, checking for id column';
        -- Check if id column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'tasks' AND column_name = 'id'
        ) THEN
            ALTER TABLE tasks ADD COLUMN "id" SERIAL PRIMARY KEY;
            RAISE NOTICE 'Added id column as primary key';
        END IF;
    END IF;
    
    -- Ensure required columns exist with correct names
    -- Check and fix priorityId column
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'priorityId'
    ) THEN
        -- Check if priority_id exists (snake_case)
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'tasks' AND column_name = 'priority_id'
        ) THEN
            ALTER TABLE tasks RENAME COLUMN "priority_id" TO "priorityId";
            RAISE NOTICE 'Renamed priority_id to priorityId';
        ELSE
            ALTER TABLE tasks ADD COLUMN "priorityId" INTEGER;
            RAISE NOTICE 'Added priorityId column';
        END IF;
    END IF;
    
    -- Check and fix eventId column
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'eventId'
    ) THEN
        -- Check if event_id exists (snake_case)
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'tasks' AND column_name = 'event_id'
        ) THEN
            ALTER TABLE tasks RENAME COLUMN "event_id" TO "eventId";
            RAISE NOTICE 'Renamed event_id to eventId';
        ELSE
            ALTER TABLE tasks ADD COLUMN "eventId" INTEGER;
            RAISE NOTICE 'Added eventId column';
        END IF;
    END IF;
    
    -- Check and fix dueDate column
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'dueDate'
    ) THEN
        -- Check if due_date exists (snake_case)
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'tasks' AND column_name = 'due_date'
        ) THEN
            ALTER TABLE tasks RENAME COLUMN "due_date" TO "dueDate";
            RAISE NOTICE 'Renamed due_date to dueDate';
        ELSE
            ALTER TABLE tasks ADD COLUMN "dueDate" DATE;
            RAISE NOTICE 'Added dueDate column';
        END IF;
    END IF;
    
    -- Check and fix createdAt column
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'createdAt'
    ) THEN
        -- Check if created_at exists (snake_case)
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'tasks' AND column_name = 'created_at'
        ) THEN
            ALTER TABLE tasks RENAME COLUMN "created_at" TO "createdAt";
            RAISE NOTICE 'Renamed created_at to createdAt';
        ELSE
            ALTER TABLE tasks ADD COLUMN "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added createdAt column';
        END IF;
    END IF;
    
    -- Check and fix createdBy column
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'createdBy'
    ) THEN
        -- Check if created_by exists (snake_case)
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'tasks' AND column_name = 'created_by'
        ) THEN
            ALTER TABLE tasks RENAME COLUMN "created_by" TO "createdBy";
            RAISE NOTICE 'Renamed created_by to createdBy';
        ELSE
            ALTER TABLE tasks ADD COLUMN "createdBy" INTEGER DEFAULT 1;
            RAISE NOTICE 'Added createdBy column';
        END IF;
    END IF;
    
    RAISE NOTICE 'Table structure fixes completed';
END $$;

-- Step 6: Create task_priorities table if it doesn't exist
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

-- Step 7: Insert default task priorities
INSERT INTO task_priorities (name, weight, color) VALUES
    ('High', 1, '#ff4d4f'),
    ('Medium', 2, '#faad14'),
    ('Low', 3, '#52c41a')
ON CONFLICT (name) DO NOTHING;

-- Step 8: Create junction tables if they don't exist
CREATE TABLE IF NOT EXISTS player_tasks (
    "taskId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    status TEXT DEFAULT 'assigned',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "createdBy" INTEGER DEFAULT 0,
    PRIMARY KEY ("taskId", "playerId")
);

CREATE TABLE IF NOT EXISTS user_tasks (
    "taskId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    status TEXT DEFAULT 'assigned',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "createdBy" INTEGER DEFAULT 0,
    PRIMARY KEY ("taskId", "userId")
);

-- Step 9: Add foreign key constraints (only if they don't exist)
DO $$
BEGIN
    -- Add priority constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE table_name = 'tasks' 
        AND constraint_name = 'tasks_priorityId_fkey'
    ) THEN
        ALTER TABLE tasks 
        ADD CONSTRAINT tasks_priorityId_fkey 
        FOREIGN KEY ("priorityId") REFERENCES task_priorities(id);
        RAISE NOTICE 'Added priorityId foreign key constraint';
    END IF;
    
    -- Add event constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE table_name = 'tasks' 
        AND constraint_name = 'tasks_eventId_fkey'
    ) THEN
        ALTER TABLE tasks 
        ADD CONSTRAINT tasks_eventId_fkey 
        FOREIGN KEY ("eventId") REFERENCES events(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added eventId foreign key constraint';
    END IF;
END $$;

-- Step 10: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_name ON tasks(name);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_dueDate ON tasks("dueDate");
CREATE INDEX IF NOT EXISTS idx_tasks_priorityId ON tasks("priorityId");
CREATE INDEX IF NOT EXISTS idx_tasks_eventId ON tasks("eventId");
CREATE INDEX IF NOT EXISTS idx_tasks_createdBy ON tasks("createdBy");
CREATE INDEX IF NOT EXISTS idx_task_priorities_weight ON task_priorities(weight);

-- Step 11: Verify the final table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;

-- Step 12: Show final constraints
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'tasks';

RAISE NOTICE 'Safe migration completed. Check the results above.';
