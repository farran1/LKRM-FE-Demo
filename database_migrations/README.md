# Database Migration Scripts for User Tracking

This directory contains SQL scripts to update your database schema to support storing user emails/names instead of integer IDs for the `createdBy` and `updatedBy` columns.

## 📋 Current Status

- ✅ **`expenses`** table: Already has `character varying` columns
- ❌ **`tasks`** table: Still has `integer` columns
- ❌ **`events`** table: Still has `integer` columns  
- ❌ **`budget_categories`** table: Still has `integer` columns
- ❌ **`budgets`** table: Still has `integer` columns
- ❌ **`player_notes`** table: Still has `integer` columns
- ❌ **`player_goals`** table: Still has `integer` columns

## 🚀 Available Scripts

### 1. `fix_assignee_foreign_key.sql` (CRITICAL - Run First!)
**Use this to fix the assigneeId foreign key constraint issue**
- Removes the problematic `tasks_assigneeId_fkey` constraint
- Fixes the "no unique constraint matching given keys" error
- **MUST be run before any other migration scripts**
- **Recommended approach**: Remove foreign key entirely

### 2. `setup_tasks_without_auth_constraint.sql` (RECOMMENDED)
**Use this to work with auth.users without foreign key constraints**
- **No permission issues** - doesn't modify auth.users table
- Creates helper functions for validation
- Creates view for easy querying with user info
- **Application-level validation** instead of database constraints
- **Works immediately** without permission errors

### 3. `setup_tasks_auth_users_fk.sql` (Requires Admin Access)
**Use this only if you have admin access to modify auth.users**
- Creates unique constraint on `auth.users.email`
- Links `tasks.assigneeId` to `auth.users.email`
- **Requires** owner permissions on auth.users table
- **May fail** with permission errors

### 4. `setup_tasks_auth_users_uuid_fk.sql` (Advanced)
**Use this for UUID-based foreign key constraints**
- Changes `assigneeId` to UUID type
- Links `tasks.assigneeId` to `auth.users.id`
- **More standard** approach using UUIDs
- **Requires** updating existing data

### 4. `simple_email_conversion.sql` (For Other Tables)
**Use this for simple email storage on other tables**
- Converts integer IDs to email addresses
- Easy to read and query
- Minimal data structure
- **Example**: `createdBy = "andrew@lkrmsports.com"`

### 5. `update_user_tracking_columns.sql` (Full JSON)
**Use this for rich user data storage**
- Converts integer IDs to JSON strings
- Stores email, name, and UUID
- More complex but more informative
- **Example**: `createdBy = '{"email":"andrew@lkrmsports.com","name":"Andrew Farrell","id":"uuid"}'`

### 6. `customize_user_data_mapping.sql` (Customizable)
**Use this to map your specific user data**
- Helps you identify existing user IDs
- Creates custom mapping functions
- Allows you to preserve actual user information
- **Best for**: When you know which integer IDs correspond to which users

## 🔧 How to Use

### Step 1: Fix Foreign Key Issues (CRITICAL!)

**Choose your approach:**

#### Option A: Remove Foreign Key (Recommended)
```sql
-- Copy and paste the entire fix_assignee_foreign_key.sql file
-- This removes the problematic foreign key constraint entirely
```

#### Option B: Work with Auth.Users (Recommended)
```sql
-- Copy and paste setup_tasks_without_auth_constraint.sql
-- This creates helper functions and views for auth.users
-- No permission issues, works immediately
```

#### Option C: Foreign Key with Admin Access (Advanced)
```sql
-- Copy and paste setup_tasks_auth_users_fk.sql
-- This links tasks.assigneeId to auth.users.email
-- Requires admin permissions on auth.users table
```

#### Option D: UUID-based Foreign Key (Advanced)
```sql
-- Copy and paste setup_tasks_auth_users_uuid_fk.sql
-- This uses UUIDs instead of emails
-- More standard but requires data migration
```

### Step 2: Choose Your Migration Option

#### Option A: Simple Email Conversion (Recommended)

1. **Edit the script** to match your user mappings:
   ```sql
   -- In simple_email_conversion.sql, update these lines:
   WHEN createdBy = 1 THEN 'andrew@lkrmsports.com'  -- Your actual email
   WHEN createdBy = 2 THEN 'coach@example.com'      -- Other users
   ```

2. **Run the script** in your Supabase SQL editor:
   ```sql
   -- Copy and paste the entire simple_email_conversion.sql file
   ```

3. **Verify the results**:
   ```sql
   SELECT createdBy, updatedBy FROM tasks LIMIT 5;
   ```

### Option B: Full JSON Conversion

1. **Run the main script**:
   ```sql
   -- Copy and paste update_user_tracking_columns.sql
   ```

2. **The script will**:
   - Convert all integer IDs to JSON format
   - Preserve data integrity
   - Set proper constraints

### Option C: Custom Mapping

1. **First, identify your users**:
   ```sql
   -- Run the queries in customize_user_data_mapping.sql
   -- to see what user IDs exist in your data
   ```

2. **Create your mapping**:
   ```sql
   -- Update the user_mapping table with your actual user data
   INSERT INTO user_mapping (old_id, email, name) VALUES
       (1, 'andrew@lkrmsports.com', 'Andrew Farrell'),
       (2, 'coach@example.com', 'Coach User');
   ```

3. **Run the customized migration**

## ⚠️ Important Notes

### Before Running Any Script:

1. **Backup your database** (Supabase automatically creates backups, but you can also export)
2. **Test on a development environment** first
3. **Review the user mappings** in the scripts to match your actual users

### After Running the Scripts:

1. **Update your application code** to handle the new data format
2. **Test all functionality** to ensure everything works
3. **Monitor for any issues** in the first few days

## 🔍 Verification Queries

After running any script, use these queries to verify the changes:

```sql
-- Check column types
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE column_name IN ('createdBy', 'updatedBy') 
ORDER BY table_name, column_name;

-- Check sample data
SELECT 'tasks' as table_name, createdBy, updatedBy FROM tasks LIMIT 3
UNION ALL
SELECT 'events' as table_name, createdBy, updatedBy FROM events LIMIT 3;
```

## 🆘 Troubleshooting

### If something goes wrong:

1. **Restore from backup** (Supabase dashboard → Database → Backups)
2. **Check the error messages** in the SQL editor
3. **Verify your user mappings** match your actual data

### Common Issues:

- **"Column does not exist"**: Make sure you're running the scripts in the correct order
- **"Data type mismatch"**: The application code might need updates to handle the new format
- **"NOT NULL constraint"**: Some columns might have NULL values that need to be handled

## 📞 Support

If you encounter issues:
1. Check the Supabase logs
2. Verify your user mappings
3. Test the queries step by step
4. Contact support if needed

## 🎯 Next Steps

After running the migration:
1. Update your application code to use the new format
2. Test all user-related functionality
3. Consider updating your API responses to include user names
4. Set up proper user management for future entries
