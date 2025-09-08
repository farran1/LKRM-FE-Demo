-- Add Missing Columns to Tasks Table
-- This script adds the missing columns needed for full task functionality

-- Step 1: Check current table structure
SELECT 'Current table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;

-- Step 2: Add missing columns
DO $$
BEGIN
    RAISE NOTICE 'Adding missing columns to tasks table...';
    
    -- Add name column (required for tasks)
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'name'
    ) THEN
        ALTER TABLE tasks ADD COLUMN "name" TEXT NOT NULL DEFAULT 'Untitled Task';
        RAISE NOTICE 'Added name column';
    ELSE
        RAISE NOTICE 'name column already exists';
    END IF;
    
    -- Add description column
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'description'
    ) THEN
        ALTER TABLE tasks ADD COLUMN "description" TEXT;
        RAISE NOTICE 'Added description column';
    ELSE
        RAISE NOTICE 'description column already exists';
    END IF;
    
    -- Add priorityId column (required for tasks)
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'priorityId'
    ) THEN
        ALTER TABLE tasks ADD COLUMN "priorityId" INTEGER NOT NULL DEFAULT 1;
        RAISE NOTICE 'Added priorityId column';
    ELSE
        RAISE NOTICE 'priorityId column already exists';
    END IF;
    
    -- Add dueDate column
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'dueDate'
    ) THEN
        ALTER TABLE tasks ADD COLUMN "dueDate" DATE;
        RAISE NOTICE 'Added dueDate column';
    ELSE
        RAISE NOTICE 'dueDate column already exists';
    END IF;
    
    -- Add eventId column
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'eventId'
    ) THEN
        ALTER TABLE tasks ADD COLUMN "eventId" INTEGER;
        RAISE NOTICE 'Added eventId column';
    ELSE
        RAISE NOTICE 'eventId column already exists';
    END IF;
    
    -- Add createdBy column
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'createdBy'
    ) THEN
        ALTER TABLE tasks ADD COLUMN "createdBy" INTEGER NOT NULL DEFAULT 1;
        RAISE NOTICE 'Added createdBy column';
    ELSE
        RAISE NOTICE 'createdBy column already exists';
    END IF;
    
    -- Add updatedBy column
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'updatedBy'
    ) THEN
        ALTER TABLE tasks ADD COLUMN "updatedBy" INTEGER NOT NULL DEFAULT 1;
        RAISE NOTICE 'Added updatedBy column';
    ELSE
        RAISE NOTICE 'updatedBy column already exists';
    END IF;
    
    RAISE NOTICE 'Column addition completed';
END $$;

-- Step 3: Rename userId to id (since it's actually the primary key)
DO $$
BEGIN
    -- Check if userId column exists and is the primary key
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'userId'
    ) THEN
        -- Check if it's the primary key
        IF EXISTS (
            SELECT FROM information_schema.table_constraints 
            WHERE table_name = 'tasks' 
            AND constraint_type = 'PRIMARY KEY' 
            AND constraint_name LIKE '%userId%'
        ) THEN
            -- Rename the constraint first
            ALTER TABLE tasks RENAME CONSTRAINT tasks_pkey TO tasks_pkey_old;
            RAISE NOTICE 'Renamed old primary key constraint';
        END IF;
        
        -- Rename the column
        ALTER TABLE tasks RENAME COLUMN "userId" TO "id";
        RAISE NOTICE 'Renamed userId column to id';
        
        -- Add new primary key constraint
        ALTER TABLE tasks ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);
        RAISE NOTICE 'Added new primary key constraint on id column';
        
        -- Drop old constraint if it exists
        IF EXISTS (
            SELECT FROM information_schema.table_constraints 
            WHERE table_name = 'tasks' AND constraint_name = 'tasks_pkey_old'
        ) THEN
            ALTER TABLE tasks DROP CONSTRAINT tasks_pkey_old;
            RAISE NOTICE 'Dropped old primary key constraint';
        END IF;
    ELSE
        RAISE NOTICE 'userId column not found, checking for id column';
        -- Ensure id column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'tasks' AND column_name = 'id'
        ) THEN
            ALTER TABLE tasks ADD COLUMN "id" SERIAL PRIMARY KEY;
            RAISE NOTICE 'Added id column as primary key';
        END IF;
    END IF;
END $$;

-- Step 4: Create task_priorities table if it doesn't exist
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

-- Step 5: Insert default task priorities
INSERT INTO task_priorities (name, weight, color) VALUES
    ('High', 1, '#ff4d4f'),
    ('Medium', 2, '#faad14'),
    ('Low', 3, '#52c41a')
ON CONFLICT (name) DO NOTHING;

-- Step 6: Create junction tables if they don't exist
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

-- Step 7: Add foreign key constraints
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

-- Step 8: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_name ON tasks(name);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_dueDate ON tasks("dueDate");
CREATE INDEX IF NOT EXISTS idx_tasks_priorityId ON tasks("priorityId");
CREATE INDEX IF NOT EXISTS idx_tasks_eventId ON tasks("eventId");
CREATE INDEX IF NOT EXISTS idx_tasks_createdBy ON tasks("createdBy");
CREATE INDEX IF NOT EXISTS idx_task_priorities_weight ON task_priorities(weight);

-- Step 9: Verify the final table structure
SELECT 'Final table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;

-- Step 10: Show final constraints
SELECT 'Final constraints:' as info;
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'tasks';

RAISE NOTICE 'Migration completed successfully!';
