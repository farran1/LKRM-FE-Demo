# Enhanced Live Stat Tracker - Priority-Based Setup

## 🎯 **Your Priorities Addressed**

✅ **Team & Player Level Stats** - Builds on existing `game_stats` table  
✅ **Offline Performance** - Full offline capability with automatic sync  
✅ **Stats Dashboard Integration** - Automatically populates existing tables  

## 🚀 **What This Gives You**

### **1. Live Stat Collection**
- **Real-time tracking** during games
- **Player-level stats** (points, rebounds, assists, etc.)
- **Team-level aggregation** (quarter-by-quarter totals)
- **Opponent tracking** (jersey-based, no player ID needed)

### **2. Offline-First Performance**
- **100% offline capable** - works without internet
- **Automatic sync** when connection restored
- **Local storage** for all game data
- **No data loss** during connectivity issues

### **3. Seamless Integration**
- **Existing stats dashboard** works unchanged
- **Live events automatically aggregate** into `game_stats` table
- **Team totals calculated** from live events
- **Backward compatible** with current system

## 📋 **Setup Steps**

### **Step 1: Run the Migration**
Copy and paste the SQL from `supabase/migrations/20250120000000_enhance_live_stat_tracker.sql` into your Supabase SQL Editor and execute it.

This creates:
- `live_game_sessions` - Live game tracking sessions
- `live_game_events` - Real-time stat events
- `live_game_sync_status` - Offline sync tracking
- **Database functions** for automatic aggregation

### **Step 2: Import the Service**
```typescript
import { enhancedLiveStatTrackerService } from '@/services/enhancedLiveStatTrackerService'
```

### **Step 3: Start Live Tracking**
```typescript
// Start a live game session
const session = await enhancedLiveStatTrackerService.startLiveGame(
  eventId,    // Your existing event ID
  gameId,     // Optional: link to existing game record
  {
    currentQuarter: 1,
    timeRemaining: 600,
    homeScore: 0,
    awayScore: 0
  }
)
```

### **Step 4: Record Live Stats**
```typescript
// Record a player point
await enhancedLiveStatTrackerService.recordLiveEvent(
  'points',           // Event type
  2,                  // Points scored
  playerId,           // Player ID
  1,                  // Quarter
  120,                // Game time (seconds)
  false,              // Not opponent event
  undefined,          // No opponent jersey
  { shot_type: 'layup' } // Metadata
)

// Record opponent point
await enhancedLiveStatTrackerService.recordLiveEvent(
  'points',
  3,
  undefined,          // No player ID for opponent
  1,
  180,
  true,               // Opponent event
  '23',               // Opponent jersey number
  { shot_type: 'three_pointer' }
)
```

### **Step 5: Update Game State**
```typescript
// Update score, quarter, time, etc.
await enhancedLiveStatTrackerService.updateGameState({
  homeScore: 24,
  awayScore: 18,
  currentQuarter: 2,
  timeRemaining: 480
})
```

### **Step 6: End Game & Sync**
```typescript
// End the live session
await enhancedLiveStatTrackerService.endLiveGame()

// This automatically:
// 1. Ends the live session
// 2. Aggregates all events into game_stats table
// 3. Makes data available in your stats dashboard
```

## 🔄 **How It Works**

### **Live Tracking Flow**
```
1. Start Live Game → Creates session (online + offline)
2. Record Events → Saves to offline storage + tries online sync
3. Update State → Game score, quarter, time updates
4. End Game → Aggregates events into existing game_stats table
```

### **Offline Sync Flow**
```
1. Record offline → Data saved to localStorage
2. Connection restored → Automatic sync to Supabase
3. Data aggregated → Populates existing tables
4. Stats dashboard → Shows all data seamlessly
```

### **Data Flow to Stats Dashboard**
```
Live Events → Database Functions → game_stats Table → Stats Dashboard
     ↓              ↓                    ↓              ↓
Real-time    Automatic        Existing table    Your current
tracking     aggregation      population       UI works unchanged
```

## 📊 **Event Types Supported**

| Event Type | Description | Value | Example |
|------------|-------------|-------|---------|
| `points` | Points scored | Points (2, 3) | `recordLiveEvent('points', 2)` |
| `rebound` | Rebound | 1 | `recordLiveEvent('rebound', 1)` |
| `assist` | Assist | 1 | `recordLiveEvent('assist', 1)` |
| `steal` | Steal | 1 | `recordLiveEvent('steal', 1)` |
| `block` | Block | 1 | `recordLiveEvent('block', 1)` |
| `turnover` | Turnover | 1 | `recordLiveEvent('turnover', 1)` |
| `foul` | Foul | 1 | `recordLiveEvent('foul', 1)` |

## 🎮 **Integration with Existing Live Stat Tracker**

### **Replace Current Offline Storage**
```typescript
// Instead of your current offline storage
// Use the enhanced service

// Before (current)
offlineStorage.saveGameDataOffline(gameData)

// After (enhanced)
await enhancedLiveStatTrackerService.recordLiveEvent(
  'points', 2, playerId, quarter, gameTime
)
```

### **Keep Your Current UI**
- **No changes needed** to player cards
- **No changes needed** to play-by-play
- **No changes needed** to game state display
- **Enhanced service works alongside** existing code

## 🔧 **Advanced Features**

### **Get Team Totals**
```typescript
const teamTotals = await enhancedLiveStatTrackerService.getTeamTotals()
// Returns quarter-by-quarter team stats
```

### **Offline Data Management**
```typescript
// Get current session offline data
const offlineData = enhancedLiveStatTrackerService.getCurrentSessionOfflineData()

// Get all offline sessions
const allSessions = enhancedLiveStatTrackerService.getOfflineSessions()

// Clear all offline data
enhancedLiveStatTrackerService.clearAllOfflineData()

// Check storage usage
const usage = enhancedLiveStatTrackerService.getStorageUsage()
```

## 🚨 **Important Notes**

### **Database Functions**
The migration creates two key functions:
- `aggregate_live_events_to_game_stats(session_id)` - Aggregates live events into existing `game_stats` table
- `get_team_totals_from_live_events(session_id)` - Calculates team totals from live events

### **Automatic Aggregation**
When you call `endLiveGame()`, the system automatically:
1. Aggregates all live events into your existing `game_stats` table
2. Ensures your stats dashboard shows all data
3. Maintains compatibility with existing queries

### **Offline Storage**
- **5MB estimated capacity** (typical localStorage limit)
- **Automatic cleanup** when sessions end
- **No manual management** required

## 🎯 **Next Steps**

1. **Run the migration** in Supabase
2. **Import the service** into your live stat tracker
3. **Replace offline storage calls** with enhanced service calls
4. **Test offline functionality** by disconnecting internet
5. **Verify stats dashboard** shows all data after sync

## 🔍 **Troubleshooting**

### **Common Issues**
- **Migration fails**: Check if tables already exist (use `IF NOT EXISTS`)
- **Service not working**: Verify Supabase environment variables
- **Offline not saving**: Check localStorage permissions
- **Stats not showing**: Verify `endLiveGame()` was called

### **Debug Commands**
```typescript
// Check current session
console.log(enhancedLiveStatTrackerService.getCurrentSessionKey())

// Check offline data
console.log(enhancedLiveStatTrackerService.getCurrentSessionOfflineData())

// Check storage usage
console.log(enhancedLiveStatTrackerService.getStorageUsage())
```

This enhanced system gives you **full-stack live stat tracking** while preserving your existing infrastructure and ensuring **100% offline capability** with automatic sync to your stats dashboard!
