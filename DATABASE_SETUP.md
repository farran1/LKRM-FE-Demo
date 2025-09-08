# Database Setup for LKRM Player Management System

## Overview
This document explains how to set up the database schema for the LKRM Player Management System. The new schema properly supports:
- Separate first and last names
- School year (freshman, sophomore, junior, senior)
- Position (Center, Forward, Guard)
- Jersey number
- Notes and goals in separate tables

## Prerequisites
- Supabase project set up
- Access to Supabase SQL editor or database

## Step 1: Run the Database Migration

### Option A: Using Supabase SQL Editor (Recommended)
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `database_migration.sql`
5. Click **Run** to execute the migration

### Option B: Using Supabase CLI
```bash
supabase db reset
# Then run the migration file
```

## Step 2: Verify the Setup

After running the migration, you should see:
- ✅ `players` table with proper schema
- ✅ `player_notes` table
- ✅ `player_goals` table
- ✅ `positions` table with default values
- ✅ `player_details` view for easy data retrieval
- ✅ Row Level Security (RLS) policies enabled

## Step 3: Test the Setup

You can test if everything is working by running this query in the SQL editor:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('players', 'player_notes', 'player_goals', 'positions');

-- Check if positions were seeded
SELECT * FROM positions;

-- Check the player_details view
SELECT * FROM player_details LIMIT 1;
```

## Database Schema Details

### Players Table
```sql
CREATE TABLE players (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    school_year school_year_enum NOT NULL,
    position_id BIGINT NOT NULL REFERENCES positions(id),
    jersey_number VARCHAR(10) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Player Notes Table
```sql
CREATE TABLE player_notes (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Player Goals Table
```sql
CREATE TABLE player_goals (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    goal_text TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Foreign Key Constraints**: Ensures data integrity
- **Cascade Deletes**: When a player is deleted, their notes and goals are automatically removed
- **User Isolation**: Each user can only see and modify their own players

## Next Steps

After the database is set up:
1. Update your frontend code to use the new schema
2. Test creating players with the new fields
3. Test adding notes and goals
4. Verify that the data is properly isolated per user

## Troubleshooting

### Common Issues

1. **Permission Denied**: Make sure you're running the migration as a superuser or have the necessary permissions
2. **Table Already Exists**: The migration will drop existing tables - make sure to backup any important data first
3. **RLS Policies**: If you can't see data, check that RLS policies are properly configured

### Getting Help

If you encounter issues:
1. Check the Supabase logs in your dashboard
2. Verify that all SQL statements executed successfully
3. Check that your user has the necessary permissions
