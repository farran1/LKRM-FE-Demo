# Fix for RPC Function Error: {}

## Problem
The `aggregate_live_events_to_game_stats` function was failing with an empty error object `{}` because:

1. **Wrong parameter name**: Function expects `session_id_param` but code was calling it with `session_id`
2. **Missing database fields**: Function wasn't providing all required fields for the `game_stats` table

## Fixes Applied

### 1. ✅ Fixed Parameter Name
**File:** `src/services/enhancedLiveStatTrackerService.ts`
- Changed from: `{ session_id: session.id }`  
- Changed to: `{ session_id_param: session.id }`

### 2. ✅ Improved Error Handling
Added detailed error logging to show exactly what's failing:
```javascript
console.error('RPC function error details:', {
  message: error.message,
  details: error.details,
  hint: error.hint,
  code: error.code,
  full_error: error
})
```

### 3. 🔧 Database Function Update Required
**File:** `fix_aggregate_function.sql`

The database function needs to be updated to include all required fields. **Run this SQL in Supabase SQL Editor:**

```sql
-- See fix_aggregate_function.sql for the complete updated function
```

## What Was Missing
The `game_stats` table requires these fields that weren't being populated:
- `fieldGoalsMade`, `fieldGoalsAttempted`
- `threePointsMade`, `threePointsAttempted` 
- `freeThrowsMade`, `freeThrowsAttempted`
- `offensiveRebounds`, `defensiveRebounds`
- `createdBy`, `updatedBy`

## Next Steps

1. **Run the SQL fix:**
   - Open Supabase Dashboard → SQL Editor
   - Copy contents of `fix_aggregate_function.sql`
   - Execute the SQL

2. **Test the aggregation:**
   - Start a live game
   - Record some stats
   - End the game
   - Check console logs for success message

## Expected Console Output (After Fix)
```
Starting aggregation for session: live-game-xxx
Found session ID: 123
Found events to aggregate, calling database function with session_id: 123
Live events aggregated to game_stats successfully: null
```

## If Still Having Issues
Check the detailed error logs in browser console for specific database constraint violations or missing data.

