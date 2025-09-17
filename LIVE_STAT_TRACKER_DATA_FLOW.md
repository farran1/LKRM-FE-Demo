# Live Stat Tracker - Data Flow Documentation

## Overview
This document explains how data flows through the Live Stat Tracker system, from user interaction to database storage.

## Data Flow Architecture

```
User Interaction → Player Selection → Action Recording → Event Processing → Database Storage
```

## 1. Player Selection Flow

### Step 1: User Clicks on Player
```typescript
// User clicks on a player card
<div onClick={() => selectPlayer(player)}>
  {player.name}
</div>
```

### Step 2: selectPlayer Function
```typescript
const selectPlayer = (player: Player) => {
  console.log('🎯 Player selected:', player.name, 'ID:', player.id)
  
  // Check if lineup exists
  if (!currentLineup) {
    setShowLineupBuilder(true)
    return
  }
  
  // Clear opponent selection
  setSelectedOpponentSlot(null)
  // Set new player selection
  setSelectedPlayer(player)
}
```

### Step 3: UI Updates
- Player card gets highlighted with `selected` class
- Action buttons become enabled
- Selected player info is displayed

## 2. Action Recording Flow

### Step 1: User Clicks Action Button
```typescript
// User clicks "2PT Made" button
<Button onClick={() => recordAction('fg_made')}>
  2PT Made
</Button>
```

### Step 2: recordAction Function
```typescript
const recordAction = (eventType: string) => {
  console.log('🎬 Action button clicked:', eventType)
  
  // Check if game is started
  if (!gameState.isPlaying) {
    message.info('Please start the game first')
    return
  }
  
  // Handle different event types with modals
  if (eventType === 'fg_made' && settings.askForPointsInPaint) {
    setShowPipModal(true)
    return
  }
  
  // Direct recording for simple events
  if (canRecordOpponent) {
    handleOpponentStatEvent(opponentOnCourt[selectedOpponentSlot!], eventType)
  } else if (selectedPlayer) {
    handleStatEvent(selectedPlayer.id, eventType)
  }
}
```

## 3. Modal Processing Flow

### For Complex Events (Assist, Rebound, etc.)

#### Step 1: Modal Opens
```typescript
// Example: Assist modal
if (eventType === 'fg_made') {
  setPendingAssistEvent({ 
    eventType, 
    playerId: selectedPlayer?.id, 
    isOpponent: canRecordOpponent 
  })
  setShowAssistModal(true)
}
```

#### Step 2: User Selects Additional Data
```typescript
// User selects who got the assist
const handleAssistConfirm = (assistPlayerId: number | null) => {
  console.log('🎯 Assist modal confirmed:', assistPlayerId)
  
  if (pendingAssistEvent) {
    const { eventType, playerId, isOpponent } = pendingAssistEvent
    
    // Record the field goal
    handleStatEvent(playerId, eventType, 2, false, { assist: assistPlayerId })
    
    // Record the assist
    if (assistPlayerId) {
      handleStatEvent(assistPlayerId, 'assist', 1, false)
    }
  }
}
```

## 4. Event Processing Flow

### Step 1: handleStatEvent Function
```typescript
const handleStatEvent = useCallback((playerId: number, eventType: string, value?: number, isOpponent: boolean = false, metadata?: any) => {
  const player = players.find(p => p.id === playerId)
  if (!player) return

  // Create event object
  const newEvent = {
    id: Date.now(),
    playerId,
    playerName: player.name,
    eventType,
    value: value || 0,
    quarter: gameState.quarter,
    timestamp: new Date().toLocaleTimeString(),
    isOpponent,
    metadata
  }

  // Add to events array
  setEvents(prev => [newEvent, ...prev])
  
  // Save to database in real-time
  saveEventToDatabase(
    eventType,
    playerId,
    value || 0,
    gameState.quarter,
    Math.floor((defaultSettings.quarterDuration * 60) - gameState.currentTime),
    isOpponent
  )
  
  // Update player stats
  updatePlayerStats(playerId, eventType, value)
}, [gameState, players, liveSessionKey, gameId])
```

### Step 2: Database Saving
```typescript
const saveEventToDatabase = async (eventType: string, playerId: number | null, eventValue: number, quarter: number, gameTime: number, isOpponent: boolean = false) => {
  // Get session ID
  const sessionResponse = await fetch(`/api/live-stat-tracker?type=session&sessionKey=${liveSessionKey}`)
  const sessionData = await sessionResponse.json()
  const sessionId = sessionData.data.id

  // Save event to database
  const response = await fetch('/api/live-stat-tracker', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'record_event',
      data: {
        sessionId: sessionId,
        playerId: playerId,
        eventType: eventType,
        eventValue: eventValue,
        quarter: quarter,
        gameTime: gameTime,
        isOpponentEvent: isOpponent,
        opponentJersey: isOpponent ? 'OPP' : null,
        metadata: {}
      }
    })
  })
}
```

## 5. Database Storage Flow

### Step 1: API Endpoint Processing
```typescript
// /api/live-stat-tracker/route.ts
case 'record-event':
  const { data: event, error: eventError } = await supabase
    .from('live_game_events')
    .insert({
      session_id: data.sessionId,
      player_id: data.playerId,
      event_type: data.eventType,
      event_value: data.eventValue,
      quarter: data.quarter,
      game_time: data.gameTime,
      is_opponent_event: data.isOpponentEvent,
      opponent_jersey: data.opponentJersey,
      metadata: data.metadata
    })
    .select()
    .single()
```

### Step 2: Database Tables
- `live_game_events` - Individual events
- `live_game_sessions` - Game sessions
- `games` - Game records
- `players` - Player information

## 6. Real-time Updates Flow

### Step 1: UI Updates
- Play-by-play feed updates
- Player stats update
- Team stats update
- Game state updates

### Step 2: Data Persistence
- Events saved to database
- Offline storage backup
- Session management

## Testing the Data Flow

### Test Steps:
1. **Start a live game session**
2. **Select a player** - Check console for "🎯 Player selected"
3. **Click an action button** - Check console for "🎬 Action button clicked"
4. **Complete modal if needed** - Check console for "🎯 Modal confirmed"
5. **Verify database save** - Check console for "📊 Event saved successfully"
6. **Check play-by-play** - Verify event appears in timeline

### Console Logs to Watch:
- `🎯 Player selected: [Player Name] ID: [ID]`
- `🎬 Action button clicked: [Event Type]`
- `📊 Recording team event: [Event Type] for player: [Player Name]`
- `📊 Event saved successfully: [Event Type] [Player ID] [Value]`
- `Event recorded successfully: [Event Data]`

## Common Issues and Solutions

### Issue 1: "No player selected" error
**Solution**: Ensure a player is selected before clicking action buttons

### Issue 2: "Game not started" error
**Solution**: Start the game timer before recording actions

### Issue 3: Database save failures
**Solution**: Check console for specific error messages and verify database connection

### Issue 4: Modal not saving data
**Solution**: Ensure modal completion functions are properly called

## Data Validation

### Required Fields:
- `playerId` - Must be valid player ID
- `eventType` - Must be valid event type
- `quarter` - Must be 1-4
- `gameTime` - Must be positive number
- `sessionId` - Must be valid session ID

### Event Types:
- `fg_made` - Field goal made
- `fg_missed` - Field goal missed
- `three_made` - Three pointer made
- `three_missed` - Three pointer missed
- `ft_made` - Free throw made
- `ft_missed` - Free throw missed
- `assist` - Assist
- `rebound` - Rebound
- `steal` - Steal
- `block` - Block
- `turnover` - Turnover
- `foul` - Foul

This documentation should help you understand and debug the data flow in the Live Stat Tracker system.



