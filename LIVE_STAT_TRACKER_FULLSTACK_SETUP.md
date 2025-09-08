# Live Stat Tracker - Full-Stack Setup Guide

## Overview

The Live Stat Tracker now has full-stack capabilities with Supabase integration, providing:
- **Real-time data synchronization** between multiple devices
- **Offline-first functionality** with automatic sync when online
- **Persistent storage** in Supabase database
- **Real-time subscriptions** for live updates
- **Comprehensive API endpoints** for all operations
- **Row-level security** for data protection

## Database Setup

### 1. Run the Migration

Copy and paste the SQL from `supabase/migrations/20250120000000_create_live_stat_tracker_tables.sql` into your Supabase SQL Editor and execute it.

This creates the following tables:
- `live_game_sessions` - Main game sessions
- `live_game_events` - Individual stat events
- `live_game_lineups` - Player lineups
- `live_game_substitutions` - Player substitutions
- `live_game_settings` - Game configuration
- `live_game_timeouts` - Timeout tracking
- `live_game_sync_status` - Offline sync status

### 2. Verify RLS Policies

The migration automatically creates Row Level Security (RLS) policies that ensure users can only access their own data or data from events they're coaching.

### 3. Check Indexes

Performance indexes are automatically created for:
- Session lookups by event ID and session key
- Event queries by session, player, and type
- Lineup and substitution queries

## Environment Variables

Add these to your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://fvmsotuqcwftwknbojwp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Service Integration

### 1. Import the Service

```typescript
import { liveStatTrackerService } from '@/services/liveStatTrackerService'
```

### 2. Create a Game Session

```typescript
const session = await liveStatTrackerService.createGameSession(
  eventId, 
  initialGameState
)
```

### 3. Record Game Events

```typescript
await liveStatTrackerService.recordGameEvent(sessionKey, {
  player_id: playerId,
  event_type: 'points',
  event_value: 2,
  quarter: 1,
  game_time: 120, // seconds from start of quarter
  is_opponent_event: false,
  metadata: { shot_type: 'layup' }
})
```

### 4. Update Game State

```typescript
await liveStatTrackerService.updateGameState(sessionKey, {
  currentQuarter: 2,
  timeRemaining: 480,
  homeScore: 24,
  awayScore: 18,
  isPlaying: true
})
```

### 5. Real-time Subscriptions

```typescript
const channel = liveStatTrackerService.subscribeToSession(
  sessionKey, 
  (data) => {
    console.log('Real-time update:', data)
    // Update UI with new data
  }
)

// Cleanup when done
liveStatTrackerService.unsubscribeFromSession(sessionKey)
```

## API Endpoints

### GET Operations

```typescript
// Get all sessions for an event
GET /api/live-stat-tracker?type=sessions&eventId=123

// Get specific session with all data
GET /api/live-stat-tracker?type=session&sessionKey=game-123-1234567890

// Get events for a session
GET /api/live-stat-tracker?type=events&sessionKey=game-123-1234567890

// Get lineups for a session
GET /api/live-stat-tracker?type=lineups&sessionKey=game-123-1234567890

// Get substitutions for a session
GET /api/live-stat-tracker?type=substitutions&sessionKey=game-123-1234567890

// Get settings for a session
GET /api/live-stat-tracker?type=settings&sessionKey=game-123-1234567890

// Get timeouts for a session
GET /api/live-stat-tracker?type=timeouts&sessionKey=game-123-1234567890

// Get sync status for a session
GET /api/live-stat-tracker?type=sync-status&sessionKey=game-123-1234567890
```

### POST Operations

```typescript
// Create new session
POST /api/live-stat-tracker
{
  "action": "create-session",
  "data": {
    "eventId": 123,
    "sessionKey": "game-123-1234567890",
    "gameState": {...},
    "createdBy": 1,
    "settings": {...}
  }
}

// Record game event
POST /api/live-stat-tracker
{
  "action": "record-event",
  "data": {
    "sessionId": 1,
    "playerId": 5,
    "eventType": "points",
    "eventValue": 2,
    "quarter": 1,
    "gameTime": 120,
    "isOpponentEvent": false,
    "metadata": {...}
  }
}

// Update lineup
POST /api/live-stat-tracker
{
  "action": "update-lineup",
  "data": {
    "sessionId": 1,
    "lineupName": "Starting 5",
    "playerIds": [1, 2, 3, 4, 5],
    "startTime": 0,
    "endTime": null,
    "plusMinus": 0
  }
}

// Record substitution
POST /api/live-stat-tracker
{
  "action": "record-substitution",
  "data": {
    "sessionId": 1,
    "playerInId": 6,
    "playerOutId": 1,
    "quarter": 1,
    "gameTime": 300,
    "lineupId": 1
  }
}

// Record timeout
POST /api/live-stat-tracker
{
  "action": "record-timeout",
  "data": {
    "sessionId": 1,
    "team": "home",
    "quarter": 1,
    "gameTime": 240,
    "duration": 60
  }
}

// Update game state
POST /api/live-stat-tracker
{
  "action": "update-game-state",
  "data": {
    "sessionKey": "game-123-1234567890",
    "gameState": {...}
  }
}

// Update settings
POST /api/live-stat-tracker
{
  "action": "update-settings",
  "data": {
    "sessionId": 1,
    "quarterDuration": 600,
    "totalQuarters": 4,
    "timeoutCount": 4,
    "shotClock": 30,
    "autoPauseOnTimeout": true,
    "autoPauseOnQuarterEnd": true
  }
}

// End session
POST /api/live-stat-tracker
{
  "action": "end-session",
  "data": {
    "sessionKey": "game-123-1234567890"
  }
}

// Sync offline data
POST /api/live-stat-tracker
{
  "action": "sync-offline-data",
  "data": {
    "sessionId": 1
  }
}
```

### PUT Operations

```typescript
// Update session
PUT /api/live-stat-tracker
{
  "sessionKey": "game-123-1234567890",
  "updates": {
    "game_state": {...},
    "is_active": false
  }
}
```

### DELETE Operations

```typescript
// Delete session
DELETE /api/live-stat-tracker?sessionKey=game-123-1234567890
```

## Offline Functionality

### 1. Automatic Offline Storage

All data is automatically saved to localStorage when offline:
- Game sessions
- Individual events
- Lineups and substitutions
- Game settings
- Timeouts

### 2. Automatic Sync

When the device comes back online:
- All offline data is automatically synced to Supabase
- Failed syncs are retried
- Sync status is tracked for each session

### 3. Offline Data Management

```typescript
// Get all offline sessions
const offlineSessions = liveStatTrackerService.getOfflineSessions()

// Get specific offline session
const session = liveStatTrackerService.getOfflineSession(sessionKey)

// Delete offline session
liveStatTrackerService.deleteOfflineSession(sessionKey)

// Clear all offline data
liveStatTrackerService.clearAllOfflineData()

// Export offline data
const exportData = liveStatTrackerService.exportOfflineData()

// Import offline data
liveStatTrackerService.importOfflineData(jsonString)

// Get storage usage
const usage = liveStatTrackerService.getStorageUsage()
```

## Real-time Features

### 1. Live Updates

Multiple devices can track the same game in real-time:
- Stat changes appear instantly on all devices
- Lineup changes are synchronized
- Game state updates are broadcast

### 2. Subscription Management

```typescript
// Subscribe to session updates
const channel = liveStatTrackerService.subscribeToSession(
  sessionKey,
  (data) => {
    // Handle real-time updates
    updateUI(data)
  }
)

// Unsubscribe when done
liveStatTrackerService.unsubscribeFromSession(sessionKey)
```

## Security Features

### 1. Row Level Security (RLS)

- Users can only access their own game sessions
- Coaches can access sessions for events they're assigned to
- All data operations are validated against user permissions

### 2. API Security

- Service role key required for server-side operations
- User authentication validated for all requests
- Input validation and sanitization

## Performance Optimizations

### 1. Database Indexes

- Optimized queries for session lookups
- Efficient event filtering by type and time
- Fast lineup and substitution queries

### 2. Caching Strategy

- Offline data cached in localStorage
- Real-time subscriptions for live updates
- Automatic sync with conflict resolution

## Error Handling

### 1. Network Failures

- Automatic fallback to offline storage
- Retry logic for failed syncs
- Graceful degradation when offline

### 2. Data Validation

- Input validation on all API endpoints
- Type checking for all data structures
- Error logging and user feedback

## Monitoring and Debugging

### 1. Sync Status Tracking

```typescript
// Check sync status for a session
const syncStatus = await fetch(
  `/api/live-stat-tracker?type=sync-status&sessionKey=${sessionKey}`
)
```

### 2. Storage Monitoring

```typescript
// Monitor storage usage
const usage = liveStatTrackerService.getStorageUsage()
console.log(`Storage: ${usage.percentage}% used`)
```

### 3. Error Logging

All errors are logged to the console with detailed information for debugging.

## Best Practices

### 1. Session Management

- Always create a session before recording events
- End sessions when games are complete
- Clean up subscriptions when components unmount

### 2. Data Consistency

- Use the service methods for all data operations
- Let the service handle offline/online logic
- Don't manually manipulate localStorage

### 3. Performance

- Batch updates when possible
- Use real-time subscriptions sparingly
- Clean up unused sessions and subscriptions

### 4. User Experience

- Show sync status to users
- Provide offline indicators
- Handle errors gracefully with user feedback

## Troubleshooting

### Common Issues

1. **Sync Failures**
   - Check network connectivity
   - Verify user authentication
   - Check RLS policies

2. **Performance Issues**
   - Monitor storage usage
   - Check for memory leaks in subscriptions
   - Verify database indexes

3. **Data Loss**
   - Check offline storage
   - Verify sync status
   - Check error logs

### Debug Commands

```typescript
// Check all offline data
console.log(liveStatTrackerService.getOfflineSessions())

// Check storage usage
console.log(liveStatTrackerService.getStorageUsage())

// Force sync attempt
liveStatTrackerService.syncOfflineData()
```

## Future Enhancements

- **Conflict Resolution**: Handle simultaneous edits from multiple devices
- **Data Compression**: Reduce storage usage for long games
- **Advanced Analytics**: Real-time game insights and predictions
- **Team Collaboration**: Multiple coaches tracking the same game
- **Export Formats**: PDF reports, video highlights, social media sharing

## Support

For issues or questions:
1. Check the error logs in the browser console
2. Verify your Supabase configuration
3. Check the network tab for API failures
4. Review the RLS policies in your database

The Live Stat Tracker is now a fully-featured, production-ready application with enterprise-grade offline capabilities and real-time synchronization!
