<!-- 475d67df-c72c-4512-9ba1-60cd24a6dfd5 310e0b49-48a9-47c1-8f39-be2266126b6e -->
# Full Online/Offline Live Stat Tracker Implementation

## Overview

Implement a robust live stat tracking system that works seamlessly online and offline, with automatic network detection, data preservation, and intelligent sync strategies.

## Architecture

### Data Storage Strategy

- **Online Mode**: Primary storage in Supabase (`live_game_sessions`, `live_game_events` tables)
- **Offline Mode**: localStorage as primary with sync queue
- **Cache Layer**: localStorage cache for roster, events (refreshed on login/updates)
- **Sync Queue**: Pending actions stored locally, synced when online

### Database Schema (Existing Tables to Use)

- `live_game_sessions`: Session metadata, game state, sync status
- `live_game_events`: Play-by-play actions (shots, rebounds, fouls, etc.)
- `live_game_sync_status`: Track sync state per session
- `games`: Final aggregated game records
- `game_stats`: Per-player per-game aggregated stats

## Implementation Plan

### 1. Core Services Layer

#### 1.1 Network Detection Service (`src/services/network-detector.ts`)

- Monitor online/offline status using `navigator.onLine` and ping tests
- Event emitter for status changes
- Exponential backoff for connection retries
- Heartbeat mechanism to verify real connectivity (not just network interface up)

#### 1.2 Cache Service (`src/services/cache-service.ts`)

- Cache roster data (players with positions, jersey numbers)
- Cache events (games/scrimmages with opponent info)
- Refresh on login and when data changes
- Storage quota monitoring with warnings at 80%, 90%
- Compression for large datasets
- Cache versioning for invalidation

#### 1.3 Sync Service (`src/services/sync-service.ts`)

- Queue management for pending actions
- Auto-sync when network restored
- Retry logic with exponential backoff
- Conflict detection and resolution (multi-device)
- Batch sync for efficiency
- Progress tracking and user feedback

#### 1.4 Live Stat Tracker Service (`src/services/live-stat-tracker-service.ts`)

- Unified API for online/offline operations
- Action recording (shots, rebounds, assists, etc.)
- Real-time stat aggregation
- Play-by-play event storage
- Session management (start, pause, resume, end)
- Opponent tracking by jersey number
- Team stats aggregation

### 2. Data Models

#### 2.1 LocalStorage Schema

```typescript
// Cache keys
'lkrm_roster_cache': Player[]
'lkrm_events_cache': Event[]
'lkrm_cache_version': string
'lkrm_last_sync': timestamp

// Active session
'lkrm_active_session_{eventId}': LiveGameSession

// Sync queue
'lkrm_sync_queue': SyncAction[]

// Storage stats
'lkrm_storage_stats': { used: number, quota: number }
```

#### 2.2 TypeScript Interfaces

- `LiveGameSession`: Session state, quarter, time, score, lineups
- `LiveGameEvent`: Play-by-play action with metadata
- `SyncAction`: Queued action for sync
- `CacheData`: Cached roster/events with version
- `OpponentPlayer`: Jersey number + team name (per-game only)

### 3. UI Components

#### 3.1 Network Status Indicator

- Visual indicator (online/offline/syncing)
- Sync progress bar when syncing
- Pending actions count
- Manual sync button

#### 3.2 Storage Quota Warning

- Toast notifications at 80%, 90% capacity
- Storage management UI
- Clear old games option

#### 3.3 Conflict Resolution Modal (for multi-device resume)

- Show both versions (local vs server)
- Display last modified timestamps
- Let user choose which to keep
- Merge option if feasible

#### 3.4 Resume Game Flow

- Check for local unsynced data
- Check for server data
- Detect conflicts (different last_modified)
- Show conflict UI if needed
- Load chosen version

### 4. Statistics Component Updates

#### 4.1 Integrate Services

- Replace current localStorage-only logic with unified service
- Add network status display
- Add sync status indicators
- Handle offline gracefully

#### 4.2 Play-by-Play Tracking

- Store every action with timestamp, quarter, game time
- Action types: field_goal_made/missed, three_point_made/missed, free_throw_made/missed, rebound (offensive/defensive), assist, steal, block, turnover, foul, substitution
- Metadata: shot location, assist player, foul type, etc.

#### 4.3 Opponent Tracking

- Jersey number input for opponent actions
- Store as `{opponentTeamName} #{jerseyNumber}`
- Per-game basis only (no cross-game identity)
- Aggregate opponent stats per game

#### 4.4 Real-time Aggregation

- Player stats: points, FG%, 3P%, FT%, rebounds, assists, steals, blocks, turnovers, fouls
- Team stats: total points, shooting percentages, rebounds, assists, turnovers, fouls
- Opponent stats: same as team stats
- Quarter-by-quarter breakdown

### 5. Sync Logic

#### 5.1 Online → Offline Transition

- Continue tracking seamlessly
- Queue all actions locally
- Show offline indicator
- No data loss

#### 5.2 Offline → Online Transition

- Detect network restoration
- Check for conflicts (multi-device)
- Sync queued actions in order
- Update server with local data
- Show sync progress
- Clear queue on success

#### 5.3 Conflict Resolution (Multi-Device)

- Compare `last_modified` timestamps
- If local newer: push to server
- If server newer: show conflict UI (6c approach)
- User chooses version or merge
- Fallback to 6b if too complex (last sync wins)

### 6. API Integration

#### 6.1 Supabase API Endpoints

- `POST /api/live-stat-tracker/sessions/create`: Create session
- `POST /api/live-stat-tracker/sessions/{id}/events`: Add events (batch)
- `GET /api/live-stat-tracker/sessions/{id}`: Get session data
- `PUT /api/live-stat-tracker/sessions/{id}/sync`: Sync local changes
- `POST /api/live-stat-tracker/sessions/{id}/end`: End and aggregate
- `GET /api/live-stat-tracker/sessions/by-event/{eventId}`: Check for existing session

#### 6.2 Cache Refresh Endpoints

- `GET /api/players`: Get roster (cache on login)
- `GET /api/events`: Get events (cache on login)

### 7. Testing Strategy

#### 7.1 Network Scenarios

- Start online, go offline mid-game
- Start offline, go online mid-game
- Intermittent connectivity
- Multi-device resume conflicts

#### 7.2 Data Integrity

- Verify no action loss during transitions
- Verify correct aggregation
- Verify sync queue ordering

## Key Files to Modify

1. `src/services/network-detector.ts` (new)
2. `src/services/cache-service.ts` (new)
3. `src/services/sync-service.ts` (new)
4. `src/services/live-stat-tracker-service.ts` (new)
5. `app/(auth)/live-stat-tracker/statistics.tsx` (major refactor)
6. `app/(auth)/live-stat-tracker/track/page.tsx` (update for sync)
7. `app/(auth)/live-stat-tracker/page.tsx` (add cache refresh)
8. `app/api/live-stat-tracker/*` (new API routes)
9. `src/types/live-stat-tracker.ts` (new type definitions)

## Migration from Current State

1. Remove old service references (already done)
2. Implement new service layer
3. Update UI to use new services
4. Add network/sync indicators
5. Test thoroughly with network scenarios

## Success Criteria

- ✅ Works fully offline (localStorage only)
- ✅ Works fully online (Supabase sync)
- ✅ Seamless transitions between online/offline
- ✅ No data loss during network interruptions
- ✅ Resume works across devices (with conflict resolution)
- ✅ Storage quota warnings
- ✅ Play-by-play actions stored
- ✅ Opponent tracking by jersey number
- ✅ Stats dashboard receives aggregated data

### To-dos

- [ ] Create NetworkDetector service for online/offline detection with heartbeat
- [ ] Create CacheService for roster/events caching with quota monitoring
- [ ] Create SyncService for queue management and auto-sync with conflict resolution
- [ ] Create TypeScript interfaces for LiveGameSession, LiveGameEvent, SyncAction, etc.
- [ ] Create unified LiveStatTrackerService that works online/offline
- [ ] Create API routes for session management, event sync, and cache refresh
- [ ] Create NetworkStatusIndicator, StorageWarning, ConflictResolution components
- [ ] Refactor statistics.tsx to use new service layer with play-by-play tracking
- [ ] Update track/page.tsx for sync handling and resume logic
- [ ] Update main page.tsx to refresh cache on load
- [ ] Test all network scenarios and data integrity