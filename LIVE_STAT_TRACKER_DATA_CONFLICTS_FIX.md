# Live Stat Tracker Data Conflicts - Diagnosis & Fix

## Problem

You correctly identified that the issue is a mix of real Supabase data and locally stored data due to the offline mode. This creates several problems:

1. **Multiple Storage Systems**: Two different offline storage systems competing
2. **Session Conflicts**: Multiple active sessions for the same event
3. **Data Sync Issues**: Offline data conflicting with online data
4. **Old Data Persisting**: Previous localStorage data interfering

## Quick Fix

### 1. Check Database Tables (Browser Console)

First, check if all required database tables exist:

```javascript
// Check if all required tables exist
await window.dbDiagnostic.checkTables()
```

### 2. Check RLS (Row Level Security) Issues

If you see 406 errors, check RLS status:

```javascript
// Check RLS status and test table access
await window.dbDiagnostic.checkRLS()
```

### 3. Fix RLS Issues (if needed)

If RLS is blocking access:

```javascript
// Temporarily disable RLS for development
await window.dbDiagnostic.fixRLS()
```

### 4. Check for Data Conflicts (Browser Console)

Then check for data conflicts for a specific event:

```javascript
// Check for data conflicts for a specific event (replace 13 with your event ID)
await window.liveStatDebug.checkDataConflicts(13)
```

### 2. Force Cleanup if Needed

If conflicts are found and can't be auto-resolved:

```javascript
// Force cleanup for event 13 (WARNING: This deletes all data for the event)
await window.liveStatDebug.forceCleanup(13)
```

### 3. View All Data

To see what data is stored:

```javascript
// List all stored data
window.liveStatDebug.listAllData()

// Check storage usage
window.liveStatDebug.getStorageInfo()
```

### 4. Nuclear Option (Last Resort)

If everything is broken:

```javascript
// Clear ALL live stat tracker data (WARNING: Deletes everything)
window.liveStatDebug.clearAllData()
```

## What The Fix Does

### Automatic Cleanup on Session Start
- Removes old offline data for the event
- Cleans up old localStorage from statistics.tsx
- Deactivates conflicting online sessions
- Ensures only one active session per event

### Data Validation & Reconciliation
- Detects multiple active sessions
- Resolves conflicts automatically when possible
- Keeps the most recent data when conflicts exist
- Provides detailed conflict reports

### Storage Management
- Monitors storage usage
- Prevents data bloat
- Cleans up old sessions automatically

## Database Migrations Required

You still need to apply these Supabase migrations:

1. `supabase/migrations/20250120000000_create_live_stat_tracker_tables.sql`
2. `supabase/migrations/20250120000000_enhance_live_stat_tracker.sql`
3. `supabase/migrations/20250120000001_fix_rls_policies.sql`
4. `supabase/migrations/20250120000002_fix_aggregate_function.sql`

## Step-by-Step Recovery Process

1. **Apply Database Migrations** (in Supabase SQL editor)
2. **Check for Conflicts**: `window.liveStatDebug.checkDataConflicts(EVENT_ID)`
3. **Clean if Needed**: `window.liveStatDebug.forceCleanup(EVENT_ID)`
4. **Start Fresh Session**: Begin live stat tracking normally
5. **Verify**: Check that no errors appear in console

## Prevention

The enhanced service now:
- Automatically cleans up conflicts on session start
- Validates data before operations
- Provides better error handling
- Maintains data consistency between offline/online modes

## Error Patterns Fixed

- ✅ `ReferenceError: sessionData is not defined`
- ✅ HTTP 406/400 errors from missing tables
- ✅ Multiple active sessions conflicts
- ✅ localStorage data interference
- ✅ Sync status conflicts

## Console Commands Reference

```javascript
// Database diagnostic commands
window.dbDiagnostic.checkTables()                 // Check if all tables exist
window.dbDiagnostic.checkRLS()                    // Check RLS status and access
window.dbDiagnostic.fixRLS()                      // Fix RLS issues (disable temporarily)
window.dbDiagnostic.testLiveStatTracker(eventId)  // Test the live stat tracker

// Data conflict debug commands
window.liveStatDebug.checkDataConflicts(eventId)  // Check & fix conflicts
window.liveStatDebug.forceCleanup(eventId)        // Nuclear cleanup for event
window.liveStatDebug.listAllData()                // Show all stored data
window.liveStatDebug.clearAllData()               // Clear everything (dangerous)
window.liveStatDebug.getStorageInfo()             // Storage usage info
```

## Notes

- The debug utilities are only available in development/browser console
- Force cleanup operations are irreversible
- Always backup important data before force cleanup
- The system will automatically resolve most conflicts going forward
